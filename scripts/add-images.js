/**
 * add-images.js — Add image URLs to lesson slide_content
 *
 * Modes:
 *   1. CURATED (default): Uses scripts/data/image-pool.json
 *   2. PIXABAY: Uses Pixabay API (set PIXABAY_API_KEY env var)
 *   3. GOOGLE_CSE: Uses Google Custom Search (set GOOGLE_API_KEY + GOOGLE_CSE_ID)
 *
 * Usage:
 *   node scripts/add-images.js                         # curated mode
 *   PIXABAY_API_KEY=xxx node scripts/add-images.js     # pixabay mode
 *   node scripts/add-images.js --level primary         # single level
 *   node scripts/add-images.js --dry-run               # preview only
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ============================================================================
// Configuration
// ============================================================================

const DATA_DIR = path.join(__dirname, 'data');
const LEVELS = ['primary-lessons', 'lower-elementary-lessons', 'upper-elementary-lessons'];
const PROGRESS_FILE = path.join(DATA_DIR, 'image-progress.json');
const POOL_FILE = path.join(DATA_DIR, 'image-pool.json');
const CACHE_FILE = path.join(DATA_DIR, 'image-cache.json');

const PIXABAY_KEY = process.env.PIXABAY_API_KEY || '';
const GOOGLE_KEY = process.env.GOOGLE_API_KEY || '';
const GOOGLE_CSE = process.env.GOOGLE_CSE_ID || '';

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LEVEL_FILTER = args.includes('--level') ? args[args.indexOf('--level') + 1] : null;
const FORCE = args.includes('--force');

// ============================================================================
// Subject → search query mapping for API modes
// ============================================================================

const SUBJECT_QUERIES = {
  practical_life: [
    'montessori pouring water activity',
    'child cooking kitchen activity',
    'folding cloth neatly',
    'polishing brass educational',
    'spooning beans montessori',
    'sweeping floor child activity',
    'buttoning frame montessori',
    'flower arranging child',
    'hand washing activity child',
    'food preparation kids',
    'table setting children',
    'sewing activity kids',
  ],
  language: [
    'wooden alphabet letters colorful',
    'sandpaper letters montessori',
    'children reading book together',
    'child writing letters',
    'phonics activity education',
    'storytelling children circle',
    'moveable alphabet montessori',
    'vocabulary cards education',
    'grammar symbols education',
    'creative writing notebook',
  ],
  math: [
    'montessori golden beads',
    'counting beads colorful education',
    'number cards education',
    'addition subtraction blocks',
    'stamp game montessori',
    'bead chains montessori',
    'fraction circles education',
    'multiplication board education',
    'math manipulatives colorful',
    'abacus wooden counting',
  ],
  sensorial: [
    'montessori pink tower blocks',
    'color tablets sorting activity',
    'geometric solids wooden',
    'texture boards montessori',
    'sound cylinders montessori',
    'brown stair montessori',
    'knobbed cylinders montessori',
    'color sorting activity',
    'sensory materials education',
    'montessori materials wooden',
  ],
  science: [
    'child looking magnifying glass nature',
    'plant growing stages seedling',
    'butterfly lifecycle education',
    'solar system planets educational',
    'nature walk leaves autumn',
    'science experiment bubbles',
    'insects close up macro',
    'weather chart educational',
    'volcano experiment kids',
    'botany leaf shapes',
    'animal classification education',
    'rock collection geology',
  ],
  geography: [
    'colorful world map children',
    'globe earth geography',
    'continent puzzle montessori',
    'flags of the world colorful',
    'mountain landscape scenic',
    'ocean underwater coral reef',
    'desert sand dunes landscape',
    'rainforest tropical green',
    'arctic ice polar landscape',
    'cultural landmarks world',
  ],
  history: [
    'timeline history education',
    'ancient egypt pyramids',
    'dinosaur fossil museum',
    'medieval castle historical',
    'ancient rome colosseum',
    'cave paintings prehistoric',
    'historical timeline chart',
    'ancient greek temple',
    'renaissance art historical',
    'exploration ship sailing',
  ],
  geometry: [
    'geometric shapes colorful wooden',
    'triangle square circle shapes',
    'geometric solids 3d shapes',
    'pattern blocks tessellation',
    'symmetry butterfly wings',
    'origami paper folding',
    'compass protractor geometry',
    'tangram puzzle colorful',
    'geometric patterns design',
    'architectural geometry building',
  ],
  art_music: [
    'watercolor painting supplies',
    'colored pencils drawing art',
    'clay sculpting hands craft',
    'art easel painting canvas',
    'musical instruments children xylophone',
    'drums percussion instruments',
    'art supplies colorful creative',
    'craft paper scissors glue',
    'oil pastels drawing colorful',
    'recorder flute kids instrument',
  ],
  read_aloud: [
    'open storybook illustration',
    'children books stack colorful',
    'reading nook cozy blanket',
    'library bookshelves children',
    'picture book illustration',
    'storytelling puppet theater',
    'fairy tale castle illustration',
    'bedtime story reading',
    'bookshelf children colorful',
    'adventure book illustration',
  ],
  culture: [
    'world cultures celebration festival',
    'traditional clothing global diversity',
    'world food dishes multicultural',
    'cultural dance performance',
    'festival lanterns celebration',
    'traditional crafts handmade',
    'global celebration colorful',
    'cultural artifacts museum',
    'world music instruments traditional',
    'heritage celebration community',
  ],
};

// ============================================================================
// Helpers
// ============================================================================

function loadJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch {
    return null;
  }
}

function saveJSON(filepath, data) {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
}

function loadProgress() {
  return loadJSON(PROGRESS_FILE) || { completed: {} };
}

function saveProgress(progress) {
  saveJSON(PROGRESS_FILE, progress);
}

function loadCache() {
  return loadJSON(CACHE_FILE) || {};
}

function saveCache(cache) {
  saveJSON(CACHE_FILE, cache);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MontessoriApp/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON: ' + data.substring(0, 200))); }
      });
    }).on('error', reject);
  });
}

/** Generate a search query from a lesson title and subject */
function generateSearchQuery(lesson) {
  // Clean the title: remove punctuation, special chars
  const cleanTitle = lesson.title
    .replace(/[—–\-:()\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Take the first meaningful words (skip common words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'by', 'is', 'it', 'its']);
  const words = cleanTitle.toLowerCase().split(' ').filter(w => !stopWords.has(w) && w.length > 1);
  const titleWords = words.slice(0, 4).join(' ');

  // Add subject context
  const subjectContext = {
    practical_life: 'montessori activity',
    language: 'education letters',
    math: 'education counting',
    sensorial: 'montessori materials',
    science: 'nature education',
    geography: 'world map',
    history: 'historical education',
    geometry: 'shapes geometry',
    art_music: 'art creative',
    read_aloud: 'children book',
    culture: 'world culture',
  };

  return `${titleWords} ${subjectContext[lesson.subject_name] || 'education'}`;
}

// ============================================================================
// Image Sources
// ============================================================================

/** Pixabay API image search */
async function searchPixabay(query, cache) {
  const cacheKey = 'px:' + query;
  if (cache[cacheKey]) return cache[cacheKey];

  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true&per_page=5&min_width=600`;

  try {
    const data = await httpGet(url);
    if (data.hits && data.hits.length > 0) {
      const imageUrl = data.hits[0].webformatURL;
      cache[cacheKey] = imageUrl;
      return imageUrl;
    }
  } catch (err) {
    console.error(`  Pixabay error for "${query}": ${err.message}`);
  }
  return null;
}

/** Google Custom Search API image search */
async function searchGoogleCSE(query, cache) {
  const cacheKey = 'gc:' + query;
  if (cache[cacheKey]) return cache[cacheKey];

  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${GOOGLE_CSE}&q=${encodeURIComponent(query)}&searchType=image&safe=active&imgSize=medium&num=1`;

  try {
    const data = await httpGet(url);
    if (data.items && data.items.length > 0) {
      const imageUrl = data.items[0].link;
      cache[cacheKey] = imageUrl;
      return imageUrl;
    }
  } catch (err) {
    console.error(`  Google CSE error for "${query}": ${err.message}`);
  }
  return null;
}

/**
 * Subject alias mapping: lesson subject_name → pool key(s)
 * The pool may use different keys than the lesson data.
 */
const SUBJECT_POOL_MAP = {
  art_music: ['art_music', 'art', 'music'],   // pool has separate art + music
  culture: ['culture', 'cultural'],             // pool uses "cultural"
  geometry: ['geometry', 'math', 'sensorial'],  // geometry may not be in pool
  // All others map directly
};

/** Curated image pool — round-robin selection per subject */
function getFromPool(pool, subject, index) {
  // Try direct match first, then aliases
  const keysToTry = SUBJECT_POOL_MAP[subject] || [subject];

  // Build a merged image list from all matching keys
  let images = [];
  for (const key of keysToTry) {
    if (pool[key] && Array.isArray(pool[key])) {
      images = images.concat(pool[key]);
    }
  }

  if (images.length === 0) return null;
  const img = images[index % images.length];
  return typeof img === 'string' ? img : img.url;
}

// ============================================================================
// Main processing
// ============================================================================

async function processLevel(levelDir, levelName, pool, cache, progress) {
  const dirPath = path.join(DATA_DIR, levelDir);
  const files = fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.json') && !f.includes('part'))
    .sort();

  let totalAdded = 0;
  let totalSkipped = 0;
  const subjectCounters = {};

  for (const file of files) {
    const fileKey = `${levelDir}/${file}`;

    // Skip if already processed (unless --force)
    if (!FORCE && progress.completed[fileKey]) {
      totalSkipped += 25;
      continue;
    }

    const filePath = path.join(dirPath, file);
    const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let modified = false;

    for (const lesson of lessons) {
      const subject = lesson.subject_name;
      if (!subjectCounters[subject]) subjectCounters[subject] = 0;

      // Find the title slide
      const slides = lesson.slide_content?.slides;
      if (!slides || slides.length === 0) continue;

      const titleSlide = slides.find(s => s.type === 'title');
      if (!titleSlide) continue;

      // Skip if already has an image (unless --force)
      if (!FORCE && titleSlide.image_url) {
        subjectCounters[subject]++;
        continue;
      }

      let imageUrl = null;

      // Try API modes first
      if (PIXABAY_KEY) {
        const query = generateSearchQuery(lesson);
        imageUrl = await searchPixabay(query, cache);
        if (imageUrl) await sleep(100); // Rate limit: 100 req/min
      } else if (GOOGLE_KEY && GOOGLE_CSE) {
        const query = generateSearchQuery(lesson);
        imageUrl = await searchGoogleCSE(query, cache);
        if (imageUrl) await sleep(200); // Rate limit
      }

      // Fallback to curated pool
      if (!imageUrl && pool) {
        imageUrl = getFromPool(pool, subject, subjectCounters[subject]);
      }

      if (imageUrl) {
        titleSlide.image_url = imageUrl;
        modified = true;
        totalAdded++;
      }

      subjectCounters[subject]++;
    }

    if (modified && !DRY_RUN) {
      fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2), 'utf8');
    }

    progress.completed[fileKey] = true;

    if (!DRY_RUN) {
      saveProgress(progress);
      saveCache(cache);
    }

    const weekNum = file.match(/week-(\d+)/)?.[1] || '?';
    console.log(`  ${levelName} week-${weekNum}: +${modified ? lessons.length : 0} images`);
  }

  return { added: totalAdded, skipped: totalSkipped };
}

async function main() {
  console.log('=== Montessori Lesson Image Addition ===\n');

  // Determine mode
  let mode = 'curated';
  if (PIXABAY_KEY) mode = 'pixabay';
  else if (GOOGLE_KEY && GOOGLE_CSE) mode = 'google_cse';

  console.log(`Mode: ${mode.toUpperCase()}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Force: ${FORCE}`);
  if (LEVEL_FILTER) console.log(`Level filter: ${LEVEL_FILTER}`);
  console.log('');

  // Load curated pool (always load as fallback)
  let pool = null;
  if (fs.existsSync(POOL_FILE)) {
    pool = loadJSON(POOL_FILE);
    const totalImages = Object.values(pool || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    console.log(`Image pool loaded: ${totalImages} images across ${Object.keys(pool || {}).length} subjects`);
  } else {
    console.log('No image pool found at ' + POOL_FILE);
    if (mode === 'curated') {
      console.error('ERROR: Curated mode requires image-pool.json. Run with PIXABAY_API_KEY or create the pool file.');
      process.exit(1);
    }
  }

  const cache = loadCache();
  const progress = loadProgress();
  console.log(`Cache entries: ${Object.keys(cache).length}`);
  console.log(`Previously completed: ${Object.keys(progress.completed).length} files\n`);

  let grandTotal = { added: 0, skipped: 0 };

  const levels = LEVEL_FILTER
    ? LEVELS.filter(l => l.includes(LEVEL_FILTER))
    : LEVELS;

  for (const levelDir of levels) {
    const levelName = levelDir.replace('-lessons', '').replace(/-/g, ' ');
    console.log(`\n--- ${levelName.toUpperCase()} ---`);

    const result = await processLevel(levelDir, levelName, pool, cache, progress);
    grandTotal.added += result.added;
    grandTotal.skipped += result.skipped;
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Images added: ${grandTotal.added}`);
  console.log(`Lessons skipped (already done): ${grandTotal.skipped}`);
  console.log(`Mode: ${mode}`);

  if (DRY_RUN) {
    console.log('\n(DRY RUN — no files were modified)');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
