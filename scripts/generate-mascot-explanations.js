/**
 * generate-mascot-explanations.js — Generate mascot explanations for every slide
 *
 * Uses Google Gemini Flash to generate age-appropriate explanations for each slide.
 * Each mascot has a unique personality/voice matched to the grade band.
 *
 * Usage:
 *   GOOGLE_API_KEY=xxx node scripts/generate-mascot-explanations.js
 *   node scripts/generate-mascot-explanations.js --level primary
 *   node scripts/generate-mascot-explanations.js --dry-run
 *   node scripts/generate-mascot-explanations.js --force
 *   node scripts/generate-mascot-explanations.js --week 5
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================================
// Configuration
// ============================================================================

const DATA_DIR = path.join(__dirname, 'data');
const LEVELS = ['primary-lessons', 'lower-elementary-lessons', 'upper-elementary-lessons'];
const PROGRESS_FILE = path.join(DATA_DIR, 'mascot-text-progress.json');

const GOOGLE_KEY = process.env.GOOGLE_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_KEY}`;

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LEVEL_FILTER = args.includes('--level') ? args[args.indexOf('--level') + 1] : null;
const FORCE = args.includes('--force');
const WEEK_FILTER = args.includes('--week') ? parseInt(args[args.indexOf('--week') + 1], 10) : null;
const BATCH_SIZE = 5; // slides per API call

// ============================================================================
// Mascot personalities (system prompts)
// ============================================================================

const MASCOT_PROMPTS = {
  'primary-lessons': {
    name: 'Benny Bear',
    emoji: '\u{1F43B}',
    system: `You are Benny Bear, a warm and playful friend who helps kindergarteners (ages 3-6) understand their lessons.

YOUR JOB: Completely explain what the child is looking at on this slide and what they need to do. Do NOT just repeat what is on the slide — instead, explain it like you are a loving teacher sitting next to the child, walking them through everything step by step.

RULES:
- Use VERY simple language a 3-4 year old can understand (short sentences, simple words)
- Explain WHAT they see on the screen ("You see some pictures of things we need!")
- Explain WHY it matters ("We use these to learn how to pour water carefully!")
- Explain WHAT TO DO next ("Ask your mommy or daddy to help you find these things!")
- Be warm, encouraging, and patient — assume the child has never done this before
- Say "we" and "let's" to feel like you're doing it together
- 3-5 sentences total — enough to fully explain, not so long they lose interest
- If it's a materials slide, explain what each thing is for in simple terms
- If it's an activity, break down exactly what to do in toddler-friendly steps
- If it's instructions, rephrase everything simply — no big words

Examples of your style:
"Look! These are the things we need for our fun activity today! See the little cup? We are going to practice pouring water from one cup to another — just like a grown-up! Ask your mommy or daddy to put some water in the big cup, and then YOU get to pour it into the little cup. Go nice and slow — you can do it!"`,
  },
  'lower-elementary-lessons': {
    name: 'Ollie Owl',
    emoji: '\u{1F989}',
    system: `You are Ollie Owl, a curious and enthusiastic guide who helps kids ages 6-9 understand their lessons.

YOUR JOB: Completely explain what the child is looking at on this slide and what they need to do. Do NOT just repeat what is on the slide — instead, be like a fun, smart friend who makes sure they totally understand everything before moving on.

RULES:
- Explain WHAT they're looking at ("This slide is showing you the steps for our science experiment!")
- Explain WHY it matters and connect to things they know ("This is how real scientists figure things out too!")
- Explain WHAT TO DO — give clear, specific actions ("First, grab your magnifying glass. Then look really closely at the leaf...")
- Use vocabulary appropriate for 1st-3rd graders but don't talk down to them
- Be curious and excited — spark wonder ("Isn't it amazing that plants can actually drink water through their stems?")
- 3-6 sentences — thorough enough that even a struggling reader would understand after hearing this
- If it's a materials slide, explain what each thing is and why they need it
- If it's an activity, break down the steps clearly so they know exactly what to do
- If it's check understanding, encourage them and hint at how to think about the questions

Examples of your style:
"Okay, this is the fun part — the experiment! See those steps on the screen? Here's what you're going to do: First, take your celery stalk and put it in the cup of colored water. Then we wait and watch! Over the next few hours, the colored water is going to travel UP through the celery — you'll actually see it change color! This happens because plants have tiny tubes inside them that suck up water, kind of like drinking through a straw. How cool is that?"`,
  },
  'upper-elementary-lessons': {
    name: 'Finn Fox',
    emoji: '\u{1F98A}',
    system: `You are Finn Fox, a cool and friendly mentor who helps kids ages 9-12 fully understand their lessons.

YOUR JOB: Completely explain what the student is looking at on this slide and what they need to do. Do NOT just repeat what is on the slide — instead, be like a smart older friend who breaks things down clearly, makes real-world connections, and makes sure even someone who's struggling with this topic would get it.

RULES:
- Explain WHAT they're looking at and put it in context ("This slide is walking you through long division — it looks complicated but it's actually just a series of simple steps")
- Explain WHY it matters with real-world connections ("You use this every time you split something equally, like dividing pizza slices among friends")
- Explain WHAT TO DO — give clear guidance so they know exactly how to proceed
- Respect their intelligence — don't be babyish, but DO make sure everything is crystal clear
- Be conversational and relatable — like a cool tutor, not a textbook
- 3-6 sentences — detailed enough that a student who's totally lost would understand after hearing this
- If it's a materials slide, explain the purpose of each item
- If it's an activity, walk through the approach and any tricky parts
- If it's check understanding, help them think through how to approach the questions

Examples of your style:
"Alright, so this slide is showing you how to find the area of irregular shapes — and I know that sounds intimidating, but here's the trick: you just break the weird shape into rectangles and triangles that you already know how to solve. Look at the shape on screen — see how you could draw a line right there and turn it into two rectangles? Find the area of each one separately, then add them together. That's literally all there is to it. Try it with the practice shape and you'll see how quick it gets once you know the trick."`,
  },
};

// ============================================================================
// Helpers
// ============================================================================

function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function getSlideContext(slide) {
  const parts = [`Slide type: ${slide.type}`];

  // Title slide fields
  if (slide.heading || slide.title) parts.push(`Title: ${slide.heading || slide.title}`);
  if (slide.subheading || slide.subtitle) parts.push(`Subtitle: ${slide.subheading || slide.subtitle}`);

  // Materials slide fields
  if (slide.items) parts.push(`Materials list: ${slide.items.join(', ')}`);
  if (slide.materials) parts.push(`Materials list: ${slide.materials.join(', ')}`);
  if (slide.setup_instructions) parts.push(`Setup: ${slide.setup_instructions}`);

  // Instruction slide fields — full text, no truncation
  if (slide.step) parts.push(`Step number: ${slide.step}`);
  if (slide.text) parts.push(`Instructions: ${slide.text}`);
  if (slide.content) parts.push(`Content: ${slide.content}`);
  if (slide.demonstration_notes) parts.push(`Teacher notes: ${slide.demonstration_notes}`);

  // Activity slide fields
  if (slide.prompt) parts.push(`Activity: ${slide.prompt}`);
  if (slide.instructions) parts.push(`Activity: ${slide.instructions}`);
  if (slide.duration_minutes) parts.push(`Time: ${slide.duration_minutes} minutes`);

  // Check understanding fields
  if (slide.questions) parts.push(`Questions: ${slide.questions.join('; ')}`);
  if (slide.expected_responses) parts.push(`Expected answers: ${slide.expected_responses.join('; ')}`);

  // Wrap up fields
  if (slide.summary) parts.push(`Summary: ${slide.summary}`);
  if (slide.mastery_check) parts.push(`Mastery check: ${slide.mastery_check}`);
  if (slide.next_steps) parts.push(`Next steps: ${slide.next_steps}`);
  if (slide.extension_activities) parts.push(`Extensions: ${slide.extension_activities.join('; ')}`);

  return parts.join('\n');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function geminiRequest(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(GEMINI_URL);

    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (res.statusCode !== 200) {
              reject(new Error(`Gemini API ${res.statusCode}: ${JSON.stringify(json.error || json)}`));
              return;
            }
            resolve(json);
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ============================================================================
// Batch generate explanations for a set of slides
// ============================================================================

async function generateBatch(slides, lessonContext, subject, mascotConfig) {
  const slideDescriptions = slides
    .map((s, i) => `[Slide ${i + 1} of ${slides.length}]\n${getSlideContext(s)}`)
    .join('\n\n');

  const userPrompt = `LESSON CONTEXT:
${lessonContext}
Subject: ${subject}

THE CHILD IS GOING THROUGH THIS LESSON SLIDE BY SLIDE. For EACH slide below, write a COMPLETE explanation as if you are sitting right next to the child, helping them understand:

1. WHAT they are looking at on this slide — describe it in your own words
2. WHY it matters — connect it to something they understand, make it meaningful
3. WHAT they need to DO — specific, clear actions they should take right now

CRITICAL RULES:
- Do NOT repeat the slide text word-for-word. REPHRASE everything in your own child-friendly words.
- For a materials slide: name each item, explain what it is if they might not know ("that's a small glass jug for pouring"), explain why they need it, and tell them to go get everything with a parent's help.
- For instruction steps: break down the action into simple sub-steps. If the slide says "Pour slowly," explain HOW to pour slowly ("Hold the handle tight, tip it just a tiny bit, and watch the water come out like a little waterfall").
- For activities: give them confidence ("You've got this!"), explain exactly what success looks like, and what to do if they mess up ("If some water spills, that's totally okay — just use your sponge!").
- For wrap-up: celebrate specifically what they accomplished, not just generic praise. Remind them of the coolest thing they did.
- Remember this is being READ ALOUD as audio — write naturally, as spoken language, not written text.

${slideDescriptions}

Respond with EXACTLY ${slides.length} explanations, numbered. Each should be 3-6 natural spoken sentences.
1. [explanation for slide 1]
2. [explanation for slide 2]
...

IMPORTANT: Return ONLY the numbered list. No intro, no outro, no markdown.`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: mascotConfig.system }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const response = await geminiRequest(body);
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Parse numbered list
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^\d+[\.\)]\s/.test(l));

  return lines.map((l) => l.replace(/^\d+[\.\)]\s*/, '').trim());
}

// ============================================================================
// Process a single week file
// ============================================================================

async function processWeekFile(filePath, levelDir, progress) {
  const weekName = path.basename(filePath, '.json');
  const progressKey = `${levelDir}/${weekName}`;

  if (!FORCE && progress[progressKey] === 'done') {
    return { skipped: true, slides: 0 };
  }

  const weekData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const mascotConfig = MASCOT_PROMPTS[levelDir];
  let totalSlides = 0;
  let generated = 0;

  // Week files are flat arrays of lessons, not { lessons: [...] }
  const lessons = Array.isArray(weekData) ? weekData : (weekData.lessons || []);

  for (const lesson of lessons) {
    const slides = lesson.slide_content?.slides || lesson.slides || [];
    if (slides.length === 0) continue;

    // Check if already has explanations (unless --force)
    if (!FORCE && slides[0].mascot_explanation) continue;

    // Send ALL slides for one lesson in a single batch — they need lesson context together
    // (avg ~8 slides per lesson, Gemini can handle this easily)
    const subject = lesson.subject || lesson.subject_name || 'general';
    const lessonContext = [
      lesson.title,
      lesson.description ? `Description: ${lesson.description}` : '',
      lesson.instructions ? `Lesson instructions: ${lesson.instructions}` : '',
    ].filter(Boolean).join('\n');

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would generate ${slides.length} explanations for "${lesson.title}"`);
      totalSlides += slides.length;
      continue;
    }

    try {
      const explanations = await generateBatch(slides, lessonContext, subject, mascotConfig);

      // Write explanations back to slides
      for (let j = 0; j < slides.length; j++) {
        if (explanations[j]) {
          slides[j].mascot_explanation = explanations[j];
          generated++;
        }
      }

      totalSlides += slides.length;

      // Rate limit: ~200ms between requests to stay within Gemini quota
      await sleep(200);
    } catch (err) {
      console.error(`\n    ERROR generating for "${lesson.title}": ${err.message}`);
      // Continue with next lesson rather than failing entirely
      await sleep(2000);
    }
  }

  // Write updated file (preserves original structure — array or object)
  if (!DRY_RUN && generated > 0) {
    fs.writeFileSync(filePath, JSON.stringify(weekData, null, 2));
  }

  if (!DRY_RUN) {
    progress[progressKey] = 'done';
    saveProgress(progress);
  }

  return { skipped: false, slides: totalSlides, generated };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('=== Mascot Explanation Generator ===');
  console.log(`Model: ${GEMINI_MODEL}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Force: ${FORCE}`);
  if (LEVEL_FILTER) console.log(`Level filter: ${LEVEL_FILTER}`);
  if (WEEK_FILTER) console.log(`Week filter: ${WEEK_FILTER}`);
  console.log();

  if (!GOOGLE_KEY && !DRY_RUN) {
    console.error('ERROR: GOOGLE_API_KEY environment variable is required');
    process.exit(1);
  }

  const progress = loadProgress();
  let totalSlides = 0;
  let totalGenerated = 0;
  let totalSkipped = 0;

  const levels = LEVEL_FILTER
    ? LEVELS.filter((l) => l.includes(LEVEL_FILTER))
    : LEVELS;

  for (const levelDir of levels) {
    const levelPath = path.join(DATA_DIR, levelDir);
    if (!fs.existsSync(levelPath)) {
      console.log(`Skipping ${levelDir} (directory not found)`);
      continue;
    }

    const mascotConfig = MASCOT_PROMPTS[levelDir];
    console.log(`\n--- ${levelDir} (${mascotConfig.emoji} ${mascotConfig.name}) ---`);

    const weekFiles = fs
      .readdirSync(levelPath)
      .filter((f) => f.startsWith('week-') && f.endsWith('.json'))
      .sort();

    for (const weekFile of weekFiles) {
      // Apply week filter
      if (WEEK_FILTER) {
        const weekNum = parseInt(weekFile.replace('week-', '').replace('.json', ''), 10);
        if (weekNum !== WEEK_FILTER) continue;
      }

      const filePath = path.join(levelPath, weekFile);
      process.stdout.write(`  ${weekFile}... `);

      const result = await processWeekFile(filePath, levelDir, progress);

      if (result.skipped) {
        console.log('(already done)');
        totalSkipped++;
      } else {
        console.log(`${result.generated || 0} explanations generated (${result.slides} slides)`);
        totalSlides += result.slides;
        totalGenerated += result.generated || 0;
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total slides processed: ${totalSlides}`);
  console.log(`Total explanations generated: ${totalGenerated}`);
  console.log(`Weeks skipped (already done): ${totalSkipped}`);
  if (DRY_RUN) console.log('(DRY RUN — no files were modified)');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
