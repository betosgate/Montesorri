#!/usr/bin/env node
/**
 * Curriculum Validation & Normalization Script
 *
 * Validates all primary-lessons week-XX.json files for:
 *   1. JSON structure and required fields
 *   2. Duplicate / near-duplicate title detection
 *   3. Materials inventory cross-reference
 *   4. Subject distribution per week
 *
 * Usage:  node scripts/validate-curriculum.js
 * No external dependencies required.
 */

const fs = require('fs');
const path = require('path');

// ─── Paths ──────────────────────────────────────────────────────────────────
const BASE = path.resolve(__dirname);
const LESSONS_DIR = path.join(BASE, 'data', 'primary-lessons');
const MATERIALS_FILE = path.join(BASE, 'data', 'materials.json');

// ─── Constants ──────────────────────────────────────────────────────────────
const TOTAL_WEEKS = 36;
const LESSONS_PER_WEEK = 25;
const TOTAL_LESSONS = TOTAL_WEEKS * LESSONS_PER_WEEK;

const REQUIRED_FIELDS = [
  'level_name', 'subject_name', 'week_number', 'day_of_week', 'quarter',
  'title', 'description', 'instructions', 'duration_minutes', 'lesson_type',
  'materials_needed', 'slide_content', 'parent_notes', 'sort_order'
];

const QUARTER_MAP = {
  1: [1, 9],
  2: [10, 18],
  3: [19, 27],
  4: [28, 36]
};

// Expected subject distribution per week
// Key: subject, Value: { count, days (array of expected day_of_week values) }
const EXPECTED_SUBJECTS = {
  practical_life: { count: 3, days: [1, 3, 5] },
  sensorial:      { count: 2, days: [2, 4] },
  language:       { count: 5, days: [1, 2, 3, 4, 5] },
  math:           { count: 5, days: [1, 2, 3, 4, 5] },
  science:        { count: 2, days: [2, 4] },
  art_music:      { count: 2, days: [2, 4] },
  read_aloud:     { count: 3, days: [1, 3, 5] },
  // geography OR culture fill remaining 3 slots
};

// Materials code mapping: generic name -> inventory code(s)
const MATERIAL_CODE_MAP = {
  'sandpaper letter': ['LA001'],
  'number rod': ['MA001'],
  'sandpaper numeral': ['MA002'],
  'spindle box': ['MA004'],
  'spindles': ['MA004'],
  'cards and counters': ['MA005'],
  'color tablet': ['SN006', 'SN007', 'SN008'],
  'pink tower': ['SN001'],
  'brown stair': ['SN002'],
  'broad stair': ['SN002'],
  'red rod': ['SN003'],
  'knobbed cylinder': ['SN004'],
  'moveable alphabet': ['LA004'],
  'movable alphabet': ['LA004'],
  'metal inset': ['LA003'],
  'golden bead': ['MA006'],
  'teen board': ['MA009'],
  'seguin board a': ['MA009'],
  'ten board': ['MA010'],
  'seguin board b': ['MA010'],
  'hundred board': ['MA011'],
  'stamp game': ['MA018'],
  'globe': ['GG001'],
  'puzzle map': ['GG002', 'GG003', 'GG004', 'GG005', 'GG006', 'GG007', 'GG008', 'GG009'],
  'geometric solid': ['SN012'],
  'constructive triangle': ['SN011'],
  'binomial cube': ['SN013'],
  'trinomial cube': ['SN024'],
  'sound cylinder': ['SN015'],
  'geometric cabinet': ['SN014'],
  'baric tablet': ['SN016'],
  'fraction circle': ['MA022'],
  'addition strip board': ['MA012'],
  'subtraction strip board': ['MA013'],
  'multiplication bead board': ['MA014'],
  'division bead board': ['MA015'],
  'rough and smooth board': ['SN017'],
  'smelling bottle': ['SN021'],
  'tasting bottle': ['SN022'],
  'knobless cylinder': ['SN005'],
  'dressing frame': ['PL007'],
  'bead chain': ['MA007', 'MA008'],
  'bead bar': ['MA007', 'MA008'],
  'clock': ['MA026'],
};

// ─── Utility: Levenshtein distance ─────────────────────────────────────────
function levenshtein(a, b) {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Use single-row optimization for memory efficiency
  let prev = new Array(lb + 1);
  let curr = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

// Strip parenthetical from title: "Foo (Bar)" -> "Foo"
function stripParenthetical(title) {
  return title.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

// Normalize title for comparison
function normalizeTitle(title) {
  return title.toLowerCase().replace(/[—–\-:]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── 1. JSON Validation ────────────────────────────────────────────────────
function validateJSON(lessonsDir) {
  const results = {
    weeksFound: [],
    weeksMissing: [],
    totalLessons: 0,
    jsonErrors: [],
    lessonCountErrors: [],
    fieldErrors: [],
    allLessons: [] // { weekNum, lesson }
  };

  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const filename = `week-${String(w).padStart(2, '0')}.json`;
    const filepath = path.join(lessonsDir, filename);

    if (!fs.existsSync(filepath)) {
      results.weeksMissing.push(w);
      continue;
    }

    // Parse JSON
    let data;
    try {
      const raw = fs.readFileSync(filepath, 'utf-8');
      data = JSON.parse(raw);
    } catch (err) {
      results.jsonErrors.push({ week: w, error: err.message });
      continue;
    }

    results.weeksFound.push(w);

    // Check lesson count
    if (!Array.isArray(data)) {
      results.lessonCountErrors.push({ week: w, found: 'not an array', expected: LESSONS_PER_WEEK });
      continue;
    }
    if (data.length !== LESSONS_PER_WEEK) {
      results.lessonCountErrors.push({ week: w, found: data.length, expected: LESSONS_PER_WEEK });
    }

    results.totalLessons += data.length;

    // Validate each lesson
    data.forEach((lesson, idx) => {
      const lessonId = `Week ${w}, lesson ${idx + 1} ("${(lesson.title || 'NO TITLE').substring(0, 40)}")`;

      // Required fields
      for (const field of REQUIRED_FIELDS) {
        if (lesson[field] === undefined || lesson[field] === null) {
          results.fieldErrors.push({ lesson: lessonId, error: `Missing field: ${field}` });
        }
      }

      // slide_content.slides exists with >= 3 slides
      if (lesson.slide_content) {
        if (!lesson.slide_content.slides || !Array.isArray(lesson.slide_content.slides)) {
          results.fieldErrors.push({ lesson: lessonId, error: 'slide_content.slides missing or not an array' });
        } else if (lesson.slide_content.slides.length < 3) {
          results.fieldErrors.push({ lesson: lessonId, error: `slide_content.slides has ${lesson.slide_content.slides.length} slides (minimum 3)` });
        }
      }

      // Quarter check
      if (lesson.week_number !== undefined && lesson.quarter !== undefined) {
        const expectedQuarter = getExpectedQuarter(lesson.week_number);
        if (lesson.quarter !== expectedQuarter) {
          results.fieldErrors.push({ lesson: lessonId, error: `Quarter ${lesson.quarter} does not match week ${lesson.week_number} (expected Q${expectedQuarter})` });
        }
      }

      // day_of_week 1-5
      if (lesson.day_of_week !== undefined && (lesson.day_of_week < 1 || lesson.day_of_week > 5)) {
        results.fieldErrors.push({ lesson: lessonId, error: `day_of_week is ${lesson.day_of_week} (expected 1-5)` });
      }

      // sort_order 1-25
      if (lesson.sort_order !== undefined && (lesson.sort_order < 1 || lesson.sort_order > 25)) {
        results.fieldErrors.push({ lesson: lessonId, error: `sort_order is ${lesson.sort_order} (expected 1-25)` });
      }

      results.allLessons.push({ weekNum: w, lesson });
    });
  }

  return results;
}

function getExpectedQuarter(weekNum) {
  for (const [q, [start, end]] of Object.entries(QUARTER_MAP)) {
    if (weekNum >= start && weekNum <= end) return parseInt(q);
  }
  return -1;
}

// ─── 2. Duplicate Detection ────────────────────────────────────────────────
function detectDuplicates(allLessons) {
  const results = {
    exactDuplicates: [],
    nearDuplicates: [],
    introductionDuplicates: []
  };

  // Build title index: title -> [{ weekNum, sortOrder, subject }]
  const titleIndex = {};
  for (const { weekNum, lesson } of allLessons) {
    const title = lesson.title || '';
    const key = title.toLowerCase().trim();
    if (!titleIndex[key]) titleIndex[key] = [];
    titleIndex[key].push({
      weekNum,
      sortOrder: lesson.sort_order,
      subject: lesson.subject_name,
      title: title
    });
  }

  // Exact duplicates
  for (const [key, entries] of Object.entries(titleIndex)) {
    if (entries.length > 1) {
      results.exactDuplicates.push({
        title: entries[0].title,
        occurrences: entries.map(e => `W${e.weekNum}/S${e.sortOrder} (${e.subject})`)
      });
    }
  }

  // Near-duplicates: compare all unique titles pairwise
  const uniqueTitles = Object.keys(titleIndex);
  const nearDupSet = new Set(); // Track pairs to avoid double-reporting

  for (let i = 0; i < uniqueTitles.length; i++) {
    for (let j = i + 1; j < uniqueTitles.length; j++) {
      const a = uniqueTitles[i];
      const b = uniqueTitles[j];

      // Skip exact duplicates (already reported)
      if (a === b) continue;

      const normA = normalizeTitle(a);
      const normB = normalizeTitle(b);

      // Check: same title minus parenthetical
      const strippedA = stripParenthetical(normA);
      const strippedB = stripParenthetical(normB);

      let isNearDup = false;
      let reason = '';

      if (strippedA === strippedB && normA !== normB) {
        isNearDup = true;
        reason = 'Same base title (different parenthetical)';
      } else {
        // Levenshtein distance
        const dist = levenshtein(normA, normB);
        if (dist > 0 && dist < 5) {
          isNearDup = true;
          reason = `Levenshtein distance = ${dist}`;
        }
      }

      if (isNearDup) {
        const pairKey = [a, b].sort().join('|||');
        if (!nearDupSet.has(pairKey)) {
          nearDupSet.add(pairKey);
          const entriesA = titleIndex[a];
          const entriesB = titleIndex[b];
          results.nearDuplicates.push({
            titleA: entriesA[0].title,
            titleB: entriesB[0].title,
            weeksA: entriesA.map(e => `W${e.weekNum}`).join(', '),
            weeksB: entriesB.map(e => `W${e.weekNum}`).join(', '),
            reason
          });
        }
      }
    }
  }

  // Introduction duplicates: lessons with "Introduction" that share a base title
  const introLessons = allLessons.filter(({ lesson }) =>
    (lesson.title || '').toLowerCase().includes('introduction')
  );
  const introBaseMap = {};
  for (const { weekNum, lesson } of introLessons) {
    const title = lesson.title || '';
    // Extract base: e.g. "Pink Tower — Introduction" -> "pink tower"
    const base = normalizeTitle(title)
      .replace(/introduction/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!introBaseMap[base]) introBaseMap[base] = [];
    introBaseMap[base].push({ weekNum, title, subject: lesson.subject_name });
  }
  for (const [base, entries] of Object.entries(introBaseMap)) {
    // Only flag if same base appears in DIFFERENT weeks
    const weeks = [...new Set(entries.map(e => e.weekNum))];
    if (weeks.length > 1) {
      results.introductionDuplicates.push({
        base,
        entries: entries.map(e => `W${e.weekNum}: "${e.title}"`)
      });
    }
  }

  return results;
}

// ─── 3. Materials Cross-Reference ──────────────────────────────────────────
function crossReferenceMaterials(allLessons, materialsFile) {
  const results = {
    inventoryCount: 0,
    referencedItems: new Set(),       // inventory codes that are matched
    unreferencedItems: [],            // inventory items never matched
    unmatchedLessonMaterials: [],     // lesson materials that match nothing
    codeMatches: 0                    // how many lesson materials matched via code map
  };

  // Load materials inventory
  let inventory = [];
  try {
    inventory = JSON.parse(fs.readFileSync(materialsFile, 'utf-8'));
  } catch (err) {
    console.error(`  WARNING: Could not load materials.json: ${err.message}`);
    return results;
  }

  results.inventoryCount = inventory.length;

  // Build search-friendly index from inventory
  const inventoryItems = inventory.map(item => ({
    code: item.code,
    name: item.name,
    nameLower: item.name.toLowerCase(),
    subject: item.subject_area
  }));

  // Build reverse lookup from code map: code -> [generic name]
  const codeToGeneric = {};
  for (const [genericName, codes] of Object.entries(MATERIAL_CODE_MAP)) {
    for (const code of codes) {
      if (!codeToGeneric[code]) codeToGeneric[code] = [];
      codeToGeneric[code].push(genericName);
    }
  }

  // Collect all unique lesson material references
  const lessonMaterialSet = new Map(); // normalized material -> [{ weekNum, original }]

  for (const { weekNum, lesson } of allLessons) {
    const materials = lesson.materials_needed || [];
    for (const mat of materials) {
      const norm = mat.toLowerCase().trim();
      if (!lessonMaterialSet.has(norm)) lessonMaterialSet.set(norm, []);
      lessonMaterialSet.get(norm).push({ weekNum, original: mat });
    }
  }

  // For each unique lesson material, try to match to inventory
  const matchedMaterials = new Set(); // lesson materials that matched
  const unmatchedMaterials = new Map(); // lesson material -> week list

  for (const [normMat, refs] of lessonMaterialSet.entries()) {
    let matched = false;

    // 1. Check code map first
    for (const [genericName, codes] of Object.entries(MATERIAL_CODE_MAP)) {
      if (normMat.includes(genericName)) {
        for (const code of codes) {
          results.referencedItems.add(code);
        }
        matched = true;
        results.codeMatches++;
        break;
      }
    }

    // 2. Partial match against inventory names
    if (!matched) {
      for (const item of inventoryItems) {
        // Check if lesson material contains inventory name or vice versa
        if (normMat.includes(item.nameLower) || item.nameLower.includes(normMat)) {
          results.referencedItems.add(item.code);
          matched = true;
        }
        // Also check if any significant words match (3+ chars)
        const matWords = normMat.split(/\s+/).filter(w => w.length >= 3);
        const itemWords = item.nameLower.split(/[\s,—–\-]+/).filter(w => w.length >= 3);
        const commonWords = matWords.filter(w => itemWords.includes(w));
        if (commonWords.length >= 2) {
          results.referencedItems.add(item.code);
          matched = true;
        }
      }
    }

    if (!matched) {
      // Skip very generic non-Montessori materials
      const genericItems = [
        'tray', 'mat', 'water', 'towel', 'sponge', 'basket', 'paper', 'crayons',
        'pencil', 'scissors', 'glue', 'tape', 'book', 'cloth', 'bowl', 'pitcher',
        'blanket', 'stuffed animal', 'comfortable', 'floor mat', 'work rug',
        'nature', 'outdoor', 'garden', 'journal', 'notebook', 'paint', 'brush',
        'markers', 'colored pencils', 'construction paper', 'magnifying glass',
        'food', 'snack', 'ingredients', 'apron', 'container', 'bucket', 'rug',
        'timer', 'calendar', 'chart', 'poster', 'cards', 'pictures', 'photos',
        'objects', 'items', 'music', 'song', 'instrument', 'bell', 'drum',
        'mirror', 'picture', 'small', 'large', 'set of', 'pair of', 'index',
        'area', 'spot', 'reading', 'cozy'
      ];
      const isGeneric = genericItems.some(g => normMat.includes(g));
      if (!isGeneric) {
        const weekNums = [...new Set(refs.map(r => r.weekNum))].sort((a, b) => a - b);
        unmatchedMaterials.set(refs[0].original, weekNums);
      }
    }
  }

  // Build unreferenced inventory items
  for (const item of inventoryItems) {
    if (!results.referencedItems.has(item.code)) {
      results.unreferencedItems.push({ code: item.code, name: item.name, subject: item.subject });
    }
  }

  // Sort unmatched by frequency
  results.unmatchedLessonMaterials = [...unmatchedMaterials.entries()]
    .map(([material, weeks]) => ({ material, weeks, weekCount: weeks.length }))
    .sort((a, b) => b.weekCount - a.weekCount);

  return results;
}

// ─── 4. Subject Distribution ───────────────────────────────────────────────
function checkSubjectDistribution(allLessons) {
  const issues = [];

  // Group lessons by week
  const byWeek = {};
  for (const { weekNum, lesson } of allLessons) {
    if (!byWeek[weekNum]) byWeek[weekNum] = [];
    byWeek[weekNum].push(lesson);
  }

  for (const [weekStr, lessons] of Object.entries(byWeek)) {
    const weekNum = parseInt(weekStr);
    const weekIssues = [];

    // Count subjects
    const subjectCounts = {};
    const subjectDays = {};
    for (const lesson of lessons) {
      const subj = lesson.subject_name;
      subjectCounts[subj] = (subjectCounts[subj] || 0) + 1;
      if (!subjectDays[subj]) subjectDays[subj] = [];
      subjectDays[subj].push(lesson.day_of_week);
    }

    // Check 5 lessons per day
    const dayCount = {};
    for (const lesson of lessons) {
      dayCount[lesson.day_of_week] = (dayCount[lesson.day_of_week] || 0) + 1;
    }
    for (let d = 1; d <= 5; d++) {
      const count = dayCount[d] || 0;
      if (count !== 5) {
        weekIssues.push(`Day ${d}: ${count} lessons (expected 5)`);
      }
    }

    // Check required subjects
    for (const [subject, expected] of Object.entries(EXPECTED_SUBJECTS)) {
      const actual = subjectCounts[subject] || 0;
      if (actual !== expected.count) {
        weekIssues.push(`${subject}: ${actual}/week (expected ${expected.count})`);
      }

      // Check day placement
      if (actual > 0 && expected.days) {
        const actualDays = (subjectDays[subject] || []).sort();
        const missingDays = expected.days.filter(d => !actualDays.includes(d));
        const extraDays = actualDays.filter(d => !expected.days.includes(d));
        if (missingDays.length > 0) {
          weekIssues.push(`${subject}: missing on day(s) ${missingDays.join(', ')}`);
        }
        if (extraDays.length > 0) {
          weekIssues.push(`${subject}: unexpected on day(s) ${extraDays.join(', ')}`);
        }
      }
    }

    // Geography/culture should total ~3 per week
    const geoCount = (subjectCounts['geography'] || 0) + (subjectCounts['culture'] || 0);
    if (geoCount < 2 || geoCount > 4) {
      weekIssues.push(`geography+culture combined: ${geoCount}/week (expected ~3)`);
    }

    // Check sort_order uniqueness within week
    const sortOrders = lessons.map(l => l.sort_order).filter(s => s !== undefined);
    const sortOrderSet = new Set(sortOrders);
    if (sortOrderSet.size !== sortOrders.length) {
      const dupes = sortOrders.filter((s, i) => sortOrders.indexOf(s) !== i);
      weekIssues.push(`Duplicate sort_order values: ${[...new Set(dupes)].join(', ')}`);
    }

    // Check sort_order sequential 1-25
    const sortedOrders = [...sortOrderSet].sort((a, b) => a - b);
    if (sortedOrders.length === LESSONS_PER_WEEK) {
      if (sortedOrders[0] !== 1 || sortedOrders[sortedOrders.length - 1] !== LESSONS_PER_WEEK) {
        weekIssues.push(`sort_order range: ${sortedOrders[0]}-${sortedOrders[sortedOrders.length - 1]} (expected 1-25)`);
      }
    }

    if (weekIssues.length > 0) {
      issues.push({ week: weekNum, issues: weekIssues });
    }
  }

  return issues;
}

// ─── 5. Output / Dashboard ─────────────────────────────────────────────────
function printDashboard(jsonResults, dupResults, matResults, distIssues) {
  const sep = '='.repeat(60);
  const sep2 = '-'.repeat(60);

  console.log('');
  console.log(sep);
  console.log('           CURRICULUM VALIDATION REPORT');
  console.log(sep);
  console.log('');

  // Summary
  console.log(`  Weeks found:    ${jsonResults.weeksFound.length} of ${TOTAL_WEEKS}`);
  console.log(`  Weeks present:  [${jsonResults.weeksFound.join(', ')}]`);
  if (jsonResults.weeksMissing.length > 0) {
    console.log(`  Weeks missing:  [${jsonResults.weeksMissing.join(', ')}]`);
  }
  console.log(`  Total lessons:  ${jsonResults.totalLessons} of ${TOTAL_LESSONS}`);
  console.log('');

  // JSON Errors
  console.log(sep2);
  console.log('  JSON PARSE ERRORS');
  console.log(sep2);
  if (jsonResults.jsonErrors.length === 0) {
    console.log('  None');
  } else {
    for (const err of jsonResults.jsonErrors) {
      console.log(`  Week ${err.week}: ${err.error}`);
    }
  }
  console.log('');

  // Lesson Count Errors
  console.log(sep2);
  console.log('  LESSON COUNT ERRORS');
  console.log(sep2);
  if (jsonResults.lessonCountErrors.length === 0) {
    console.log('  None');
  } else {
    for (const err of jsonResults.lessonCountErrors) {
      console.log(`  Week ${err.week}: found ${err.found}, expected ${err.expected}`);
    }
  }
  console.log('');

  // Field Validation Errors
  console.log(sep2);
  console.log('  FIELD VALIDATION ERRORS');
  console.log(sep2);
  if (jsonResults.fieldErrors.length === 0) {
    console.log('  None');
  } else {
    // Group by error type
    const byType = {};
    for (const err of jsonResults.fieldErrors) {
      const key = err.error;
      if (!byType[key]) byType[key] = [];
      byType[key].push(err.lesson);
    }
    for (const [errType, lessons] of Object.entries(byType)) {
      console.log(`  ${errType}:`);
      for (const l of lessons.slice(0, 10)) {
        console.log(`    - ${l}`);
      }
      if (lessons.length > 10) {
        console.log(`    ... and ${lessons.length - 10} more`);
      }
    }
  }
  console.log(`  Total field errors: ${jsonResults.fieldErrors.length}`);
  console.log('');

  // Exact Duplicates
  console.log(sep2);
  console.log('  EXACT DUPLICATE TITLES');
  console.log(sep2);
  if (dupResults.exactDuplicates.length === 0) {
    console.log('  None');
  } else {
    console.log(`  Count: ${dupResults.exactDuplicates.length}`);
    console.log('');
    console.log('  ' + 'Title'.padEnd(50) + 'Occurrences');
    console.log('  ' + '-'.repeat(50) + ' ' + '-'.repeat(40));
    for (const dup of dupResults.exactDuplicates) {
      const titleTrunc = dup.title.length > 48 ? dup.title.substring(0, 45) + '...' : dup.title;
      console.log(`  ${titleTrunc.padEnd(50)} ${dup.occurrences.join(', ')}`);
    }
  }
  console.log('');

  // Near-Duplicates
  console.log(sep2);
  console.log('  NEAR-DUPLICATE TITLES');
  console.log(sep2);
  if (dupResults.nearDuplicates.length === 0) {
    console.log('  None');
  } else {
    console.log(`  Count: ${dupResults.nearDuplicates.length}`);
    console.log('');
    for (const nd of dupResults.nearDuplicates.slice(0, 50)) {
      console.log(`  "${nd.titleA}" (${nd.weeksA})`);
      console.log(`    vs "${nd.titleB}" (${nd.weeksB})`);
      console.log(`    Reason: ${nd.reason}`);
      console.log('');
    }
    if (dupResults.nearDuplicates.length > 50) {
      console.log(`  ... and ${dupResults.nearDuplicates.length - 50} more`);
    }
  }

  // Introduction Duplicates
  if (dupResults.introductionDuplicates.length > 0) {
    console.log(sep2);
    console.log('  REPEATED INTRODUCTION LESSONS');
    console.log(sep2);
    console.log(`  Count: ${dupResults.introductionDuplicates.length}`);
    console.log('');
    for (const intro of dupResults.introductionDuplicates) {
      console.log(`  Base: "${intro.base}"`);
      for (const entry of intro.entries) {
        console.log(`    ${entry}`);
      }
      console.log('');
    }
  }

  // Materials Cross-Reference
  console.log(sep2);
  console.log('  MATERIALS INVENTORY CROSS-REFERENCE');
  console.log(sep2);
  console.log(`  Inventory items:     ${matResults.inventoryCount}`);
  console.log(`  Referenced items:    ${matResults.referencedItems.size} of ${matResults.inventoryCount}`);
  console.log(`  Unreferenced items:  ${matResults.unreferencedItems.length}`);
  console.log(`  Code-map matches:    ${matResults.codeMatches}`);
  console.log('');

  console.log('  TOP 20 UNREFERENCED INVENTORY ITEMS:');
  for (const item of matResults.unreferencedItems.slice(0, 20)) {
    console.log(`    ${item.code}  ${item.name.substring(0, 55).padEnd(55)}  [${item.subject}]`);
  }
  if (matResults.unreferencedItems.length > 20) {
    console.log(`    ... and ${matResults.unreferencedItems.length - 20} more`);
  }
  console.log('');

  console.log('  TOP 20 UNMATCHED LESSON MATERIALS:');
  for (const um of matResults.unmatchedLessonMaterials.slice(0, 20)) {
    const weeksStr = um.weeks.length <= 5 ? um.weeks.map(w => `W${w}`).join(', ') : `${um.weekCount} weeks`;
    console.log(`    "${um.material}" (${weeksStr})`);
  }
  if (matResults.unmatchedLessonMaterials.length > 20) {
    console.log(`    ... and ${matResults.unmatchedLessonMaterials.length - 20} more`);
  }
  console.log('');

  // Subject Distribution
  console.log(sep2);
  console.log('  SUBJECT DISTRIBUTION ISSUES');
  console.log(sep2);
  if (distIssues.length === 0) {
    console.log('  None');
  } else {
    for (const wi of distIssues) {
      console.log(`  Week ${wi.week}:`);
      for (const issue of wi.issues) {
        console.log(`    - ${issue}`);
      }
    }
  }
  console.log('');

  // Final summary
  console.log(sep);
  const totalErrors = jsonResults.jsonErrors.length
    + jsonResults.lessonCountErrors.length
    + jsonResults.fieldErrors.length;
  const totalDups = dupResults.exactDuplicates.length + dupResults.nearDuplicates.length;

  if (totalErrors === 0 && totalDups === 0 && distIssues.length === 0) {
    console.log('  ALL CHECKS PASSED');
  } else {
    console.log(`  SUMMARY: ${totalErrors} validation error(s), ${totalDups} duplicate(s), ${distIssues.length} week(s) with distribution issues`);
  }
  console.log(sep);
  console.log('');
}

// ─── Main ──────────────────────────────────────────────────────────────────
function main() {
  console.log('Validating curriculum data...');
  console.log(`  Lessons dir: ${LESSONS_DIR}`);
  console.log(`  Materials:   ${MATERIALS_FILE}`);

  // 1. JSON Validation
  const jsonResults = validateJSON(LESSONS_DIR);

  // 2. Duplicate Detection
  const dupResults = detectDuplicates(jsonResults.allLessons);

  // 3. Materials Cross-Reference
  const matResults = crossReferenceMaterials(jsonResults.allLessons, MATERIALS_FILE);

  // 4. Subject Distribution
  const distIssues = checkSubjectDistribution(jsonResults.allLessons);

  // 5. Output
  printDashboard(jsonResults, dupResults, matResults, distIssues);
}

main();
