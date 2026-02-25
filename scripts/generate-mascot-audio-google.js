/**
 * generate-mascot-audio-google.js — Generate MP3 audio via Google Cloud TTS
 *
 * Reads mascot_explanation from each slide, sends to Google Cloud Text-to-Speech,
 * uploads MP3 to Supabase Storage, writes mascot_audio_url back to JSON.
 *
 * Voices (user-selected):
 *   - Betsy Bear (primary):          en-US-Neural2-H, pitch +3st, rate 95%
 *   - Ollie Owl (lower elementary):  en-US-Neural2-I, pitch +1st, rate medium
 *   - Finn Fox (upper elementary):   en-US-Neural2-I, pitch -1st, rate medium
 *
 * Usage:
 *   GOOGLE_API_KEY=xxx SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/generate-mascot-audio-google.js
 *   node scripts/generate-mascot-audio-google.js --level primary
 *   node scripts/generate-mascot-audio-google.js --dry-run
 *   node scripts/generate-mascot-audio-google.js --force
 *   node scripts/generate-mascot-audio-google.js --week 5
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================================
// Configuration
// ============================================================================

const DATA_DIR = path.join(__dirname, 'data');
const LEVELS = ['primary-lessons', 'lower-elementary-lessons', 'upper-elementary-lessons'];
const PROGRESS_FILE = path.join(DATA_DIR, 'mascot-audio-progress-google.json');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
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
// Voice config per level — SSML wrapping for character personality
// ============================================================================

const VOICE_CONFIG = {
  'primary-lessons': {
    // Betsy Bear: playful, warm, fun friend for kindergartners
    voiceName: 'en-US-Neural2-H',
    ssmlGender: 'FEMALE',
    wrapSSML: (text) =>
      `<speak><prosody rate="95%" pitch="+3st">${escapeXml(text)}</prosody></speak>`,
  },
  'lower-elementary-lessons': {
    // Ollie Owl: enthusiastic but grounded for ages 6-9
    voiceName: 'en-US-Neural2-I',
    ssmlGender: 'MALE',
    wrapSSML: (text) =>
      `<speak><prosody rate="medium" pitch="+1st">${escapeXml(text)}</prosody></speak>`,
  },
  'upper-elementary-lessons': {
    // Finn Fox: friendly teacher, confident, clear for ages 9-12
    voiceName: 'en-US-Neural2-I',
    ssmlGender: 'MALE',
    wrapSSML: (text) =>
      `<speak><prosody rate="medium" pitch="-1st">${escapeXml(text)}</prosody></speak>`,
  },
};

const LEVEL_SHORTNAMES = {
  'primary-lessons': 'primary',
  'lower-elementary-lessons': 'lower-el',
  'upper-elementary-lessons': 'upper-el',
};

// ============================================================================
// Helpers
// ============================================================================

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

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
 * Call Google Cloud Text-to-Speech API — returns MP3 buffer
 */
function googleTTS(ssml, voiceName, ssmlGender) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      input: { ssml },
      voice: {
        languageCode: 'en-US',
        name: voiceName,
        ssmlGender,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        sampleRateHertz: 24000,
      },
    });

    const req = https.request(
      {
        hostname: 'texttospeech.googleapis.com',
        path: `/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(new Error(`Google TTS ${json.error.code}: ${json.error.message}`));
              return;
            }
            if (!json.audioContent) {
              reject(new Error('Google TTS: No audioContent in response'));
              return;
            }
            resolve(Buffer.from(json.audioContent, 'base64'));
          } catch (e) {
            reject(new Error(`Google TTS parse error: ${e.message}`));
          }
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
    const url = new URL(
      `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`
    );

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
            reject(
              new Error(`Supabase upload ${res.statusCode}: ${body.slice(0, 200)}`)
            );
            return;
          }
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
  const voiceConfig = VOICE_CONFIG[levelDir];

  if (!FORCE && progress[progressKey] === 'done') {
    return { skipped: true, count: 0 };
  }

  const weekData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let generated = 0;
  let errors = 0;
  let consecutiveErrors = 0;

  // Week files: keys are "0", "1", ... "24" with lesson objects
  const lessonKeys = Object.keys(weekData).filter(
    (k) => weekData[k] && weekData[k].title
  );
  lessonKeys.sort((a, b) => Number(a) - Number(b));

  // Count total slides needing audio
  let totalNeeded = 0;
  for (const key of lessonKeys) {
    const lesson = weekData[key];
    const slides = lesson.slide_content?.slides || [];
    for (const slide of slides) {
      if (slide.mascot_explanation && (FORCE || !slide.mascot_audio_url)) {
        totalNeeded++;
      }
    }
  }

  if (totalNeeded === 0) {
    // All slides already have audio
    if (!DRY_RUN) {
      progress[progressKey] = 'done';
      saveProgress(progress);
    }
    return { skipped: false, count: 0, errors: 0 };
  }

  for (const key of lessonKeys) {
    const lesson = weekData[key];
    const slides = lesson.slide_content?.slides || [];

    for (let si = 0; si < slides.length; si++) {
      const slide = slides[si];

      if (!slide.mascot_explanation) continue;
      if (!FORCE && slide.mascot_audio_url) continue;

      const li = Number(key);
      const storagePath = `${levelShort}/${weekName}-lesson${String(li + 1).padStart(2, '0')}-slide${String(si + 1).padStart(2, '0')}.mp3`;

      if (DRY_RUN) {
        console.log(`    [DRY RUN] ${storagePath}`);
        generated++;
        continue;
      }

      try {
        const ssml = voiceConfig.wrapSSML(slide.mascot_explanation);
        const mp3Buffer = await googleTTS(
          ssml,
          voiceConfig.voiceName,
          voiceConfig.ssmlGender
        );

        const publicUrl = await uploadToSupabase(mp3Buffer, storagePath);
        slide.mascot_audio_url = publicUrl;
        generated++;
        consecutiveErrors = 0;

        if (generated % 25 === 0) {
          process.stdout.write(` [${generated}/${totalNeeded}]`);
        }

        // Checkpoint every 50 slides
        if (generated % 50 === 0) {
          fs.writeFileSync(filePath, JSON.stringify(weekData, null, 2));
        }

        // Google TTS rate limit: 1000 RPM → 60ms between calls is safe
        await sleep(65);
      } catch (err) {
        errors++;
        consecutiveErrors++;
        console.error(`\n    ERROR ${storagePath}: ${err.message}`);

        if (consecutiveErrors >= 10) {
          console.error(
            `\n    ABORTING ${weekName}: ${consecutiveErrors} consecutive errors`
          );
          if (generated > 0) {
            fs.writeFileSync(filePath, JSON.stringify(weekData, null, 2));
          }
          return { skipped: false, count: generated, errors, aborted: true };
        }

        await sleep(Math.min(500 * consecutiveErrors, 5000));
      }
    }
  }

  // Save updated file
  if (!DRY_RUN && generated > 0) {
    fs.writeFileSync(filePath, JSON.stringify(weekData, null, 2));
  }

  // Only mark done if zero errors
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
  console.log('=== Mascot Audio Generator (Google Cloud TTS) ===');
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Force: ${FORCE}`);
  if (LEVEL_FILTER) console.log(`Level filter: ${LEVEL_FILTER}`);
  if (WEEK_FILTER) console.log(`Week filter: ${WEEK_FILTER}`);
  console.log();

  if (!DRY_RUN) {
    if (!GOOGLE_API_KEY) {
      console.error('ERROR: GOOGLE_API_KEY environment variable is required');
      process.exit(1);
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error(
        'ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required'
      );
      process.exit(1);
    }
  }

  const progress = loadProgress();
  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  const levels = LEVEL_FILTER
    ? LEVELS.filter((l) => l.includes(LEVEL_FILTER))
    : LEVELS;

  const startTime = Date.now();

  for (const levelDir of levels) {
    const levelPath = path.join(DATA_DIR, levelDir);
    if (!fs.existsSync(levelPath)) {
      console.log(`Skipping ${levelDir} (directory not found)`);
      continue;
    }

    console.log(`\n--- ${levelDir} (${VOICE_CONFIG[levelDir].voiceName}) ---`);

    const weekFiles = fs
      .readdirSync(levelPath)
      .filter((f) => f.startsWith('week-') && f.endsWith('.json'))
      .sort();

    let aborted = false;
    for (const weekFile of weekFiles) {
      if (WEEK_FILTER) {
        const weekNum = parseInt(
          weekFile.replace('week-', '').replace('.json', ''),
          10
        );
        if (weekNum !== WEEK_FILTER) continue;
      }

      const filePath = path.join(levelPath, weekFile);
      process.stdout.write(`  ${weekFile}...`);

      const result = await processWeekFile(filePath, levelDir, progress);

      if (result.skipped) {
        console.log(' (already done)');
        totalSkipped++;
      } else if (result.aborted) {
        console.log(
          ` ${result.count} generated, ABORTED (${result.errors} errors)`
        );
        totalGenerated += result.count;
        totalErrors += result.errors;
        aborted = true;
        break;
      } else {
        const errMsg = result.errors ? ` (${result.errors} errors)` : '';
        console.log(` ${result.count} audio files${errMsg}`);
        totalGenerated += result.count;
        totalErrors += result.errors;
      }
    }

    if (aborted) {
      console.error('\n!!! Aborted — re-run to resume from where it stopped. !!!');
      break;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n=== Summary ===');
  console.log(`Total audio files generated: ${totalGenerated}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Weeks skipped (already done): ${totalSkipped}`);
  console.log(`Elapsed time: ${elapsed} minutes`);
  if (DRY_RUN) console.log('(DRY RUN — no files were modified)');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
