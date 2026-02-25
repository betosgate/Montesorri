#!/usr/bin/env node
/**
 * Seed materials_inventory into Supabase with Adena product images.
 *
 * 1. Reads materials.json (279 items)
 * 2. Matches items to Adena product codes by name similarity
 * 3. Adds image_url from adenamontessori.com for matched items
 * 4. Upserts all materials into Supabase materials_inventory table
 */

const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

// All 118 Adena kit items: code → name
const ADENA_ITEMS = {
  // Language Arts
  'A095': 'Detective Adjective Exercise',
  'L060': 'Solid Grammar Symbols',
  'L081': 'Grammar Symbols Cards with Box',
  'L090': 'Reading Analysis 1st Chart & Box',
  'L100': 'Sentence Analysis 1st & 2nd Set',
  'L180-1': 'Grammar Boxes Set -1',
  'C109': 'Greenboards with Lines',
  'L010': 'Lower Case Sandpaper Letters - Print',
  'L032': 'Lowercase Small Movable Alphabet - Pink',
  'L033': 'Lowercase Small Movable Alphabet - Blue',
  'L034': 'Lowercase Small Movable Alphabet - Black',
  'L030': 'Box for Lowercase Small Movable Alphabet',
  'L041': 'Metal Insets with 2 Stands',
  // Math - Number & Operations
  'C010': 'Number Rods',
  'C044': 'Card and Counters - 2',
  'C205': 'Introduction to Decimal Quantity with Trays',
  'C306': 'Introduction to Decimal Symbol',
  'C206': 'Introduction to Decimal Symbols with Trays',
  'C212': 'The Cabinet (without Set of Beads)',
  'C211': 'Set of Beads (without the Cabinet)',
  'C365': 'Golden Bead Material, Individual/Plastic Cards',
  'C157': '45 Golden Bead Bars of 10',
  'C158': '45 Golden Bead Units',
  'C095': '45 Wooden Hundred Squares',
  'C094': '9 Wooden Thousand Cubes',
  'C052': 'Large Wooden Number Cards With Box (1-9000)',
  'C055': 'Small Wooden Number Cards With Box (1-9000)',
  'C058': 'Large PVC Number Cards With Box (1-9000)',
  // Math - Operations
  'C204': 'Addition Snake Game',
  'C103': 'Addition Strip Board',
  'C112': 'Addition Equations And Sums Box',
  'C203': 'Subtraction Snake Game',
  'C104': 'Subtraction Strip Board',
  'C111': 'Subtraction Equations and Differences Box',
  'C113': 'Multiplication Bead Board',
  'C102': 'Box of Multiplication Equations & Products',
  'C360': 'Multiplication Snake Game',
  'C101': 'Divisions Equations and Dividends Box',
  'C114': 'Division Bead Board',
  'C202': 'Elementary Negative Snake Game',
  // Math - Advanced
  'C060': 'Stamp Game',
  'C061': 'Stamp Game Paper (15 Problems)',
  'C046': 'Arithmetic Signs Box',
  'C313': 'Checker Board',
  'C315': 'Number Tiles',
  'C314': 'Checker Board Beads',
  'C420': 'Flat Bead Frame',
  'C120': 'Small Bead Frame',
  'C121': 'Large Bead Frame',
  'C121-1': 'Paper for Large Bead Frame (50 Sheets)',
  'C065': 'Bank Game',
  'C218-1': 'Table of Pythagoras',
  'C090': 'Pythagoras Board',
  'C091': 'Control Chart for Pythagoras Board',
  'C220': 'Power of 2 Cube',
  'C240': 'Algebraic Binomial Cube',
  'C241': 'Arithmetic Trinomial Cube',
  'C117': 'Small Square Root Board',
  // Math - Fractions & Decimals
  'C217': 'Cut-Out Labeled Fraction Circles',
  'C092': 'Metal Fraction Circles with Stands',
  'C051': 'Large Fraction Skittles With Stand',
  'C064': 'Decimal Fraction Exercise',
  'C066': 'Decimal Fraction Board',
  'C067': 'Dot Exercise',
  // Math - Place Value & Counting
  'C070': 'Seguin Boards',
  'C182': 'Bead Bars for Ten Board with Box',
  'C183': 'Bead Bars for Teen Board with Box',
  'C080': 'Hundred Board',
  // Math - Measurement
  'C320': 'Clock with Movable Hands',
  'C228': 'Stand for Height',
  'C224': 'Volume Box with 1000 Cubes',
  'C227': 'Yellow Triangles for Area',
  // Geometry
  'A100': 'Geometric Cabinet (Blue)',
  'A101': 'Geometric Demonstration Tray',
  'A104': 'Cards For Geometric Demonstration Tray',
  'A107': 'Geometric Form Card Cabinet',
  'A051': 'Geometric Solids Bases with Box',
  'A052': 'Geometric Solids Control Chart',
  'A091': 'Box of Wooden Prisms',
  'A093': 'Constructive Triangles With 5 Boxes',
  'A150': 'Box of Blue Triangles',
  'A160': 'Binomial Cube',
  'A161': 'Trinomial Cube',
  'A097': 'Roman Bridge',
  'C219': 'Circles, Squares, and Triangles',
  'C316': 'Geometric Stick Material',
  // Botany
  'B005': 'Botany Leaf Cabinet with Insets',
  // Geography - Puzzle Maps
  'G002': 'Stand for Puzzle Maps',
  'G005': 'Globe - World Parts',
  'G010': 'Puzzle Map of World Parts',
  'G020': 'Puzzle Map of Europe',
  'G030': 'Puzzle Map of North America',
  'G040': 'Puzzle Map of South America',
  'G050': 'Puzzle of Asia',
  'G060': 'Puzzle of Africa',
  'G070': 'Puzzle Map of Australia',
  'G080': 'Puzzle of USA',
  // Geography - Control Maps & Labels
  'G011': 'World Parts Control Map (Labeled)',
  'G012': 'World Parts Control Map (Unlabeled)',
  'G013': 'World Labels',
  'G021': 'Europe Control Map (Labeled)',
  'G022': 'Europe Control Map (Unlabeled)',
  'G023': 'Europe Labels',
  'G031': 'North America Control Map (Labeled)',
  'G032': 'North America Control Map (Unlabeled)',
  'G033': 'North America Labels',
  'G041': 'South America Control Map (Labeled)',
  'G042': 'South America Control Map (Unlabeled)',
  'G043': 'South America Labels',
  'G051': 'Asia Control Map (Labeled)',
  'G052': 'Asia Control Map (Unlabeled)',
  'G053': 'Asia Labels',
  'G061': 'Africa Control Map (Labeled)',
  'G062': 'Africa Control Map (Unlabeled)',
  'G063': 'Africa Labels',
  'G071': 'Australia Control Map (Labeled)',
  'G072': 'Australia Control Map (Unlabeled)',
  'G073': 'Australia Labels',
};

function imageUrl(code) {
  return `https://adenamontessori.com/opt/img/${code}.jpg`;
}

// Normalize string for fuzzy matching
function norm(s) {
  return s.toLowerCase()
    .replace(/[—–\-]/g, ' ')
    .replace(/[()&,.:;'"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build a reverse lookup: normalized Adena name → code
const adenaByName = {};
for (const [code, name] of Object.entries(ADENA_ITEMS)) {
  adenaByName[norm(name)] = code;
}

// Also build keyword-based matchers for common items
const KEYWORD_MATCHES = {
  'stamp game': 'C060',
  'addition snake': 'C204',
  'subtraction snake': 'C203',
  'multiplication snake': 'C360',
  'negative snake': 'C202',
  'addition strip board': 'C103',
  'subtraction strip board': 'C104',
  'multiplication bead board': 'C113',
  'division bead board': 'C114',
  'checker board beads': 'C314',
  'checkerboard': 'C313',
  'checker board': 'C313',
  'golden bead': 'C365',
  'number rods': 'C010',
  'hundred board': 'C080',
  'seguin board': 'C070',
  'teen board': 'C183',
  'ten board': 'C182',
  'small bead frame': 'C120',
  'large bead frame': 'C121',
  'flat bead frame': 'C420',
  'bank game': 'C065',
  'binomial cube': 'A160',
  'trinomial cube': 'A161',
  'geometric cabinet': 'A100',
  'geometric solids': 'A051',
  'constructive triangle': 'A093',
  'blue triangle': 'A150',
  'roman bridge': 'A097',
  'metal insets': 'L041',
  'metal inset': 'L041',
  'movable alphabet': 'L032',
  'sandpaper letter': 'L010',
  'grammar symbol': 'L060',
  'grammar box': 'L180-1',
  'sentence analysis': 'L100',
  'reading analysis': 'L090',
  'detective adjective': 'A095',
  'fraction circle': 'C092',
  'fraction skittle': 'C051',
  'decimal fraction board': 'C066',
  'decimal fraction exercise': 'C064',
  'dot exercise': 'C067',
  'pythagor': 'C090',
  'table of pythagoras': 'C218-1',
  'power of 2': 'C220',
  'square root board': 'C117',
  'clock with movable': 'C320',
  'volume box': 'C224',
  'yellow triangle': 'C227',
  'wooden prism': 'A091',
  'geometric stick': 'C316',
  'botany leaf': 'B005',
  'leaf cabinet': 'B005',
  'globe world': 'G005',
  'puzzle map of world': 'G010',
  'puzzle map world': 'G010',
  'puzzle map of europe': 'G020',
  'puzzle map europe': 'G020',
  'puzzle map of north america': 'G030',
  'puzzle map north america': 'G030',
  'puzzle map of south america': 'G040',
  'puzzle map south america': 'G040',
  'puzzle map of asia': 'G050',
  'puzzle map asia': 'G050',
  'puzzle of asia': 'G050',
  'puzzle map of africa': 'G060',
  'puzzle map africa': 'G060',
  'puzzle of africa': 'G060',
  'puzzle map of australia': 'G070',
  'puzzle map australia': 'G070',
  'puzzle map of usa': 'G080',
  'puzzle map usa': 'G080',
  'puzzle of usa': 'G080',
  'stand for puzzle': 'G002',
  'control map': 'G011',
  'arithmetic signs': 'C046',
  'number tiles': 'C315',
  'thousand cube': 'C094',
  'hundred square': 'C095',
  'greenboard': 'C109',
  'dressing frame': 'A095',
  'card and counter': 'C044',
  'cards and counters': 'C044',
  'introduction to decimal symbol': 'C306',
  'bead cabinet': 'C212',
  'set of beads': 'C211',
  'large wooden number cards': 'C052',
  'small wooden number cards': 'C055',
  'checker board bead': 'C314',
  'geometric demonstration': 'A101',
  'geometric form card': 'A107',
  'circles squares and triangles': 'C219',
  'land and water form': 'G005',
};

function findAdenaCode(material) {
  const n = norm(material.name);

  // Direct code match (e.g., A095 already in materials.json)
  if (ADENA_ITEMS[material.code]) return material.code;

  // Strip ADENA- prefix
  if (material.code.startsWith('ADENA-')) {
    const stripped = material.code.replace('ADENA-', '');
    if (ADENA_ITEMS[stripped]) return stripped;
  }

  // Exact normalized name match
  if (adenaByName[n]) return adenaByName[n];

  // Keyword matching
  for (const [keyword, code] of Object.entries(KEYWORD_MATCHES)) {
    if (n.includes(keyword)) return code;
  }

  return null;
}

async function query(table, method = 'GET', body = null, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params}`;
  const opts = {
    method,
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${table}: ${res.status} ${text}`);
  }
  if (method === 'GET') return res.json();
  return null;
}

async function main() {
  const materialsPath = path.join(__dirname, 'data', 'materials.json');
  const materials = JSON.parse(fs.readFileSync(materialsPath, 'utf-8'));

  console.log(`\nLoaded ${materials.length} materials from materials.json`);
  console.log(`Adena kit has ${Object.keys(ADENA_ITEMS).length} items\n`);

  // Match materials to Adena codes
  let matched = 0;
  let unmatched = 0;
  const matchedCodes = new Set();

  const records = materials.map(m => {
    const adenaCode = findAdenaCode(m);
    const record = {
      code: m.code,
      name: m.name,
      description: m.description || null,
      subject_area: m.subject_area || null,
      sub_category: m.sub_category || null,
      applicable_levels: m.applicable_levels || [],
      age_range: m.age_range || null,
      image_url: null,
      what_it_teaches: m.what_it_teaches || null,
      prerequisites: m.prerequisites || [],
      next_in_sequence: m.next_in_sequence || [],
      cross_subject_connections: m.cross_subject_connections || [],
      supplier_links: adenaCode ? { adena_code: adenaCode, url: `https://adenamontessori.com/pages/productDetail?productId=search&keyword=${adenaCode}` } : (m.supplier_links || null),
      diy_alternative: m.diy_alternative || null,
    };

    if (adenaCode) {
      record.image_url = imageUrl(adenaCode);
      matched++;
      matchedCodes.add(adenaCode);
    } else {
      unmatched++;
    }

    return record;
  });

  console.log(`Matched ${matched} materials to Adena images`);
  console.log(`Unmatched: ${unmatched} materials (no Adena image)`);

  // Show unmatched Adena codes (items in kit but not in our inventory)
  const unmatchedAdena = Object.entries(ADENA_ITEMS)
    .filter(([code]) => !matchedCodes.has(code));
  if (unmatchedAdena.length > 0) {
    console.log(`\n${unmatchedAdena.length} Adena items not matched to any material:`);
    unmatchedAdena.forEach(([code, name]) => console.log(`  ${code}: ${name}`));
  }

  // Show matched items
  console.log(`\nMatched items with images:`);
  records.filter(r => r.image_url).forEach(r => {
    console.log(`  ${r.code}: ${r.name} → ${r.image_url.split('/').pop()}`);
  });

  // Seed to Supabase
  console.log(`\n--- Seeding ${records.length} materials to Supabase ---`);

  // First delete existing (clean slate)
  await query('materials_inventory', 'DELETE', null, '?id=not.is.null');
  console.log('Cleared existing materials');

  // Insert in batches of 25
  const batchSize = 25;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await query('materials_inventory', 'POST', batch);
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} materials inserted`);
  }

  console.log(`\nDone! ${records.length} materials seeded (${matched} with Adena images)`);

  // Also update materials.json with image_url for future reference
  const updatedMaterials = materials.map(m => {
    const adenaCode = findAdenaCode(m);
    if (adenaCode) {
      return { ...m, image_url: imageUrl(adenaCode), adena_code: adenaCode };
    }
    return m;
  });

  fs.writeFileSync(materialsPath, JSON.stringify(updatedMaterials, null, 2));
  console.log(`Updated materials.json with image_url fields`);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
