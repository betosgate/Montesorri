// Cross-reference Adena Montessori Elementary Kit codes with our materials inventory
// Adds adena_code field to matching materials and creates missing items

const fs = require('fs')
const path = require('path')

const materialsPath = path.join(__dirname, 'data', 'materials.json')
const materials = JSON.parse(fs.readFileSync(materialsPath, 'utf8'))

// Adena kit items mapped to our materials by name matching
const adenaMap = {
  // Language Arts
  'A095': { match: 'adjective', subject: 'language', name: 'Detective Adjective Exercise' },
  'L060': { match: 'grammar symbols', subject: 'language', name: 'Solid Grammar Symbols' },
  'L081': { match: 'grammar symbols cards', subject: 'language', name: 'Grammar Symbols Cards with Box' },
  'L090': { match: 'reading analysis', subject: 'language', name: 'Reading Analysis 1st Chart & Box' },
  'L100': { match: 'sentence analysis', subject: 'language', name: 'Sentence Analysis 1st & 2nd Set' },
  'L180-1': { match: 'grammar box', subject: 'language', name: 'Grammar Boxes Set' },
  'C109': { match: 'greenboard', subject: 'language', name: 'Greenboards with Lines' },
  'L010': { match: 'sandpaper letters', subject: 'language', name: 'Lower Case Sandpaper Letters - Print' },
  'L032': { match: 'movable alphabet', subject: 'language', name: 'Lowercase Small Movable Alphabet - Pink' },
  'L033': { match: 'movable alphabet', subject: 'language', name: 'Lowercase Small Movable Alphabet - Blue' },
  'L034': { match: 'movable alphabet', subject: 'language', name: 'Lowercase Small Movable Alphabet - Black' },
  'L030': { match: 'movable alphabet', subject: 'language', name: 'Box for Lowercase Small Movable Alphabet' },
  'L041': { match: 'metal insets', subject: 'language', name: 'Metal Insets with 2 Stands' },

  // Math - Number & Operations
  'C010': { match: 'number rods', subject: 'math', name: 'Number Rods' },
  'C044': { match: 'cards and counters', subject: 'math', name: 'Cards and Counters' },
  'C205': { match: 'decimal quantity', subject: 'math', name: 'Introduction to Decimal Quantity with Trays' },
  'C306': { match: 'decimal symbol', subject: 'math', name: 'Introduction to Decimal Symbol' },
  'C206': { match: 'decimal symbols', subject: 'math', name: 'Introduction to Decimal Symbols with Trays' },
  'C212': { match: 'bead cabinet', subject: 'math', name: 'The Bead Cabinet' },
  'C211': { match: 'bead set', subject: 'math', name: 'Set of Beads' },
  'C365': { match: 'golden bead', subject: 'math', name: 'Golden Bead Material with Plastic Cards' },
  'C157': { match: 'golden bead bars', subject: 'math', name: '45 Golden Bead Bars of 10' },
  'C158': { match: 'golden bead units', subject: 'math', name: '45 Golden Bead Units' },
  'C095': { match: 'hundred squares', subject: 'math', name: '45 Wooden Hundred Squares' },
  'C094': { match: 'thousand cubes', subject: 'math', name: '9 Wooden Thousand Cubes' },
  'C052': { match: 'number cards', subject: 'math', name: 'Large Wooden Number Cards With Box (1-9000)' },
  'C055': { match: 'number cards', subject: 'math', name: 'Small Wooden Number Cards With Box (1-9000)' },
  'C058': { match: 'number cards', subject: 'math', name: 'Large PVC Number Cards With Box (1-9000)' },

  // Math - Operations
  'C204': { match: 'snake game', subject: 'math', name: 'Addition Snake Game' },
  'C103': { match: 'addition strip', subject: 'math', name: 'Addition Strip Board' },
  'C112': { match: 'addition equations', subject: 'math', name: 'Addition Equations and Sums Box' },
  'C203': { match: 'subtraction snake', subject: 'math', name: 'Subtraction Snake Game' },
  'C104': { match: 'subtraction strip', subject: 'math', name: 'Subtraction Strip Board' },
  'C111': { match: 'subtraction equations', subject: 'math', name: 'Subtraction Equations and Differences Box' },
  'C113': { match: 'multiplication bead board', subject: 'math', name: 'Multiplication Bead Board' },
  'C102': { match: 'multiplication equations', subject: 'math', name: 'Multiplication Equations & Products Box' },
  'C360': { match: 'multiplication snake', subject: 'math', name: 'Multiplication Snake Game' },
  'C101': { match: 'division equations', subject: 'math', name: 'Division Equations and Dividends Box' },
  'C114': { match: 'division bead board', subject: 'math', name: 'Division Bead Board' },
  'C202': { match: 'negative snake', subject: 'math', name: 'Elementary Negative Snake Game' },

  // Math - Advanced
  'C060': { match: 'stamp game', subject: 'math', name: 'Stamp Game' },
  'C061': { match: 'stamp game paper', subject: 'math', name: 'Stamp Game Paper' },
  'C046': { match: 'arithmetic signs', subject: 'math', name: 'Arithmetic Signs Box' },
  'C313': { match: 'checker board', subject: 'math', name: 'Checker Board' },
  'C315': { match: 'number tiles', subject: 'math', name: 'Number Tiles for Checker Board' },
  'C314': { match: 'checker board beads', subject: 'math', name: 'Checker Board Beads' },
  'C420': { match: 'flat bead frame', subject: 'math', name: 'Flat Bead Frame' },
  'C120': { match: 'small bead frame', subject: 'math', name: 'Small Bead Frame' },
  'C121': { match: 'large bead frame', subject: 'math', name: 'Large Bead Frame' },
  'C065': { match: 'bank game', subject: 'math', name: 'Bank Game' },
  'C218-1': { match: 'pythagoras', subject: 'math', name: 'Table of Pythagoras' },
  'C090': { match: 'pythagoras board', subject: 'math', name: 'Pythagoras Board' },
  'C091': { match: 'pythagoras control', subject: 'math', name: 'Control Chart for Pythagoras Board' },
  'C220': { match: 'power of 2', subject: 'math', name: 'Power of 2 Cube' },
  'C240': { match: 'binomial cube', subject: 'math', name: 'Algebraic Binomial Cube' },
  'C241': { match: 'trinomial cube', subject: 'math', name: 'Arithmetic Trinomial Cube' },
  'C117': { match: 'square root', subject: 'math', name: 'Small Square Root Board' },

  // Math - Fractions & Decimals
  'C217': { match: 'fraction circles', subject: 'math', name: 'Cut-Out Labeled Fraction Circles' },
  'C092': { match: 'metal fraction', subject: 'math', name: 'Metal Fraction Circles with Stands' },
  'C051': { match: 'fraction skittles', subject: 'math', name: 'Large Fraction Skittles With Stand' },
  'C064': { match: 'decimal fraction exercise', subject: 'math', name: 'Decimal Fraction Exercise' },
  'C066': { match: 'decimal fraction board', subject: 'math', name: 'Decimal Fraction Board' },
  'C067': { match: 'dot exercise', subject: 'math', name: 'Dot Exercise' },

  // Math - Place Value
  'C070': { match: 'seguin boards', subject: 'math', name: 'Seguin Boards (Teen/Ten)' },
  'C182': { match: 'bead bars ten', subject: 'math', name: 'Bead Bars for Ten Board with Box' },
  'C183': { match: 'bead bars teen', subject: 'math', name: 'Bead Bars for Teen Board with Box' },
  'C080': { match: 'hundred board', subject: 'math', name: 'Hundred Board' },

  // Math - Measurement
  'C320': { match: 'clock', subject: 'math', name: 'Clock with Movable Hands' },
  'C228': { match: 'height', subject: 'math', name: 'Stand for Height Measurement' },
  'C224': { match: 'volume box', subject: 'math', name: 'Volume Box with 1000 Cubes' },
  'C227': { match: 'yellow triangles', subject: 'math', name: 'Yellow Triangles for Area' },

  // Geometry
  'A100': { match: 'geometric cabinet', subject: 'geometry', name: 'Geometric Cabinet (Blue)' },
  'A101': { match: 'geometric demonstration', subject: 'geometry', name: 'Geometric Demonstration Tray' },
  'A104': { match: 'geometric form cards', subject: 'geometry', name: 'Cards For Geometric Demonstration Tray' },
  'A107': { match: 'geometric form card cabinet', subject: 'geometry', name: 'Geometric Form Card Cabinet' },
  'A051': { match: 'geometric solids bases', subject: 'geometry', name: 'Geometric Solids Bases with Box' },
  'A052': { match: 'geometric solids control', subject: 'geometry', name: 'Geometric Solids Control Chart' },
  'A091': { match: 'wooden prisms', subject: 'geometry', name: 'Box of Wooden Prisms' },
  'A093': { match: 'constructive triangles', subject: 'geometry', name: 'Constructive Triangles With 5 Boxes' },
  'A150': { match: 'blue triangles', subject: 'geometry', name: 'Box of Blue Triangles' },
  'A160': { match: 'binomial cube', subject: 'geometry', name: 'Binomial Cube' },
  'A161': { match: 'trinomial cube', subject: 'geometry', name: 'Trinomial Cube' },
  'A097': { match: 'roman bridge', subject: 'geometry', name: 'Roman Bridge' },
  'C219': { match: 'circles squares triangles', subject: 'geometry', name: 'Circles, Squares, and Triangles' },
  'C316': { match: 'geometric stick', subject: 'geometry', name: 'Geometric Stick Material' },

  // Botany
  'B005': { match: 'botany leaf', subject: 'science', name: 'Botany Leaf Cabinet with Insets' },

  // Geography - Puzzle Maps
  'G002': { match: 'puzzle map stand', subject: 'geography', name: 'Stand for Puzzle Maps' },
  'G005': { match: 'globe world parts', subject: 'geography', name: 'Globe - World Parts' },
  'G010': { match: 'puzzle map world', subject: 'geography', name: 'Puzzle Map of World Parts' },
  'G020': { match: 'puzzle map europe', subject: 'geography', name: 'Puzzle Map of Europe' },
  'G030': { match: 'puzzle map north america', subject: 'geography', name: 'Puzzle Map of North America' },
  'G040': { match: 'puzzle map south america', subject: 'geography', name: 'Puzzle Map of South America' },
  'G050': { match: 'puzzle map asia', subject: 'geography', name: 'Puzzle Map of Asia' },
  'G060': { match: 'puzzle map africa', subject: 'geography', name: 'Puzzle Map of Africa' },
  'G070': { match: 'puzzle map australia', subject: 'geography', name: 'Puzzle Map of Australia' },
  'G080': { match: 'puzzle map usa', subject: 'geography', name: 'Puzzle Map of USA' },
}

// Try to match Adena items to existing materials
const matchedCodes = new Set()
const unmatchedAdena = []

for (const [adenaCode, info] of Object.entries(adenaMap)) {
  const searchTerms = info.match.toLowerCase().split(' ')
  let found = false

  for (const mat of materials) {
    const matName = mat.name.toLowerCase()
    const matDesc = (mat.description || '').toLowerCase()
    const combined = matName + ' ' + matDesc

    // Check if all search terms appear in name or description
    if (searchTerms.every(term => combined.includes(term))) {
      // Add adena_code to existing material
      if (!mat.adena_codes) mat.adena_codes = []
      mat.adena_codes.push(adenaCode)
      matchedCodes.add(adenaCode)
      found = true
      break
    }
  }

  if (!found) {
    unmatchedAdena.push({ adenaCode, ...info })
  }
}

// Add unmatched Adena items as new materials
let addedCount = 0
for (const item of unmatchedAdena) {
  const code = `ADENA-${item.adenaCode}`
  // Check if code already exists
  if (materials.some(m => m.code === code)) continue

  materials.push({
    code,
    name: item.name,
    subject_area: item.subject,
    age_range: '6-12',
    description: `Adena Montessori Elementary Kit item (code: ${item.adenaCode}). Part of the standard elementary materials package.`,
    image_url: null,
    adena_codes: [item.adenaCode]
  })
  addedCount++
}

// Write updated materials
fs.writeFileSync(materialsPath, JSON.stringify(materials, null, 2))

console.log(`Matched ${matchedCodes.size} Adena items to existing materials`)
console.log(`Added ${addedCount} new items from unmatched Adena codes`)
console.log(`Total materials: ${materials.length}`)
console.log(`\nUnmatched Adena items added:`)
unmatchedAdena.forEach(u => console.log(`  ${u.adenaCode}: ${u.name} (${u.subject})`))
