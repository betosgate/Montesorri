const fs = require('fs');
const path = require('path');

function fullValidation(dir, expectedLevel) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f.indexOf('part') === -1).sort();
  let totalLessons = 0;
  const parseErrors = [];
  const fieldErrors = [];
  const allTitles = new Set();
  const dupTitles = [];
  let levelErrors = 0;

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (Array.isArray(data) === false) { parseErrors.push(file + ': not array'); continue; }
      totalLessons += data.length;
      if (data.length !== 25) fieldErrors.push(file + ': ' + data.length + ' lessons');
      for (const l of data) {
        if (l.level_name !== expectedLevel) levelErrors++;
        if (allTitles.has(l.title)) dupTitles.push(l.title);
        allTitles.add(l.title);
      }
    } catch(e) { parseErrors.push(file + ': ' + e.message.substring(0,80)); }
  }

  console.log('=== ' + expectedLevel.toUpperCase() + ' ===');
  console.log('Files: ' + files.length + '/36 | Lessons: ' + totalLessons);
  console.log('Parse errors: ' + (parseErrors.length ? parseErrors.join('; ') : 'none'));
  console.log('Field errors: ' + (fieldErrors.length ? fieldErrors.join('; ') : 'none'));
  console.log('Level mismatches: ' + (levelErrors || 'none'));
  console.log('Duplicate titles within level: ' + dupTitles.length);
  if (dupTitles.length > 0) console.log('  First 10: ' + dupTitles.slice(0,10).join(' | '));

  const miss = [];
  const weeks = files.map(f => parseInt(f.match(/week-(\d+)/)[1])).sort((a,b) => a-b);
  for (let i = 1; i <= 36; i++) { if (weeks.indexOf(i) === -1) miss.push(i); }
  if (miss.length) console.log('Missing weeks: ' + miss.join(', '));
  else console.log('All 36 weeks present');
  console.log('');
  return { totalLessons, dupTitles, uniqueTitles: allTitles };
}

const p = fullValidation('scripts/data/primary-lessons', 'primary');
const le = fullValidation('scripts/data/lower-elementary-lessons', 'lower_elementary');
const ue = fullValidation('scripts/data/upper-elementary-lessons', 'upper_elementary');

// Cross-level duplicate check
const crossDups = [];
for (const t of le.uniqueTitles) { if (p.uniqueTitles.has(t)) crossDups.push('P+LE: ' + t); }
for (const t of ue.uniqueTitles) { if (p.uniqueTitles.has(t)) crossDups.push('P+UE: ' + t); }
for (const t of ue.uniqueTitles) { if (le.uniqueTitles.has(t)) crossDups.push('LE+UE: ' + t); }

console.log('=== CROSS-LEVEL DUPLICATES ===');
console.log('Total: ' + crossDups.length);
if (crossDups.length > 0) console.log(crossDups.slice(0,20).join('\n'));

console.log('\n=== GRAND TOTAL ===');
console.log(p.totalLessons + le.totalLessons + ue.totalLessons + ' lessons across 3 levels');
