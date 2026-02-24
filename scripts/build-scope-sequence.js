// Build comprehensive Montessori scope & sequence JSON
// Generates 500+ items across 3 levels and 11 subjects

const items = []
let globalOrder = 0

function add(level, subject, area, skills) {
  for (const skill of skills) {
    globalOrder++
    items.push({
      level_name: level,
      subject_name: subject,
      area: area,
      skill: typeof skill === 'string' ? skill : skill.name,
      sequence_order: globalOrder,
      typical_age: level === 'primary' ? '3-6' : level === 'lower_elementary' ? '6-9' : '9-12',
      prerequisites: typeof skill === 'object' && skill.prereqs ? skill.prereqs : [],
      materials_needed: typeof skill === 'object' && skill.materials ? skill.materials : []
    })
  }
}

// ═══════════════════════════════════════════════════════
// PRIMARY (K, ages 3-6) — ~160 items
// ═══════════════════════════════════════════════════════

// Practical Life — 25 items
add('primary', 'practical_life', 'Preliminary Exercises', [
  'Carry a chair', 'Roll and unroll a mat', 'Open and close a door',
  'Walk on the line', 'Silence game'
])
add('primary', 'practical_life', 'Care of Self', [
  'Hand washing', 'Dressing frames (buttons)', 'Dressing frames (zippers)',
  'Dressing frames (buckles)', 'Shoe polishing', 'Hair brushing'
])
add('primary', 'practical_life', 'Care of Environment', [
  'Dusting', 'Sweeping', 'Mopping', 'Polishing (wood/metal)',
  'Plant watering', 'Flower arranging', 'Table washing'
])
add('primary', 'practical_life', 'Food Preparation', [
  'Pouring (dry)', 'Pouring (wet)', 'Spooning', 'Cutting (banana)',
  'Spreading', 'Squeezing (citrus)', 'Peeling'
])

// Sensorial — 24 items
add('primary', 'sensorial', 'Visual Discrimination', [
  { name: 'Pink tower', materials: ['MAT-SENS-PINK'] },
  { name: 'Brown stair', materials: ['MAT-SENS-BRWN'] },
  { name: 'Red rods', materials: ['MAT-SENS-RODS'] },
  { name: 'Cylinder blocks', materials: ['MAT-SENS-CYL'] },
  { name: 'Knobless cylinders', materials: ['MAT-SENS-KNOB'] },
  'Color tablets box 1', 'Color tablets box 2', 'Color tablets box 3'
])
add('primary', 'sensorial', 'Tactile Discrimination', [
  'Touch boards', 'Fabric matching', 'Thermic tablets',
  'Baric tablets', 'Mystery bag'
])
add('primary', 'sensorial', 'Auditory Discrimination', [
  'Sound cylinders', 'Bells (matching)', 'Bells (grading)'
])
add('primary', 'sensorial', 'Constructive', [
  { name: 'Constructive triangles', materials: ['MAT-SENS-TRI'] },
  { name: 'Binomial cube', materials: ['MAT-SENS-BINOM'] },
  { name: 'Trinomial cube', materials: ['MAT-SENS-TRINOM'] },
  'Geometric solids', 'Geometric cabinet', 'Superimposed geometric figures'
])
add('primary', 'sensorial', 'Olfactory & Gustatory', [
  'Smelling bottles', 'Tasting exercise'
])

// Language — 30 items
add('primary', 'language', 'Pre-Reading', [
  'Sound games (I Spy)', 'Sandpaper letters group 1 (c,m,a,t)',
  'Sandpaper letters group 2 (s,r,i,p)', 'Sandpaper letters group 3 (b,f,o,g)',
  'Sandpaper letters group 4 (h,j,u,l)', 'Sandpaper letters group 5 (d,w,e,n)',
  'Sandpaper letters group 6 (k,q,v,x,y,z)'
])
add('primary', 'language', 'Writing Preparation', [
  { name: 'Metal insets', materials: ['MAT-LANG-METAL'] },
  'Chalkboard writing', 'Paper writing (lines)'
])
add('primary', 'language', 'Reading', [
  { name: 'Moveable alphabet - CVC words', materials: ['MAT-LANG-MOVE'] },
  'Phonetic object box', 'Pink series (CVC reading)',
  'Blue series (blends)', 'Green series (phonograms)',
  'Puzzle words (sight words)', 'Phonogram booklets'
])
add('primary', 'language', 'Grammar Introduction', [
  'Noun (naming word)', 'Article (a, the)', 'Adjective (describing word)',
  'Verb (action word)', 'Conjunction (and)', 'Preposition (on, in, under)'
])
add('primary', 'language', 'Oral Language', [
  'Classified cards (vocabulary)', 'Storytelling', 'Conversation skills',
  'Poems and rhymes', 'Show and tell'
])

// Math — 30 items
add('primary', 'math', 'Number Concepts 1-10', [
  { name: 'Number rods', materials: ['MAT-MATH-NRODS'] },
  { name: 'Sandpaper numbers', materials: ['MAT-MATH-SANDNUM'] },
  { name: 'Spindle box', materials: ['MAT-MATH-SPIND'] },
  'Cards and counters', 'Memory game of numbers',
  'Number rods and cards combined'
])
add('primary', 'math', 'Decimal System', [
  { name: 'Golden bead introduction (units)', materials: ['MAT-MATH-GOLD'] },
  'Golden beads - tens', 'Golden beads - hundreds',
  'Golden beads - thousands', 'Formation of numbers (cards)',
  'Golden bead addition', 'Golden bead subtraction',
  'Golden bead multiplication', 'Golden bead division'
])
add('primary', 'math', 'Linear Counting', [
  { name: 'Teen boards', materials: ['MAT-MATH-TEEN'] },
  { name: 'Ten boards', materials: ['MAT-MATH-TENB'] },
  'Hundred board', 'Bead chains (skip counting)',
  'Short bead chains (squares)', 'Long bead chains (cubes)'
])
add('primary', 'math', 'Operations Practice', [
  { name: 'Addition strip board', materials: ['MAT-MATH-ADDST'] },
  { name: 'Subtraction strip board', materials: ['MAT-MATH-SUBST'] },
  'Addition with stamp game', 'Subtraction with stamp game',
  'Multiplication with bead bars', 'Division with stamp game'
])

// Geometry — 8 items
add('primary', 'geometry', 'Shapes', [
  'Geometric cabinet - circles', 'Geometric cabinet - rectangles',
  'Geometric cabinet - triangles', 'Geometric cabinet - polygons',
  'Geometric solids naming', 'Constructive triangles',
  'Superimposed figures', 'Geometric shapes in environment'
])

// Geography — 10 items
add('primary', 'geography', 'Physical Geography', [
  'Globe - land and water', 'Globe - continents (color)',
  'Puzzle map - world', 'Puzzle map - own continent',
  'Land and water forms (island/lake)', 'Land and water forms (peninsula/gulf)',
  'Land and water forms (isthmus/strait)', 'Continent folders',
  'Flags of the world', 'Where in the world (cultural foods)'
])

// Science — 10 items
add('primary', 'science', 'Life Science', [
  'Living and non-living', 'Parts of a plant', 'Plant life cycle',
  'Parts of a flower', 'Animal classification (vertebrate/invertebrate)',
  'Seasons and changes'
])
add('primary', 'science', 'Physical Science', [
  'Sink and float', 'Magnetic and non-magnetic',
  'States of matter', 'Color mixing'
])

// History — 5 items
add('primary', 'history', 'Time Concepts', [
  'Calendar work (days, months)', 'Yesterday/today/tomorrow',
  'Seasons and holidays', 'Personal timeline', 'Birthday celebration (Montessori walk)'
])

// Culture — 5 items
add('primary', 'culture', 'Grace and Courtesy', [
  'Greetings', 'Please and thank you', 'Taking turns',
  'Interrupting politely', 'Care of belongings'
])

// Art & Music — 8 items
add('primary', 'art_music', 'Visual Art', [
  'Painting with watercolors', 'Drawing with colored pencils',
  'Clay modeling', 'Collage and cutting', 'Printmaking'
])
add('primary', 'art_music', 'Music', [
  'Rhythm instruments', 'Songs and movement', 'Listening activities'
])

// Read Aloud — 5 items
add('primary', 'read_aloud', 'Literature', [
  'Daily read-aloud (fiction)', 'Daily read-aloud (non-fiction)',
  'Poetry recitation', 'Nursery rhymes', 'Storytelling retell'
])

// ═══════════════════════════════════════════════════════
// LOWER ELEMENTARY (1-3, ages 6-9) — ~180 items
// ═══════════════════════════════════════════════════════

// Practical Life — 10 items
add('lower_elementary', 'practical_life', 'Community Responsibility', [
  'Classroom jobs rotation', 'Meal preparation (snack for group)',
  'Sewing (running stitch)', 'Woodworking basics', 'Gardening',
  'Care of pets/classroom animals', 'Emergency procedures',
  'First aid basics', 'Conflict resolution', 'Group decision making'
])

// Language — 35 items
add('lower_elementary', 'language', 'Reading Fluency', [
  'Silent reading practice', 'Oral reading fluency',
  'Reading comprehension strategies', 'Main idea and details',
  'Sequencing events', 'Character analysis',
  'Fiction vs non-fiction', 'Genre study'
])
add('lower_elementary', 'language', 'Writing', [
  'Sentence construction', 'Paragraph writing',
  'Narrative writing', 'Descriptive writing',
  'Expository writing', 'Letter writing',
  'Creative writing', 'Research reports (basic)',
  'Editing and revising', 'Handwriting (cursive introduction)'
])
add('lower_elementary', 'language', 'Grammar', [
  { name: 'Noun study (grammar box 1)', materials: ['MAT-LANG-GRAM1'] },
  { name: 'Article study (grammar box 2)', materials: ['MAT-LANG-GRAM2'] },
  { name: 'Adjective study (grammar box 3)', materials: ['MAT-LANG-GRAM3'] },
  { name: 'Verb study (grammar box 4)', materials: ['MAT-LANG-GRAM4'] },
  { name: 'Preposition study (grammar box 5)', materials: ['MAT-LANG-GRAM5'] },
  { name: 'Adverb study (grammar box 6)', materials: ['MAT-LANG-GRAM6'] },
  { name: 'Pronoun study (grammar box 7)', materials: ['MAT-LANG-GRAM7'] },
  { name: 'Conjunction study (grammar box 8)', materials: ['MAT-LANG-GRAM8'] },
  'Interjection study', 'Sentence analysis (subject/predicate)',
  'Compound sentences', 'Punctuation rules', 'Capitalization rules'
])
add('lower_elementary', 'language', 'Spelling & Word Study', [
  'Phonogram charts', 'Word families', 'Spelling patterns',
  'Dictionary skills'
])

// Math — 40 items
add('lower_elementary', 'math', 'Operations', [
  { name: 'Stamp game addition (4-digit)', materials: ['MAT-MATH-STAMP'] },
  'Stamp game subtraction (4-digit)',
  'Stamp game multiplication', 'Stamp game division',
  { name: 'Bead frame addition', materials: ['MAT-MATH-BDFR'] },
  'Bead frame subtraction',
  { name: 'Checkerboard multiplication', materials: ['MAT-MATH-CHECK'] },
  { name: 'Racks and tubes division', materials: ['MAT-MATH-RACKS'] },
  'Long multiplication algorithm', 'Long division algorithm'
])
add('lower_elementary', 'math', 'Memorization', [
  'Addition tables (finger charts)', 'Subtraction tables',
  'Multiplication tables (bead bars)', 'Division tables',
  'Addition facts mastery', 'Subtraction facts mastery',
  'Multiplication facts mastery', 'Division facts mastery'
])
add('lower_elementary', 'math', 'Fractions', [
  { name: 'Fraction skittles', materials: ['MAT-MATH-FRAC'] },
  'Fraction circles (naming)', 'Equivalent fractions',
  'Addition of fractions (same denominator)',
  'Subtraction of fractions (same denominator)',
  'Mixed numbers', 'Improper fractions'
])
add('lower_elementary', 'math', 'Measurement & Data', [
  'Telling time (analog clock)', 'Elapsed time',
  'Money (coins and bills)', 'Making change',
  'Linear measurement (cm, m)', 'Weight measurement',
  'Capacity measurement', 'Bar graphs', 'Pictographs',
  'Word problems (multi-step)'
])
add('lower_elementary', 'math', 'Place Value', [
  { name: 'Place value with golden beads', materials: ['MAT-MATH-GOLD'] },
  'Place value to thousands', 'Place value to millions',
  'Rounding numbers', 'Comparing and ordering numbers'
])

// Geometry — 15 items
add('lower_elementary', 'geometry', 'Lines and Angles', [
  'Types of lines (horizontal, vertical, diagonal)',
  'Parallel and perpendicular lines', 'Types of angles (acute, right, obtuse)',
  'Measuring angles (protractor)', 'Angle sum of triangle'
])
add('lower_elementary', 'geometry', 'Shapes and Area', [
  'Triangle classification (by sides)', 'Triangle classification (by angles)',
  'Quadrilateral types', 'Perimeter calculation',
  'Area of rectangle', 'Area of triangle',
  'Congruence and similarity', 'Symmetry (line)',
  'Geometric constructions (compass)'
])

// Geography — 15 items
add('lower_elementary', 'geography', 'World Geography', [
  { name: 'Puzzle map - continents review', materials: ['MAT-GEO-WORLD'] },
  { name: 'Puzzle map - North America', materials: ['MAT-GEO-NA'] },
  { name: 'Puzzle map - South America', materials: ['MAT-GEO-SA'] },
  { name: 'Puzzle map - Europe', materials: ['MAT-GEO-EUR'] },
  { name: 'Puzzle map - Africa', materials: ['MAT-GEO-AFR'] },
  { name: 'Puzzle map - Asia', materials: ['MAT-GEO-ASIA'] },
  'Continent research projects', 'Country studies'
])
add('lower_elementary', 'geography', 'Physical Geography', [
  'Layers of the Earth', 'Types of rocks', 'Water cycle',
  'Biomes introduction', 'Map skills (compass rose, scale, key)',
  'Latitude and longitude introduction', 'Natural resources'
])

// Science — 20 items
add('lower_elementary', 'science', 'Life Science', [
  { name: 'Parts of a plant (botany puzzles)', materials: ['MAT-SCI-PLANT'] },
  'Plant needs experiment', 'Leaf classification',
  'Parts of a flower (detailed)', 'Seed germination experiment',
  'Animal classification (5 vertebrate classes)',
  'Invertebrate classification', 'Habitats and ecosystems',
  'Food chains and webs', 'Human body systems introduction'
])
add('lower_elementary', 'science', 'Physical Science', [
  'Simple machines (lever, pulley, wheel)',
  'Magnets (poles, fields)', 'Electricity (circuits)',
  'Sound (vibration, pitch)', 'Light (reflection, refraction)'
])
add('lower_elementary', 'science', 'Earth Science', [
  'Weather tracking and patterns', 'Cloud types',
  'Rocks and minerals', 'Erosion and weathering',
  'Solar system introduction'
])

// History — 15 items
add('lower_elementary', 'history', 'Timeline of Life', [
  'Timeline of Life overview', 'First life forms',
  'Age of fish', 'Age of amphibians', 'Age of reptiles',
  'Age of mammals', 'Coming of humans'
])
add('lower_elementary', 'history', 'Human History', [
  'Fundamental needs of humans', 'Early civilizations',
  'Ancient Egypt', 'Ancient Greece', 'Ancient Rome',
  'Timeline of own country', 'Community history',
  'Historical research project'
])

// Culture — 10 items
add('lower_elementary', 'culture', 'World Cultures', [
  'Celebrations around the world', 'World religions (overview)',
  'Traditional clothing', 'World music', 'World art',
  'Folktales from different cultures', 'Global food traditions',
  'Endangered languages', 'Cultural exchange projects', 'Peace education'
])

// Art & Music — 10 items
add('lower_elementary', 'art_music', 'Visual Art', [
  'Color theory (color wheel)', 'Drawing techniques (perspective)',
  'Painting (wet-on-wet)', 'Sculpture (clay)',
  'Art history (great artists study)'
])
add('lower_elementary', 'art_music', 'Music', [
  'Recorder introduction', 'Music notation basics',
  'Rhythm and beat patterns', 'Choir/singing',
  'Composer study'
])

// Read Aloud — 10 items
add('lower_elementary', 'read_aloud', 'Literature Study', [
  'Chapter books (read-aloud)', 'Poetry anthology',
  'Biography read-alouds', 'Science non-fiction read-alouds',
  'Historical fiction', 'Mythology', 'Fables and legends',
  'Book discussions', 'Author studies', 'Book reports (oral)'
])

// ═══════════════════════════════════════════════════════
// UPPER ELEMENTARY (4-6, ages 9-12) — ~170 items
// ═══════════════════════════════════════════════════════

// Practical Life — 8 items
add('upper_elementary', 'practical_life', 'Life Skills', [
  'Meal planning and cooking', 'Budgeting basics',
  'Sewing (advanced projects)', 'Community service projects',
  'Time management', 'Organization systems',
  'Public speaking', 'Leadership and mentoring younger students'
])

// Language — 30 items
add('upper_elementary', 'language', 'Reading', [
  'Independent reading (novels)', 'Reading comprehension (inference)',
  'Theme and symbolism', 'Point of view analysis',
  'Literary devices (metaphor, simile)', 'Comparative literature',
  'Non-fiction analysis', 'Primary source analysis'
])
add('upper_elementary', 'language', 'Writing', [
  'Five-paragraph essay', 'Persuasive writing',
  'Research paper (multi-source)', 'Poetry writing',
  'Narrative writing (advanced)', 'Journalism/newspaper writing',
  'Editing peer work', 'Bibliography and citations',
  'Creative fiction writing', 'Script/play writing'
])
add('upper_elementary', 'language', 'Grammar & Mechanics', [
  { name: 'Sentence analysis (advanced)', materials: ['MAT-LANG-SENT'] },
  'Complex sentences', 'Clauses (independent/dependent)',
  'Verb tenses (all 12)', 'Active and passive voice',
  'Direct and indirect objects', 'Diagramming sentences',
  'Etymology and word roots', 'Vocabulary from Latin/Greek roots',
  'Spelling rules (advanced)', 'Punctuation (semicolons, colons, dashes)',
  'Homophones and commonly confused words'
])

// Math — 35 items
add('upper_elementary', 'math', 'Operations', [
  'Multi-digit multiplication (algorithm)', 'Long division (2-digit divisor)',
  'Order of operations', 'Exponents introduction',
  'Scientific notation', 'Estimation strategies'
])
add('upper_elementary', 'math', 'Fractions & Decimals', [
  { name: 'Fraction operations (unlike denominators)', materials: ['MAT-MATH-FRAC'] },
  'Multiplying fractions', 'Dividing fractions',
  'Decimal place value', 'Decimal operations (all four)',
  'Converting fractions to decimals', 'Converting decimals to fractions',
  'Percentages', 'Ratio and proportion',
  'Fraction/decimal/percent equivalents'
])
add('upper_elementary', 'math', 'Pre-Algebra', [
  'Variables and expressions', 'Solving one-step equations',
  'Solving two-step equations', 'Inequalities',
  'Coordinate plane (plotting points)', 'Graphing linear equations',
  'Patterns and sequences', 'Negative numbers (integer operations)'
])
add('upper_elementary', 'math', 'Data & Probability', [
  'Mean, median, mode', 'Range and outliers',
  'Line graphs', 'Circle graphs (pie charts)',
  'Probability (basic)', 'Probability (compound events)',
  'Data collection and surveys'
])
add('upper_elementary', 'math', 'Advanced Topics', [
  'Prime and composite numbers', 'Factors and multiples',
  'Greatest common factor', 'Least common multiple',
  'Divisibility rules', 'Square roots introduction'
])

// Geometry — 15 items
add('upper_elementary', 'geometry', 'Advanced Geometry', [
  'Area of parallelogram', 'Area of trapezoid',
  'Area of circle (pi)', 'Circumference of circle',
  'Volume of rectangular prism', 'Volume of cylinder',
  'Surface area', 'Pythagorean theorem (introduction)',
  'Coordinate geometry', 'Transformations (translation, rotation, reflection)',
  'Tessellations', 'Scale drawings',
  'Geometric constructions (advanced)',
  'Three-dimensional geometry', 'Cross-sections'
])

// Geography — 15 items
add('upper_elementary', 'geography', 'World Geography Advanced', [
  'Political geography (governments)', 'Economic geography (trade, resources)',
  'Population and demographics', 'Urbanization',
  'Climate zones', 'Tectonic plates and earthquakes',
  'Volcanoes', 'Ocean currents and weather systems',
  'Deforestation and environmental issues', 'Sustainable development',
  'Geographic information systems (GIS intro)',
  'Country research projects (in-depth)', 'Current events geography',
  'Map projections', 'Topographic maps'
])

// Science — 25 items
add('upper_elementary', 'science', 'Life Science', [
  'Cell structure (plant and animal)', 'Cell division (mitosis)',
  'Genetics introduction (heredity)', 'DNA basics',
  'Classification of organisms (taxonomy)', 'Ecosystem interactions',
  'Adaptation and evolution', 'Human body systems (detailed)',
  'Nutrition and health', 'Microscope skills'
])
add('upper_elementary', 'science', 'Physical Science', [
  'Atoms and elements', 'Periodic table introduction',
  'Chemical reactions', 'States of matter (molecular level)',
  'Forces and motion (Newtons laws)', 'Energy (kinetic/potential)',
  'Electricity and magnetism', 'Waves (sound and light)',
  'Heat transfer (conduction, convection, radiation)'
])
add('upper_elementary', 'science', 'Earth & Space Science', [
  'Solar system (detailed)', 'Stars and galaxies',
  'Earth layers and plate tectonics', 'Rock cycle',
  'Water cycle (advanced)', 'Climate change science'
])

// History — 20 items
add('upper_elementary', 'history', 'Ancient History', [
  'Mesopotamia', 'Ancient Egypt (detailed)',
  'Ancient India', 'Ancient China',
  'Ancient Greece (detailed)', 'Roman Empire',
  'Rise of Christianity and Islam'
])
add('upper_elementary', 'history', 'Medieval to Modern', [
  'Middle Ages', 'Renaissance', 'Age of Exploration',
  'Scientific Revolution', 'Enlightenment',
  'American Revolution', 'French Revolution',
  'Industrial Revolution', 'World Wars overview',
  'Civil Rights movements', 'Modern global connections',
  'Historical research methods', 'Primary source analysis'
])

// Culture — 8 items
add('upper_elementary', 'culture', 'Cultural Studies', [
  'Comparative religions study', 'Philosophy for children',
  'Ethics and moral reasoning', 'Current events discussion',
  'Media literacy', 'Global citizenship',
  'Economic systems comparison', 'United Nations and international cooperation'
])

// Art & Music — 8 items
add('upper_elementary', 'art_music', 'Visual Art', [
  'Art history periods', 'Portfolio development',
  'Mixed media projects', 'Digital art introduction'
])
add('upper_elementary', 'art_music', 'Music', [
  'Instrument study (choice)', 'Music theory',
  'Ensemble/group performance', 'Composition basics'
])

// Read Aloud — 6 items
add('upper_elementary', 'read_aloud', 'Advanced Literature', [
  'Novel study (discussion groups)', 'Shakespeare introduction',
  'World literature', 'Debate and discussion',
  'Podcast/audiobook study', 'Independent reading conferences'
])

// ═══════════════════════════════════════════════════════
// Write output
// ═══════════════════════════════════════════════════════

const fs = require('fs')
const path = require('path')

const outPath = path.join(__dirname, 'data', 'scope-sequence.json')
fs.writeFileSync(outPath, JSON.stringify(items, null, 2))

// Stats
const byLevel = {}
const bySubject = {}
for (const item of items) {
  byLevel[item.level_name] = (byLevel[item.level_name] || 0) + 1
  const key = `${item.level_name}/${item.subject_name}`
  bySubject[key] = (bySubject[key] || 0) + 1
}

console.log(`Total scope items: ${items.length}`)
console.log('\nBy level:')
for (const [level, count] of Object.entries(byLevel)) {
  console.log(`  ${level}: ${count}`)
}
console.log('\nBy level/subject:')
for (const [key, count] of Object.entries(bySubject)) {
  console.log(`  ${key}: ${count}`)
}
console.log(`\nWritten to ${outPath}`)
