/**
 * generate-slide-images.js — Add Pexels images to instruction + activity slides
 *
 * Strategy:
 * 1. For each lesson, search Pexels using the lesson title keywords
 * 2. If no results, fall back to broader subject-level search terms
 * 3. Each lesson within a subject uses a different page/offset for image variety
 * 4. Apply found image to ALL instruction + activity slides in that lesson
 * 5. Never cache "no results" — always retry on next run
 *
 * Usage:
 *   PEXELS_API_KEY=xxx node scripts/generate-slide-images.js
 *   PEXELS_API_KEY=xxx node scripts/generate-slide-images.js --level primary
 *   PEXELS_API_KEY=xxx node scripts/generate-slide-images.js --force
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================================
// Configuration
// ============================================================================

const DATA_DIR = path.join(__dirname, 'data');
const LEVELS = ['primary-lessons', 'lower-elementary-lessons', 'upper-elementary-lessons'];
const PROGRESS_FILE = path.join(DATA_DIR, 'slide-image-progress.json');
const CACHE_FILE = path.join(DATA_DIR, 'slide-image-cache.json');

const PEXELS_KEY = process.env.PEXELS_API_KEY || '';

const args = process.argv.slice(2);
const LEVEL_FILTER = args.includes('--level') ? args[args.indexOf('--level') + 1] : null;
const FORCE = args.includes('--force');

// Pexels: be conservative to avoid 429s and upstream timeouts
const PEXELS_DELAY_MS = 4000;

// ============================================================================
// Subject → guaranteed Pexels search terms (tested, all return 5000+ results)
// ============================================================================

const SUBJECT_FALLBACKS = {
  practical_life: ['montessori child activity', 'child cooking kitchen', 'child cleaning activity', 'pouring water activity', 'child learning independence'],
  sensorial: ['montessori materials wooden', 'sensory activity child', 'wooden blocks education', 'color sorting activity', 'child texture discovery'],
  language: ['alphabet letters colorful', 'child reading book', 'writing letters child', 'phonics education', 'storybook illustration children'],
  math: ['counting beads colorful', 'math blocks education', 'numbers learning child', 'abacus wooden counting', 'math manipulatives'],
  geometry: ['geometric shapes colorful', 'shapes education wooden', 'geometry blocks', 'pattern shapes education', 'tangram puzzle'],
  geography: ['world globe earth', 'world map colorful', 'nature landscape scenic', 'continent map education', 'ocean earth nature'],
  history: ['ancient history education', 'timeline history', 'historical artifacts museum', 'prehistoric cave painting', 'ancient civilization ruins'],
  science: ['nature discovery child', 'science experiment kids', 'plant growing seedling', 'magnifying glass nature', 'butterfly life cycle'],
  art_music: ['watercolor painting art', 'art supplies creative', 'musical instruments colorful', 'child painting easel', 'clay sculpture craft'],
  culture: ['world cultures festival', 'multicultural celebration', 'traditional crafts handmade', 'cultural diversity children', 'world festival colorful'],
  read_aloud: ['children reading storybook', 'picture book illustration', 'child library books', 'storytime reading kids', 'bedtime story book'],
};

// ============================================================================
// Helpers
// ============================================================================

function loadJSON(fp) {
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return null; }
}

function saveJSON(fp, data) {
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'on', 'at',
  'by', 'is', 'it', 'this', 'that', 'you', 'your', 'can', 'do', 'not', 'from',
  'introduction', 'lesson', 'part', 'step', 'review', 'practice', 'day', 'week',
]);

function extractKeywords(title) {
  return title
    .replace(/[—–\-:()\/\\,.!?'"]/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// ============================================================================
// Pexels API
// ============================================================================

let apiCalls = 0;
let rateLimitRemaining = null;

async function pexelsSearch(query, page = 1) {
  return new Promise((resolve, reject) => {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape`;
    https.get(url, {
      headers: { Authorization: PEXELS_KEY, 'User-Agent': 'MontessoriApp/1.0' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        apiCalls++;
        rateLimitRemaining = res.headers['x-ratelimit-remaining'];
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 429) {
            console.error(`  RATE LIMITED (429)! Query: "${query}" page=${page}. Waiting 60s...`);
            resolve({ photos: [], rateLimited: true });
            return;
          }
          if (res.statusCode !== 200) {
            console.error(`  HTTP ${res.statusCode} for "${query}": ${data.substring(0, 200)}`);
            resolve({ photos: [], total: 0 });
            return;
          }
          resolve({ photos: json.photos || [], total: json.total_results || 0 });
        } catch (e) {
          console.error(`  Parse error for "${query}": ${e.message} — raw: ${data.substring(0, 100)}`);
          resolve({ photos: [], total: 0 });
        }
      });
    }).on('error', (err) => {
      console.error(`  Network error for "${query}": ${err.message}`);
      resolve({ photos: [], total: 0 });
    });
  });
}

/**
 * Get an image URL for a lesson. Tries title-based search first, then subject fallbacks.
 * Uses cache aggressively — cache key is "query:page" → array of URLs.
 * `lessonIndex` varies which photo is selected from the result set.
 */
async function getImageForLesson(lessonTitle, subjectName, lessonIndex, cache) {
  const keywords = extractKeywords(lessonTitle);

  // Build query attempts: specific → general
  const queries = [];
  if (keywords.length >= 2) queries.push(keywords.slice(0, 4).join(' '));
  if (keywords.length >= 1) queries.push(keywords.slice(0, 2).join(' '));

  // Add subject fallback queries (cycle through them based on lesson index)
  const fallbacks = SUBJECT_FALLBACKS[subjectName] || ['education learning children'];
  for (const fb of fallbacks) queries.push(fb);

  for (let qi = 0; qi < queries.length; qi++) {
    const query = queries[qi];
    // Determine which page to use for variety (each page has 15 results)
    const page = Math.floor(lessonIndex / 15) + 1;
    const photoIndex = lessonIndex % 15;

    const cacheKey = `${query}|p${page}`;

    // Check cache
    if (!cache[cacheKey]) {
      // Make API call
      const result = await pexelsSearch(query, page);

      if (result.rateLimited) {
        console.log(`    Retrying "${query}" after rate limit...`);
        await sleep(60000);
        const retry = await pexelsSearch(query, page);
        if (retry.photos.length > 0) {
          cache[cacheKey] = retry.photos.map(p => p.src.large);
        }
      } else if (result.photos.length > 0) {
        cache[cacheKey] = result.photos.map(p => p.src.large);
      }

      // Delay between API calls
      await sleep(PEXELS_DELAY_MS);
    }

    // Try to get photo from cache
    const cached = cache[cacheKey];
    if (cached && cached.length > 0) {
      const idx = photoIndex % cached.length;
      return cached[idx];
    }
  }

  return null;
}

// ============================================================================
// Main processing
// ============================================================================

async function processLevel(levelDir, progress, cache) {
  const dirPath = path.join(DATA_DIR, levelDir);
  const files = fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.json') && !f.includes('part'))
    .sort();

  let stats = { found: 0, missed: 0, slidesUpdated: 0 };
  let subjectCounters = {};

  for (const file of files) {
    const fileKey = `v3:${levelDir}/${file}`;
    if (!FORCE && progress.completed[fileKey]) continue;

    const filePath = path.join(dirPath, file);
    const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;
    let fileSlidesUpdated = 0;
    let fileLessonsFound = 0;
    let fileLessonsMissed = 0;

    for (const lesson of lessons) {
      const slides = lesson.slide_content?.slides;
      if (!slides) continue;

      const targets = slides.filter(s =>
        (s.type === 'instruction' || s.type === 'activity') && (FORCE || !s.image_url)
      );
      if (targets.length === 0) continue;

      const subject = lesson.subject_name;
      subjectCounters[subject] = (subjectCounters[subject] || 0) + 1;

      const imageUrl = await getImageForLesson(
        lesson.title, subject, subjectCounters[subject], cache
      );

      if (imageUrl) {
        for (const slide of targets) {
          slide.image_url = imageUrl;
          fileSlidesUpdated++;
          stats.slidesUpdated++;
        }
        modified = true;
        fileLessonsFound++;
        stats.found++;
      } else {
        fileLessonsMissed++;
        stats.missed++;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2), 'utf8');
    }

    progress.completed[fileKey] = true;
    saveJSON(PROGRESS_FILE, progress);
    saveJSON(CACHE_FILE, cache);

    const weekNum = file.match(/week-(\d+)/)?.[1] || '?';
    const level = levelDir.replace('-lessons', '');
    console.log(`  ${level} wk-${weekNum}: ${fileLessonsFound} found (+${fileSlidesUpdated} slides), ${fileLessonsMissed} missed | API calls: ${apiCalls} | Remaining: ${rateLimitRemaining}`);
  }

  return stats;
}

async function main() {
  console.log('=== Slide Image Generation v3 (Pexels, per-lesson, no NONE cache) ===\n');

  if (!PEXELS_KEY) {
    console.error('Set PEXELS_API_KEY. Free key: https://www.pexels.com/api/');
    process.exit(1);
  }

  console.log(`Force: ${FORCE}`);
  if (LEVEL_FILTER) console.log(`Level: ${LEVEL_FILTER}`);

  const progress = loadJSON(PROGRESS_FILE) || { completed: {} };
  // Clean out old NONE entries from cache
  const rawCache = loadJSON(CACHE_FILE) || {};
  const cache = {};
  for (const [k, v] of Object.entries(rawCache)) {
    // Only keep v3-format cache entries (query|pN → array) and v1 image URL entries
    if (Array.isArray(v) || (typeof v === 'string' && v.startsWith('http'))) {
      cache[k] = v;
    }
  }
  saveJSON(CACHE_FILE, cache);

  const completedV3 = Object.keys(progress.completed).filter(k => k.startsWith('v3:')).length;
  console.log(`Cache: ${Object.keys(cache).length} entries | v3 completed: ${completedV3} files\n`);

  const levels = LEVEL_FILTER ? LEVELS.filter(l => l.includes(LEVEL_FILTER)) : LEVELS;
  let grand = { found: 0, missed: 0, slidesUpdated: 0 };

  for (const levelDir of levels) {
    console.log(`\n--- ${levelDir.replace('-lessons', '').replace(/-/g, ' ').toUpperCase()} ---`);
    const r = await processLevel(levelDir, progress, cache);
    grand.found += r.found;
    grand.missed += r.missed;
    grand.slidesUpdated += r.slidesUpdated;
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Lessons with images: ${grand.found}`);
  console.log(`Slides updated: ${grand.slidesUpdated}`);
  console.log(`No match: ${grand.missed}`);
  console.log(`Total API calls: ${apiCalls}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
