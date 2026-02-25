/**
 * generate-mascot-audio.js — Generate MP3 audio for every mascot explanation
 *
 * Reads mascot_explanation from each slide, sends to ElevenLabs TTS,
 * uploads MP3 to Supabase Storage, writes mascot_audio_url back to JSON.
 *
 * Prerequisites:
 *   - mascot_explanation fields already populated (run generate-mascot-explanations.js first)
 *   - ElevenLabs API key (Creator plan, $11/mo)
 *   - Supabase Storage bucket "mascot-audio" created (public read)
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set
 *
 * Usage:
 *   ELEVENLABS_API_KEY=xxx SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/generate-mascot-audio.js
 *   node scripts/generate-mascot-audio.js --level primary
 *   node scripts/generate-mascot-audio.js --dry-run
 *   node scripts/generate-mascot-audio.js --force
 *   node scripts/generate-mascot-audio.js --week 5
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================================
// Configuration
// ============================================================================

const DATA_DIR = path.join(__dirname, 'data');
const LEVELS = ['primary-lessons', 'lower-elementary-lessons', 'upper-elementary-lessons'];
const PROGRESS_FILE = path.join(DATA_DIR, 'mascot-audio-progress.json');

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const STORAGE_BUCKET = 'mascot-audio';

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LEVEL_FILTER = args.includes('--level') ? args[args.indexOf('--level') + 1] : null;
const FORCE = args.includes('--force');
const WEEK_FILTER = args.includes('--week') ? parseInt(args[args.indexOf('--week') + 1], 10) : null;

// ============================================================================
// Voice IDs per level (set these after browsing ElevenLabs voice library)
// ============================================================================

const VOICE_IDS = {
  'primary-lessons': process.env.ELEVENLABS_VOICE_PRIMARY || '',
  'lower-elementary-lessons': process.env.ELEVENLABS_VOICE_LOWER_EL || '',
  'upper-elementary-lessons': process.env.ELEVENLABS_VOICE_UPPER_EL || '',
};

const LEVEL_SHORTNAMES = {
  'primary-lessons': 'primary',
  'lower-elementary-lessons': 'lower-el',
  'upper-elementary-lessons': 'upper-el',
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call ElevenLabs TTS API — returns MP3 buffer
 */
function elevenLabsTTS(text, voiceId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true,
      },
    });

    const req = https.request(
      {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${voiceId}`,
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (res.statusCode !== 200) {
            reject(new Error(`ElevenLabs ${res.statusCode}: ${buffer.toString('utf-8').slice(0, 200)}`));
            return;
          }
          resolve(buffer);
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Upload MP3 buffer to Supabase Storage — returns public URL
 */
function uploadToSupabase(buffer, storagePath) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`);

    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length,
          'x-upsert': 'true',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode !== 200 && res.statusCode !== 201) {
            reject(new Error(`Supabase upload ${res.statusCode}: ${body.slice(0, 200)}`));
            return;
          }
          // Construct public URL
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
          resolve(publicUrl);
        });
      }
    );
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

// ============================================================================
// Process a single week file
// ============================================================================

async function processWeekFile(filePath, levelDir, progress) {
  const weekName = path.basename(filePath, '.json');
  const progressKey = `${levelDir}/${weekName}`;
  const levelShort = LEVEL_SHORTNAMES[levelDir];
  const voiceId = VOICE_IDS[levelDir];

  if (!FORCE && progress[progressKey] === 'done') {
    return { skipped: true, count: 0 };
  }

  if (!voiceId && !DRY_RUN) {
    console.log(`  WARNING: No voice ID set for ${levelDir} — skipping`);
    return { skipped: true, count: 0 };
  }

  const weekData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let generated = 0;
  let errors = 0;
  let consecutiveErrors = 0;

  // Week files are flat arrays of lessons, not { lessons: [...] }
  const lessons = Array.isArray(weekData) ? weekData : (weekData.lessons || []);

  // Count total slides needing audio
  let totalNeeded = 0;
  for (const lesson of lessons) {
    const slides = lesson.slide_content?.slides || lesson.slides || [];
    for (const slide of slides) {
      if (slide.mascot_explanation && (FORCE || !slide.mascot_audio_url)) totalNeeded++;
    }
  }

  for (let li = 0; li < lessons.length; li++) {
    const lesson = lessons[li];
    const slides = lesson.slide_content?.slides || lesson.slides || [];

    for (let si = 0; si < slides.length; si++) {
      const slide = slides[si];

      // Skip if no explanation text
      if (!slide.mascot_explanation) continue;

      // Skip if already has audio URL (unless --force)
      if (!FORCE && slide.mascot_audio_url) continue;

      const storagePath = `${levelShort}/${weekName}-lesson${String(li + 1).padStart(2, '0')}-slide${String(si + 1).padStart(2, '0')}.mp3`;

      if (DRY_RUN) {
        console.log(`    [DRY RUN] Would generate audio: ${storagePath}`);
        console.log(`      Text: "${slide.mascot_explanation.slice(0, 60)}..."`);
        generated++;
        continue;
      }

      try {
        // Generate audio
        const mp3Buffer = await elevenLabsTTS(slide.mascot_explanation, voiceId);

        // Upload to Supabase
        const publicUrl = await uploadToSupabase(mp3Buffer, storagePath);

        // Write URL back to slide
        slide.mascot_audio_url = publicUrl;
        generated++;
        consecutiveErrors = 0; // Reset on success

        if (generated % 25 === 0) {
          process.stdout.write(` [${generated}/${totalNeeded}]`);
        }

        // Save file every 50 slides as checkpoint
        if (generated % 50 === 0) {
          fs.writeFileSync(filePath, JSON.stringify(weekData, null, 2));
        }

        // Rate limit: 100ms between ElevenLabs calls
        await sleep(100);
      } catch (err) {
        errors++;
        consecutiveErrors++;
        console.error(`\n    ERROR ${storagePath}: ${err.message}`);

        // If 10+ consecutive errors, likely quota exhausted — abort this week
        if (consecutiveErrors >= 10) {
          console.error(`\n    ABORTING ${weekName}: ${consecutiveErrors} consecutive errors (quota likely exhausted)`);
          // Save what we have so far
          if (generated > 0) {
            fs.writeFileSync(filePath, JSON.stringify(weekData, null, 2));
          }
          return { skipped: false, count: generated, errors, aborted: true };
        }

        // Wait longer after errors (exponential backoff up to 5s)
        await sleep(Math.min(500 * consecutiveErrors, 5000));
      }
    }
  }

  // Write updated file
  if (!DRY_RUN && generated > 0) {
    fs.writeFileSync(filePath, JSON.stringify(weekData, null, 2));
  }

  // Only mark as done if ALL slides got audio (no errors on needed slides)
  if (!DRY_RUN && errors === 0) {
    progress[progressKey] = 'done';
    saveProgress(progress);
  }

  return { skipped: false, count: generated, errors };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('=== Mascot Audio Generator ===');
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Force: ${FORCE}`);
  if (LEVEL_FILTER) console.log(`Level filter: ${LEVEL_FILTER}`);
  if (WEEK_FILTER) console.log(`Week filter: ${WEEK_FILTER}`);
  console.log();

  if (!DRY_RUN) {
    if (!ELEVENLABS_KEY) {
      console.error('ERROR: ELEVENLABS_API_KEY environment variable is required');
      process.exit(1);
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
      process.exit(1);
    }

    // Check voice IDs
    const levels = LEVEL_FILTER ? LEVELS.filter((l) => l.includes(LEVEL_FILTER)) : LEVELS;
    for (const level of levels) {
      if (!VOICE_IDS[level]) {
        console.warn(`WARNING: No voice ID for ${level}. Set ELEVENLABS_VOICE_${LEVEL_SHORTNAMES[level].toUpperCase().replace('-', '_')}`);
      }
    }
  }

  const progress = loadProgress();
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

    console.log(`\n--- ${levelDir} ---`);

    const weekFiles = fs
      .readdirSync(levelPath)
      .filter((f) => f.startsWith('week-') && f.endsWith('.json'))
      .sort();

    for (const weekFile of weekFiles) {
      if (WEEK_FILTER) {
        const weekNum = parseInt(weekFile.replace('week-', '').replace('.json', ''), 10);
        if (weekNum !== WEEK_FILTER) continue;
      }

      const filePath = path.join(levelPath, weekFile);
      process.stdout.write(`  ${weekFile}...`);

      const result = await processWeekFile(filePath, levelDir, progress);

      if (result.skipped) {
        console.log(' (already done)');
        totalSkipped++;
      } else if (result.aborted) {
        console.log(` ${result.count} generated, ABORTED (${result.errors} errors)`);
        totalGenerated += result.count;
        console.error('\n!!! API quota likely exhausted. Check ElevenLabs dashboard and re-run to resume. !!!');
        // Stop processing further weeks
        break;
      } else {
        const errMsg = result.errors ? ` (${result.errors} errors)` : '';
        console.log(` ${result.count} audio files generated${errMsg}`);
        totalGenerated += result.count;
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total audio files generated: ${totalGenerated}`);
  console.log(`Weeks skipped (already done): ${totalSkipped}`);
  if (DRY_RUN) console.log('(DRY RUN — no files were modified)');
  if (!DRY_RUN && totalGenerated > 0) {
    console.log(`\nAudio files stored in Supabase Storage bucket: ${STORAGE_BUCKET}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
