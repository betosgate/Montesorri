#!/usr/bin/env node
/**
 * seed-demo-data.js — Seeds all demo data for the 3 demo accounts
 *
 * Populates: students, teacher, lessons (2,700), scope_sequence_items,
 *   classes, class_sessions, enrollments, student_lesson_progress,
 *   student_mastery, observations, work_plans, portfolio_items,
 *   normalization_snapshots
 *
 * Run:  node scripts/seed-demo-data.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Load .env.local
// ============================================================================
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// ============================================================================
// Known IDs (from Supabase auth + seed data)
// ============================================================================
const PARENT_ID = '4e89b7b5-73ab-4974-ad9d-c56dfa273a99';
const TEACHER_USER_ID = 'f11903a1-fcec-4dd8-98f5-90f4e3f9f260';
const STUDENT_USER_ID = 'a28d1af0-5481-4cc8-bd95-db2639111b6c';

const LEVEL_IDS = {
  primary: 'e0d86d36-5154-44dd-baf8-9324a23d971b',
  lower_elementary: 'd09fcfa6-c929-4684-bcf4-5c958b974d5f',
  upper_elementary: 'b2ac3d07-c1f9-4ce9-8186-16c73929b04d',
};

// ============================================================================
// UUID helper
// ============================================================================
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ============================================================================
// Date helpers (today = 2026-02-24)
// ============================================================================
const TODAY = '2026-02-24';

function daysAgo(n) {
  const d = new Date(TODAY + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function addDays(base, n) {
  const d = new Date(base + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ============================================================================
// Supabase REST helpers
// ============================================================================
const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function query(table, select = '*', filters = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${filters}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${table}: ${res.status} ${text}`);
  }
  return res.json();
}

async function insert(table, rows, returnData = false) {
  const arr = Array.isArray(rows) ? rows : [rows];
  if (arr.length === 0) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      ...headers,
      Prefer: returnData ? 'return=representation' : 'return=minimal',
    },
    body: JSON.stringify(arr),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`INSERT ${table} (${arr.length} rows): ${res.status} ${text}`);
  }
  return returnData ? res.json() : [];
}

async function batchInsert(table, rows, batchSize = 50, returnData = false) {
  const results = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const data = await insert(table, batch, returnData);
    if (returnData) results.push(...data);
  }
  return results;
}

async function deleteWhere(table, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal' },
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn(`  WARN delete ${table}: ${res.status} ${text.slice(0, 120)}`);
  }
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  console.log('Seeding demo data...\n');

  // ------------------------------------------------------------------
  // Fetch subject map
  // ------------------------------------------------------------------
  const subjects = await query('subjects', 'id,name');
  const subjectMap = Object.fromEntries(subjects.map(s => [s.name, s.id]));
  console.log(`  Found ${subjects.length} subjects`);

  // ------------------------------------------------------------------
  // Clean up previous demo data (cascade handles children)
  // ------------------------------------------------------------------
  console.log('\n  Cleaning previous demo data...');
  await deleteWhere('students', `parent_id=eq.${PARENT_ID}`);
  await deleteWhere('teachers', `user_id=eq.${TEACHER_USER_ID}`);
  // Delete all lessons (safe because they were only seeded by us)
  for (const levelId of Object.values(LEVEL_IDS)) {
    await deleteWhere('lessons', `level_id=eq.${levelId}`);
  }
  // Delete scope sequence items
  for (const levelId of Object.values(LEVEL_IDS)) {
    await deleteWhere('scope_sequence_items', `level_id=eq.${levelId}`);
  }
  // Delete classes by teacher (teacher was just deleted, so FK cascade may have handled it)
  await deleteWhere('normalization_snapshots', `student_id=neq.00000000-0000-0000-0000-000000000000`);
  console.log('  Done.\n');

  // ==================================================================
  // A. Students (3 records)
  // ==================================================================
  console.log('A. Seeding students...');

  const SOFIA_ID = uuid();
  const MATEO_ID = uuid();
  const STUDENT_RECORD_ID = uuid();

  await insert('students', [
    {
      id: SOFIA_ID,
      parent_id: PARENT_ID,
      first_name: 'Sofia',
      last_name: 'Martinez',
      date_of_birth: '2020-09-15',
      grade_band: 'primary',
      enrollment_status: 'active',
      academic_year: 2025,
      start_week: 1,
    },
    {
      id: MATEO_ID,
      parent_id: PARENT_ID,
      first_name: 'Mateo',
      last_name: 'Martinez',
      date_of_birth: '2018-03-22',
      grade_band: 'lower_elementary',
      enrollment_status: 'active',
      academic_year: 2025,
      start_week: 1,
    },
    {
      id: STUDENT_RECORD_ID,
      parent_id: PARENT_ID,
      first_name: 'Isabella',
      last_name: 'Martinez',
      date_of_birth: '2014-06-10',
      grade_band: 'upper_elementary',
      enrollment_status: 'active',
      academic_year: 2025,
      start_week: 1,
    },
  ]);
  console.log('   3 students created');

  // ==================================================================
  // B. Teacher (1 record)
  // ==================================================================
  console.log('B. Seeding teacher...');

  const TEACHER_ID = uuid();
  await insert('teachers', [{
    id: TEACHER_ID,
    user_id: TEACHER_USER_ID,
    bio: 'Montessori-certified educator with 12 years of experience. Specializes in cosmic education and peace curriculum. AMI-trained for ages 6-12.',
    qualifications: 'AMI Montessori Diploma (6-12), M.Ed. in Curriculum & Instruction',
    zoom_link: 'https://zoom.us/j/1234567890',
    is_active: true,
    is_substitute: false,
    max_classes: 6,
  }]);
  console.log('   Teacher created');

  // ==================================================================
  // C. Lessons (2,700 from JSON files)
  // ==================================================================
  console.log('C. Seeding lessons (this takes a moment)...');

  const levelDirs = {
    primary: 'primary-lessons',
    lower_elementary: 'lower-elementary-lessons',
    upper_elementary: 'upper-elementary-lessons',
  };

  // Map invalid lesson_type values to valid DB enum values
  const lessonTypeMap = {
    guided: 'guided',
    independent: 'independent',
    project: 'project',
    review: 'review',
    assessment: 'assessment',
    great_lesson: 'great_lesson',
    // Map non-enum types
    collaborative: 'guided',
    enrichment: 'independent',
    group: 'guided',
    practice: 'independent',
    read_aloud: 'guided',
  };

  let totalLessons = 0;

  for (const [levelName, dirName] of Object.entries(levelDirs)) {
    const levelId = LEVEL_IDS[levelName];
    const dir = path.join(__dirname, 'data', dirName);
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('week-') && f.endsWith('.json'))
      .sort((a, b) => {
        const wa = parseInt(a.match(/week-(\d+)/)?.[1] || '0');
        const wb = parseInt(b.match(/week-(\d+)/)?.[1] || '0');
        return wa - wb;
      });

    let levelCount = 0;

    for (const file of files) {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));

      const lessons = raw.map(r => ({
        level_id: levelId,
        subject_id: subjectMap[r.subject_name],
        week_number: r.week_number,
        day_of_week: r.day_of_week,
        quarter: r.quarter,
        title: r.title,
        description: r.description,
        instructions: r.instructions,
        duration_minutes: r.duration_minutes,
        lesson_type: lessonTypeMap[r.lesson_type] || 'guided',
        materials_needed: r.materials_needed,
        slide_content: r.slide_content,
        parent_notes: r.parent_notes,
        age_adaptations: r.age_adaptations,
        sort_order: r.sort_order,
      })).filter(l => l.subject_id);

      await batchInsert('lessons', lessons, 50);
      levelCount += lessons.length;
    }

    console.log(`   ${levelName}: ${levelCount} lessons (${files.length} weeks)`);
    totalLessons += levelCount;
  }

  console.log(`   Total: ${totalLessons} lessons`);

  // ==================================================================
  // D. Scope sequence items (from scope-sequence.json)
  // ==================================================================
  console.log('D. Seeding scope sequence items...');

  const scopeRaw = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'scope-sequence.json'), 'utf-8')
  );

  const scopeRows = scopeRaw.map(s => ({
    level_id: LEVEL_IDS[s.level_name],
    subject_id: subjectMap[s.subject_name],
    sub_area: s.area || null,
    name: s.skill,
    sort_order: s.sequence_order || 0,
    materials_needed: s.materials_needed || [],
    prerequisites: s.prerequisites || [],
  })).filter(s => s.level_id && s.subject_id);

  const allScopeItems = await batchInsert('scope_sequence_items', scopeRows, 50, true);
  console.log(`   ${allScopeItems.length} scope items`);

  // ==================================================================
  // E. Classes (3) + class sessions (12)
  // ==================================================================
  console.log('E. Seeding classes and sessions...');

  const CLASS_PRIMARY_ID = uuid();
  const CLASS_LOWER_ID = uuid();
  const CLASS_UPPER_ID = uuid();

  await insert('classes', [
    {
      id: CLASS_PRIMARY_ID,
      teacher_id: TEACHER_ID,
      grade_band: 'primary',
      title: 'Primary Circle Time',
      day_of_week: 1,
      start_time: '10:00',
      duration_minutes: 45,
      zoom_link: 'https://zoom.us/j/1234567890',
      max_students: 8,
      academic_year: 2025,
      status: 'active',
    },
    {
      id: CLASS_LOWER_ID,
      teacher_id: TEACHER_ID,
      grade_band: 'lower_elementary',
      title: 'Lower El Science Lab',
      day_of_week: 3,
      start_time: '14:00',
      duration_minutes: 60,
      zoom_link: 'https://zoom.us/j/1234567891',
      max_students: 10,
      academic_year: 2025,
      status: 'active',
    },
    {
      id: CLASS_UPPER_ID,
      teacher_id: TEACHER_ID,
      grade_band: 'upper_elementary',
      title: 'Upper El Book Club',
      day_of_week: 5,
      start_time: '11:00',
      duration_minutes: 60,
      zoom_link: 'https://zoom.us/j/1234567892',
      max_students: 10,
      academic_year: 2025,
      status: 'active',
    },
  ]);
  console.log('   3 classes created');

  // 4 upcoming sessions per class (next 4 weeks from today)
  const sessions = [];
  const classConfigs = [
    { classId: CLASS_PRIMARY_ID, dayOffset: 0 },   // Mon
    { classId: CLASS_LOWER_ID, dayOffset: 2 },      // Wed
    { classId: CLASS_UPPER_ID, dayOffset: 4 },       // Fri
  ];

  for (const { classId, dayOffset } of classConfigs) {
    for (let w = 0; w < 4; w++) {
      sessions.push({
        class_id: classId,
        session_date: addDays(TODAY, dayOffset + w * 7),
        session_number: 26 + w,
        status: 'scheduled',
      });
    }
  }

  await insert('class_sessions', sessions);
  console.log(`   ${sessions.length} class sessions`);

  // ==================================================================
  // F. Enrollments (3)
  // ==================================================================
  console.log('F. Seeding enrollments...');

  await insert('enrollments', [
    { student_id: SOFIA_ID, class_id: CLASS_PRIMARY_ID, status: 'active' },
    { student_id: MATEO_ID, class_id: CLASS_LOWER_ID, status: 'active' },
    { student_id: STUDENT_RECORD_ID, class_id: CLASS_UPPER_ID, status: 'active' },
  ]);
  console.log('   3 enrollments');

  // ==================================================================
  // G. Student lesson progress (~28 per student)
  // ==================================================================
  console.log('G. Seeding lesson progress...');

  const studentLevels = [
    { studentId: SOFIA_ID, levelId: LEVEL_IDS.primary },
    { studentId: MATEO_ID, levelId: LEVEL_IDS.lower_elementary },
    { studentId: STUDENT_RECORD_ID, levelId: LEVEL_IDS.upper_elementary },
  ];

  let totalProgress = 0;

  for (const { studentId, levelId } of studentLevels) {
    // Week 25 lessons (last week — all completed)
    const lessonsW25 = await query(
      'lessons', 'id,day_of_week',
      `&level_id=eq.${levelId}&week_number=eq.25&order=sort_order`
    );
    // Week 26 lessons (this week)
    const lessonsW26 = await query(
      'lessons', 'id,day_of_week',
      `&level_id=eq.${levelId}&week_number=eq.26&order=sort_order`
    );

    const progress = [];

    // Week 25: all completed (Mon-Fri last week: Feb 17-21)
    for (const lesson of lessonsW25) {
      const dayDate = addDays('2026-02-16', lesson.day_of_week);
      progress.push({
        student_id: studentId,
        lesson_id: lesson.id,
        status: 'completed',
        completed_at: dayDate + 'T15:00:00Z',
      });
    }

    // Week 26 day 1 (today, Monday): 3 completed, 1 in_progress, 1 not started
    const todayLessons = lessonsW26.filter(l => l.day_of_week === 1);
    todayLessons.forEach((lesson, i) => {
      if (i < 3) {
        progress.push({
          student_id: studentId,
          lesson_id: lesson.id,
          status: 'completed',
          completed_at: TODAY + 'T11:00:00Z',
        });
      } else if (i === 3) {
        progress.push({
          student_id: studentId,
          lesson_id: lesson.id,
          status: 'in_progress',
          completed_at: null,
        });
      }
      // i === 4: not started — no record
    });

    if (progress.length > 0) {
      await batchInsert('student_lesson_progress', progress, 50);
    }
    totalProgress += progress.length;
  }

  console.log(`   ${totalProgress} progress records`);

  // ==================================================================
  // H. Student mastery (scope items per student)
  // ==================================================================
  console.log('H. Seeding student mastery...');

  let totalMastery = 0;

  for (const { studentId, levelId } of studentLevels) {
    const items = allScopeItems.filter(s => s.level_id === levelId);
    const records = [];

    for (const item of items) {
      const r = Math.random();
      let status = 'not_introduced';
      let date_presented = null;
      let date_mastered = null;

      if (r < 0.20) {
        status = 'mastered';
        date_presented = daysAgo(90 + Math.floor(Math.random() * 60));
        date_mastered = daysAgo(Math.floor(Math.random() * 30));
      } else if (r < 0.35) {
        status = 'developing';
        date_presented = daysAgo(60 + Math.floor(Math.random() * 30));
      } else if (r < 0.55) {
        status = 'practicing';
        date_presented = daysAgo(45 + Math.floor(Math.random() * 30));
      } else if (r < 0.70) {
        status = 'presented';
        date_presented = daysAgo(14 + Math.floor(Math.random() * 30));
      }
      // else: not_introduced (30%)

      records.push({
        student_id: studentId,
        scope_item_id: item.id,
        status,
        date_presented,
        date_mastered,
      });
    }

    await batchInsert('student_mastery', records, 50);
    totalMastery += records.length;
  }

  console.log(`   ${totalMastery} mastery records`);

  // ==================================================================
  // I. Observations (8 per student, 16 total)
  // ==================================================================
  console.log('I. Seeding observations...');

  const obsData = [
    // Sofia (primary)
    { sid: SOFIA_ID, type: 'concentration', area: 'Practical Life', content: 'Sofia spent 25 minutes focused on the Pink Tower, carefully stacking all 10 cubes from largest to smallest. She noticed her error on the 7th cube and self-corrected without prompting.', dur: 25, ind: 'independent' },
    { sid: SOFIA_ID, type: 'work_log', area: 'Sensorial', content: 'Completed the Knobbed Cylinders (Block 1) three times in succession. Showed great satisfaction upon completion. Ready to try Block 2.', dur: 15, ind: 'independent' },
    { sid: SOFIA_ID, type: 'anecdotal', area: 'Language', content: 'During I Spy, Sofia identified 8 beginning sounds correctly. She is especially confident with /s/, /m/, and /t/ sounds. Suggested introducing sandpaper letters next week.', dur: null, ind: 'needs_prompt' },
    { sid: SOFIA_ID, type: 'social_emotional', area: null, content: 'Sofia invited a younger child to work alongside her during free choice time. She patiently demonstrated how to roll a mat. Showing beautiful grace and courtesy development.', dur: null, ind: 'independent' },
    { sid: SOFIA_ID, type: 'concentration', area: 'Math', content: 'Worked with number rods for 20 minutes, successfully associating quantities 1-5 with their corresponding rods. Counted aloud with confidence.', dur: 20, ind: 'needs_prompt' },
    { sid: SOFIA_ID, type: 'work_log', area: 'Practical Life', content: 'First time doing the pouring exercise with a funnel. Some spills but cleaned up independently using the sponge. Repeated the work 4 times.', dur: 18, ind: 'independent' },
    { sid: SOFIA_ID, type: 'anecdotal', area: 'Geography', content: 'Showed great interest in the globe today. Asked "Where do penguins live?" — used this as a springboard to discuss Antarctica. Very curious about cold climates.', dur: null, ind: 'needs_prompt' },
    { sid: SOFIA_ID, type: 'concentration', area: 'Art & Music', content: 'Spent 30 minutes on a watercolor painting of a butterfly. Mixed colors thoughtfully and cleaned brushes between each color without reminding.', dur: 30, ind: 'independent' },
    // Mateo (lower elementary)
    { sid: MATEO_ID, type: 'work_log', area: 'Math', content: 'Mateo worked with the golden bead material to solve 3-digit addition with exchange. Completed 5 problems, showing confidence with exchanging tens to hundreds.', dur: 35, ind: 'independent' },
    { sid: MATEO_ID, type: 'concentration', area: 'Language', content: 'Deep concentration during creative writing. Wrote a 2-page story about a space adventure. Used paragraph structure and dialogue for the first time.', dur: 40, ind: 'independent' },
    { sid: MATEO_ID, type: 'anecdotal', area: 'Science', content: 'Led a small group experiment on plant growth. Hypothesized that the plant near the window would grow faster. Set up experiment with careful documentation in his science journal.', dur: null, ind: 'independent' },
    { sid: MATEO_ID, type: 'social_emotional', area: null, content: 'Mateo helped a younger student understand the Timeline of Life. He explained concepts clearly and showed patience when the child asked repeated questions. Natural teaching instinct.', dur: null, ind: 'independent' },
    { sid: MATEO_ID, type: 'work_log', area: 'Geography', content: 'Completed the puzzle map of South America. Named all countries and their capitals without reference. Ready for the pin map work.', dur: 25, ind: 'independent' },
    { sid: MATEO_ID, type: 'concentration', area: 'History', content: 'Spent the entire work period (45 min) researching ancient Egypt for his timeline project. Took detailed notes and created a beautiful illustration of a pyramid cross-section.', dur: 45, ind: 'independent' },
    { sid: MATEO_ID, type: 'anecdotal', area: 'Math', content: 'Had an "aha moment" with fractions today. Used the fraction circles to discover that 2/4 = 1/2. Excitedly showed his finding to three other students.', dur: null, ind: 'independent' },
    { sid: MATEO_ID, type: 'work_log', area: 'Practical Life', content: 'Prepared a fruit salad for the class snack. Measured ingredients, cut fruit safely, and served everyone. Cleaned the workspace thoroughly afterward.', dur: 30, ind: 'independent' },
  ];

  const observations = obsData.map((o, i) => ({
    student_id: o.sid,
    observer_id: PARENT_ID,
    observation_date: daysAgo(Math.floor(i * 2) + 1),
    observation_type: o.type,
    curriculum_area: o.area,
    content: o.content,
    concentration_duration: o.dur,
    independence_level: o.ind,
    photo_urls: [],
  }));

  await insert('observations', observations);
  console.log(`   ${observations.length} observations`);

  // ==================================================================
  // J. Work plans (2 per student = 6 total)
  // ==================================================================
  console.log('J. Seeding work plans...');

  const workPlans = [];

  for (const { studentId, levelId } of studentLevels) {
    for (const weekNum of [25, 26]) {
      const weekLessons = await query(
        'lessons', 'id',
        `&level_id=eq.${levelId}&week_number=eq.${weekNum}&order=sort_order&limit=10`
      );
      const ids = weekLessons.map(l => l.id);

      workPlans.push({
        student_id: studentId,
        week_number: weekNum,
        academic_year: 2025,
        must_do: ids.slice(0, 5),
        may_do: ids.slice(5, 8),
        planned_activities: [],
        reflection_notes: weekNum === 25
          ? 'Great week! Completed all must-do activities and two may-do activities.'
          : null,
      });
    }
  }

  await insert('work_plans', workPlans);
  console.log(`   ${workPlans.length} work plans`);

  // ==================================================================
  // K. Portfolio items (5 per student = 10 total)
  // ==================================================================
  console.log('K. Seeding portfolio items...');

  const imagePool = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'data', 'image-pool.json'), 'utf-8')
  );
  const allImages = Object.values(imagePool).flat();

  const portfolioData = [
    { sid: SOFIA_ID, type: 'work_sample', area: 'Practical Life', title: 'Pink Tower Exploration', desc: 'Sofia built the Pink Tower independently for the first time, showing great care with each cube.', feat: true },
    { sid: SOFIA_ID, type: 'art', area: 'Art & Music', title: 'Watercolor Butterfly', desc: 'Beautiful watercolor painting created during free art time.', feat: false },
    { sid: SOFIA_ID, type: 'photo', area: 'Sensorial', title: 'Color Box Matching', desc: 'Matching all color tablets from Color Box 2.', feat: false },
    { sid: SOFIA_ID, type: 'writing', area: 'Language', title: 'My First Letter — S', desc: 'Traced and wrote the letter S using sandpaper letters as guide.', feat: true },
    { sid: SOFIA_ID, type: 'project', area: 'Geography', title: 'Continent Map Puzzle', desc: 'Completed the world continent puzzle and labeled each continent.', feat: false },
    { sid: MATEO_ID, type: 'work_sample', area: 'Math', title: 'Golden Bead Addition', desc: 'Multi-digit addition with exchanges using the golden bead material.', feat: true },
    { sid: MATEO_ID, type: 'writing', area: 'Language', title: 'Space Adventure Story', desc: 'Creative writing piece about a journey to Mars, with illustrations.', feat: true },
    { sid: MATEO_ID, type: 'project', area: 'History', title: 'Ancient Egypt Timeline', desc: 'Research project with hand-drawn timeline of ancient Egyptian dynasties.', feat: false },
    { sid: MATEO_ID, type: 'photo', area: 'Science', title: 'Plant Growth Experiment', desc: 'Documentation of our 3-week plant growth experiment comparing light conditions.', feat: false },
    { sid: MATEO_ID, type: 'art', area: 'Art & Music', title: 'Clay Volcano Model', desc: 'Hand-sculpted volcano model created for our geology unit.', feat: false },
  ];

  const portfolioItems = portfolioData.map((p, i) => ({
    student_id: p.sid,
    item_type: p.type,
    curriculum_area: p.area,
    title: p.title,
    description: p.desc,
    file_url: allImages[i % allImages.length].url,
    date_created: daysAgo(i * 4 + 2),
    featured: p.feat,
  }));

  await insert('portfolio_items', portfolioItems);
  console.log(`   ${portfolioItems.length} portfolio items`);

  // ==================================================================
  // L. Normalization snapshots (3 per student = 9 total)
  // ==================================================================
  console.log('L. Seeding normalization snapshots...');

  const normSnapshots = [];

  for (const { studentId } of studentLevels) {
    // Three snapshots showing improvement over time
    const progression = [
      { date: daysAgo(30), scores: [3, 2, 3, 3, 2, 3, 3], notes: null },
      { date: daysAgo(15), scores: [3, 3, 4, 3, 3, 3, 4], notes: null },
      { date: TODAY,        scores: [4, 4, 4, 4, 4, 4, 5], notes: 'Wonderful progress this month. Showing increased independence and joy in learning.' },
    ];

    for (const p of progression) {
      normSnapshots.push({
        student_id: studentId,
        snapshot_date: p.date,
        love_of_order: p.scores[0],
        love_of_work: p.scores[1],
        spontaneous_concentration: p.scores[2],
        attachment_to_reality: p.scores[3],
        independence: p.scores[4],
        spontaneous_self_discipline: p.scores[5],
        joy: p.scores[6],
        notes: p.notes,
      });
    }
  }

  await insert('normalization_snapshots', normSnapshots);
  console.log(`   ${normSnapshots.length} normalization snapshots`);

  // ==================================================================
  // Done
  // ==================================================================
  console.log('\nDemo data seeding complete!');
  console.log('  Login as:');
  console.log('  - student@montessori-demo.com  -> Student dashboard');
  console.log('  - parent@montessori-demo.com   -> Parent dashboard');
  console.log('  - teacher@montessori-demo.com  -> Teacher schedule');
}

main().catch(err => {
  console.error('\nSeeding failed:', err.message);
  process.exit(1);
});
