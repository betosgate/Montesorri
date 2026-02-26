#!/usr/bin/env node
/**
 * Classify all primary lessons as PRINTABLE or DIRECT.
 *
 * PRINTABLE = the lesson's core learning can be achieved with paper cutouts/PDFs
 * DIRECT    = requires real sensory input; rewrite as household-substitute lesson plan
 *
 * Usage:  node scripts/classify-lessons.js [--level primary]
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Classification rules — keyword-based heuristics
// ---------------------------------------------------------------------------

/** Materials / lesson keywords that strongly indicate DIRECT instruction */
const DIRECT_KEYWORDS = [
  // Pouring / transferring liquids
  'pouring water', 'pitcher to pitcher', 'pitcher to glasses', 'pouring dry',
  'water transfer', 'pouring exercise',
  // Transferring with tools
  'spooning', 'tonging', 'transferring with tongs', 'transferring with tweezers',
  'tweezing', 'eyedropper',
  // Cleaning / care of environment
  'polishing', 'scrubbing', 'sweeping', 'mopping', 'washing table',
  'washing dishes', 'window washing', 'dusting', 'sponging',
  'cleaning', 'plant care', 'watering plants', 'flower arranging',
  // Food preparation
  'cooking', 'baking', 'food prep', 'cutting fruit', 'spreading',
  'peeling', 'juicing', 'squeezing', 'recipe', 'snack', 'fruit salad',
  'slicing', 'grating',
  // Dressing / self care
  'dressing frame', 'buttoning', 'zipping', 'lacing', 'tying',
  'shoe tying', 'hand washing', 'teeth brushing',
  // Sewing / handwork
  'sewing', 'stitching', 'weaving', 'knitting', 'cross-stitch',
  'woodworking', 'hammering', 'sanding',
  // Sensorial — tactile/thermic/baric/olfactory/gustatory
  'fabric box', 'fabric matching', 'texture', 'thermic',
  'baric', 'weight tablet', 'mystery bag', 'stereognostic',
  'smelling bottles', 'tasting', 'smell',
  // Sensorial — auditory
  'sound cylinder', 'sound box', 'bells', 'musical bell',
  // Science — hands-on
  'magnifying glass', 'magnet', 'float and sink', 'float or sink',
  'sink or float', 'volcano', 'experiment',
  // Art — requires real materials
  'finger painting', 'watercolor', 'painting', 'clay', 'playdough',
  'collage', 'torn paper',
  // Nature
  'nature walk', 'nature hike', 'outdoor', 'garden',
  'planting seeds', 'growing',
  // Grace & courtesy (direct instruction, no materials)
  'grace and courtesy', 'manners', 'greeting', 'conflict resolution',
  'sharing', 'taking turns',
  // Read aloud (no conversion needed)
  'read-aloud', 'read aloud', 'story time',
];

/** Materials / lesson keywords that strongly indicate PRINTABLE */
const PRINTABLE_KEYWORDS = [
  // Math manipulatives that convert to paper
  'number rod', 'number card', 'golden bead', 'stamp game',
  'bead bar', 'bead chain', 'strip board', 'addition strip',
  'subtraction strip', 'hundred board', 'hundred chart',
  'multiplication board', 'division board', 'place value',
  'seguin board', 'teen board', 'ten board',
  'fraction circle', 'fraction', 'decimal board',
  'dot game', 'snake game', 'bank game',
  // Sensorial that converts to paper
  'pink tower', 'brown stair', 'red rod', 'long rod',
  'knobbed cylinder', 'knobless cylinder', 'cylinder block',
  'color tablet', 'color box', 'color matching', 'color grading',
  'geometric cabinet', 'geometric solid',
  'constructive triangle', 'binomial cube', 'trinomial cube',
  // Language
  'sandpaper letter', 'sandpaper numeral', 'moveable alphabet',
  'movable alphabet', 'grammar symbol', 'grammar box',
  'three-part card', '3-part card', 'nomenclature card',
  'word card', 'phonogram card', 'blend card',
  'sentence analysis', 'parts of speech',
  'writing practice', 'letter formation', 'handwriting',
  // Geography / maps
  'puzzle map', 'continent', 'country', 'world map',
  'map of', 'land and water form', 'landform',
  'flag', 'flags of',
  // Science cards
  'life cycle', 'animal classification', 'plant part',
  'body part', 'skeleton', 'anatomy',
  'vertebrate', 'invertebrate',
  // Clock / time
  'clock', 'telling time', 'time',
  // Calendar
  'calendar', 'days of the week', 'months',
];

/** Subjects that are predominantly one type */
const SUBJECT_DEFAULTS = {
  'read_aloud': 'NONE',        // No conversion needed
  'practical_life': 'DIRECT',  // Default unless overridden
};

/**
 * Classify a single lesson based on title, materials, and content.
 */
function classifyLesson(lesson) {
  const title = (lesson.title || '').toLowerCase();
  const description = (lesson.description || '').toLowerCase();
  const instructions = (lesson.instructions || '').toLowerCase();
  const materials = (lesson.materials_needed || []).map(m => m.toLowerCase()).join(' ');
  const subject = lesson.subject_name || '';

  const allText = `${title} ${description} ${instructions} ${materials}`;

  // Read-aloud lessons need no conversion
  if (subject === 'read_aloud' || DIRECT_KEYWORDS.some(k => k === 'read-aloud' && allText.includes('read-aloud'))) {
    return {
      type: 'NONE',
      reason: 'Read-aloud lesson — no physical materials to convert',
      needs_lesson_rewrite: false,
      household_items: ['The book mentioned in the lesson', 'Comfortable reading area'],
    };
  }

  // Score both directions
  let printableScore = 0;
  let directScore = 0;
  const printableMatches = [];
  const directMatches = [];

  for (const kw of PRINTABLE_KEYWORDS) {
    if (allText.includes(kw)) {
      printableScore += 2;
      printableMatches.push(kw);
    }
  }

  for (const kw of DIRECT_KEYWORDS) {
    if (allText.includes(kw)) {
      directScore += 2;
      directMatches.push(kw);
    }
  }

  // Subject-level defaults add a small bias
  if (SUBJECT_DEFAULTS[subject] === 'DIRECT') directScore += 1;

  // Determine type
  let type;
  let reason;

  if (printableScore > directScore) {
    type = 'PRINTABLE';
    reason = `Matched printable keywords: ${printableMatches.join(', ')}`;
  } else if (directScore > printableScore) {
    type = 'DIRECT';
    reason = `Matched direct keywords: ${directMatches.join(', ')}`;
  } else if (directScore === 0 && printableScore === 0) {
    // No keywords matched — classify by subject
    if (['math', 'geometry'].includes(subject)) {
      type = 'PRINTABLE';
      reason = 'Math/geometry subject defaults to printable';
    } else if (['language'].includes(subject)) {
      type = 'PRINTABLE';
      reason = 'Language subject defaults to printable';
    } else if (['practical_life'].includes(subject)) {
      type = 'DIRECT';
      reason = 'Practical life subject defaults to direct';
    } else if (['sensorial'].includes(subject)) {
      type = 'DIRECT';
      reason = 'Sensorial subject defaults to direct (sensory input)';
    } else if (['geography', 'culture', 'history'].includes(subject)) {
      type = 'PRINTABLE';
      reason = 'Geography/culture/history — card and map based';
    } else if (['science'].includes(subject)) {
      type = 'DIRECT';
      reason = 'Science defaults to direct (observation/experiment)';
    } else if (['art_music'].includes(subject)) {
      type = 'DIRECT';
      reason = 'Art/music requires real materials';
    } else {
      type = 'DIRECT';
      reason = 'Default fallback to direct instruction';
    }
  } else {
    // Tie — use subject default
    type = SUBJECT_DEFAULTS[subject] || 'DIRECT';
    reason = `Tie (print=${printableScore}, direct=${directScore}) — subject default`;
  }

  // Generate household substitutes for DIRECT lessons
  const householdItems = generateHouseholdItems(lesson, directMatches);

  return {
    type,
    reason,
    printable_matches: printableMatches,
    direct_matches: directMatches,
    needs_lesson_rewrite: false, // Keep lessons as-is by default
    household_items: type === 'DIRECT' ? householdItems : [],
    pdf_templates: type === 'PRINTABLE' ? determinePdfTemplates(lesson, printableMatches) : [],
  };
}

/**
 * Determine which PDF templates to generate for a PRINTABLE lesson.
 */
function determinePdfTemplates(lesson, matches) {
  const templates = [];
  const title = (lesson.title || '').toLowerCase();
  const allText = `${title} ${(lesson.description || '').toLowerCase()}`;

  // Number cards / place value
  if (matches.some(m => ['number card', 'place value', 'golden bead', 'stamp game', 'bank game', 'dot game'].includes(m))) {
    templates.push('number-cards');
  }
  // Bead bars / chains
  if (matches.some(m => ['bead bar', 'bead chain', 'snake game'].includes(m))) {
    templates.push('bead-bars');
  }
  // Strip boards
  if (matches.some(m => ['strip board', 'addition strip', 'subtraction strip'].includes(m))) {
    templates.push('strip-board');
  }
  // Number rods
  if (matches.some(m => m.includes('number rod'))) {
    templates.push('number-rods');
  }
  // Hundred board
  if (matches.some(m => ['hundred board', 'hundred chart'].includes(m))) {
    templates.push('hundred-board');
  }
  // Fractions
  if (matches.some(m => m.includes('fraction'))) {
    templates.push('fraction-circles');
  }
  // Seguin boards
  if (matches.some(m => ['seguin board', 'teen board', 'ten board'].includes(m))) {
    templates.push('seguin-board');
  }
  // Multiplication/division boards
  if (matches.some(m => ['multiplication board', 'division board'].includes(m))) {
    templates.push('operation-board');
  }
  // Sensorial — graded series
  if (matches.some(m => ['pink tower', 'brown stair', 'red rod', 'long rod'].includes(m))) {
    templates.push('graded-series');
  }
  // Cylinders
  if (matches.some(m => m.includes('cylinder'))) {
    templates.push('cylinder-blocks');
  }
  // Color tablets
  if (matches.some(m => ['color tablet', 'color box', 'color matching', 'color grading'].includes(m))) {
    templates.push('color-tablets');
  }
  // Geometric shapes
  if (matches.some(m => ['geometric cabinet', 'geometric solid', 'constructive triangle', 'binomial cube', 'trinomial cube'].includes(m))) {
    templates.push('geometry-shapes');
  }
  // Language — letters
  if (matches.some(m => ['sandpaper letter', 'moveable alphabet', 'movable alphabet'].includes(m))) {
    templates.push('letter-cards');
  }
  // Language — sandpaper numerals
  if (matches.some(m => m.includes('sandpaper numeral'))) {
    templates.push('numeral-cards');
  }
  // Grammar symbols
  if (matches.some(m => ['grammar symbol', 'grammar box', 'parts of speech', 'sentence analysis'].includes(m))) {
    templates.push('grammar-symbols');
  }
  // Three-part / nomenclature cards
  if (matches.some(m => ['three-part card', '3-part card', 'nomenclature card'].includes(m))) {
    templates.push('three-part-cards');
  }
  // Maps
  if (matches.some(m => ['puzzle map', 'continent', 'country', 'world map', 'map of', 'land and water form', 'landform'].includes(m))) {
    templates.push('puzzle-map');
  }
  // Flags
  if (matches.some(m => m.includes('flag'))) {
    templates.push('flag-cards');
  }
  // Life cycles / science cards
  if (matches.some(m => ['life cycle', 'animal classification', 'plant part', 'body part', 'skeleton', 'anatomy', 'vertebrate', 'invertebrate'].includes(m))) {
    templates.push('science-cards');
  }
  // Clock
  if (matches.some(m => ['clock', 'telling time'].includes(m))) {
    templates.push('clock-face');
  }
  // Handwriting / letter formation
  if (matches.some(m => ['writing practice', 'letter formation', 'handwriting'].includes(m))) {
    templates.push('handwriting-practice');
  }
  // Word / phonogram cards
  if (matches.some(m => ['word card', 'phonogram card', 'blend card'].includes(m))) {
    templates.push('word-cards');
  }

  // Default: generic activity sheet if no specific template matched
  if (templates.length === 0) {
    templates.push('generic-printable');
  }

  return templates;
}

/**
 * Generate household substitute items for DIRECT lessons.
 */
function generateHouseholdItems(lesson, matches) {
  const items = [];
  const title = (lesson.title || '').toLowerCase();
  const materials = (lesson.materials_needed || []);

  // Start with existing materials list (many are already household items)
  for (const m of materials) {
    const ml = m.toLowerCase();
    // Skip Montessori-specific items, suggest substitutes
    if (ml.includes('montessori') || ml.includes('adena')) continue;
    items.push(m);
  }

  // Add substitutes based on matched keywords
  if (matches.some(m => m.includes('pouring'))) {
    if (!items.some(i => i.toLowerCase().includes('pitcher')))
      items.push('Two small pitchers or measuring cups');
    if (!items.some(i => i.toLowerCase().includes('tray')))
      items.push('Baking sheet or tray');
    if (!items.some(i => i.toLowerCase().includes('sponge')))
      items.push('Small sponge for cleanup');
  }

  if (matches.some(m => m.includes('fabric'))) {
    items.push('6-8 fabric swatches in matching pairs (cotton, silk, wool, denim, felt, burlap)');
  }

  if (matches.some(m => m.includes('sound'))) {
    items.push('6 identical small containers with lids (film canisters or small jars)');
    items.push('Filling materials: rice, beans, sand, bells, paper clips, beads');
  }

  if (matches.some(m => m.includes('mystery bag') || m.includes('stereognostic'))) {
    items.push('Cloth bag or pillowcase');
    items.push('5-8 familiar household objects (spoon, ball, key, button, etc.)');
  }

  if (matches.some(m => m.includes('thermic'))) {
    items.push('Objects of different materials: metal spoon, wooden block, stone, felt piece');
  }

  if (matches.some(m => m.includes('baric') || m.includes('weight'))) {
    items.push('3 identical containers (film canisters) filled with different amounts of coins');
  }

  return items;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const level = process.argv.includes('--level')
    ? process.argv[process.argv.indexOf('--level') + 1]
    : 'primary';

  const lessonsDir = path.join(__dirname, 'data', `${level}-lessons`);
  const outputPath = path.join(__dirname, 'data', 'lesson-classifications.json');

  console.log(`\nClassifying ${level} lessons...\n`);

  const weekFiles = fs.readdirSync(lessonsDir)
    .filter(f => f.startsWith('week-') && f.endsWith('.json'))
    .sort();

  const classifications = {};
  const stats = { PRINTABLE: 0, DIRECT: 0, NONE: 0, total: 0 };
  const templateCounts = {};
  const subjectStats = {};

  for (const file of weekFiles) {
    const filePath = path.join(lessonsDir, file);
    const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const weekNum = file.replace('week-', '').replace('.json', '');

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const key = `${level}-lessons/week-${weekNum}/lesson-${String(i + 1).padStart(2, '0')}`;

      const result = classifyLesson(lesson);
      classifications[key] = {
        title: lesson.title,
        subject: lesson.subject_name,
        ...result,
      };

      stats[result.type]++;
      stats.total++;

      // Track template usage
      for (const tpl of result.pdf_templates || []) {
        templateCounts[tpl] = (templateCounts[tpl] || 0) + 1;
      }

      // Track by subject
      const subj = lesson.subject_name;
      if (!subjectStats[subj]) subjectStats[subj] = { PRINTABLE: 0, DIRECT: 0, NONE: 0 };
      subjectStats[subj][result.type]++;
    }

    console.log(`  ${file}: ${lessons.length} lessons classified`);
  }

  // Save classifications
  fs.writeFileSync(outputPath, JSON.stringify(classifications, null, 2));

  // Print summary
  console.log('\n=== CLASSIFICATION SUMMARY ===');
  console.log(`Total lessons: ${stats.total}`);
  console.log(`  PRINTABLE: ${stats.PRINTABLE} (${(stats.PRINTABLE / stats.total * 100).toFixed(1)}%)`);
  console.log(`  DIRECT:    ${stats.DIRECT} (${(stats.DIRECT / stats.total * 100).toFixed(1)}%)`);
  console.log(`  NONE:      ${stats.NONE} (${(stats.NONE / stats.total * 100).toFixed(1)}%) — read-alouds, no conversion`);

  console.log('\n--- By Subject ---');
  for (const [subj, counts] of Object.entries(subjectStats).sort()) {
    const total = counts.PRINTABLE + counts.DIRECT + counts.NONE;
    console.log(`  ${subj}: ${total} total | P=${counts.PRINTABLE} D=${counts.DIRECT} N=${counts.NONE}`);
  }

  console.log('\n--- PDF Template Usage ---');
  for (const [tpl, count] of Object.entries(templateCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tpl}: ${count} lessons`);
  }

  console.log(`\nClassifications saved to: ${outputPath}`);
}

main().catch(console.error);
