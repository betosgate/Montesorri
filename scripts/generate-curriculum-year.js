#!/usr/bin/env node

/**
 * Curriculum Year Generator
 *
 * Generates a full academic year (36 weeks x 25 lessons = 900 lessons) for any level/year.
 * Uses Claude API to produce detailed, unique, age-appropriate Montessori lessons.
 *
 * Usage:
 *   node scripts/generate-curriculum-year.js <level> [startWeek] [endWeek]
 *
 * Levels:
 *   primary-year1      (age 3-4, Pre-K)
 *   primary-year2      (age 4-5, Pre-K+)
 *   lower-el-year2     (grade 2, age 7-8)
 *   lower-el-year3     (grade 3, age 8-9)
 *   upper-el-year2     (grade 5, age 10-11)
 *   upper-el-year3     (grade 6, age 11-12)
 *
 * Examples:
 *   node scripts/generate-curriculum-year.js upper-el-year2          # all 36 weeks
 *   node scripts/generate-curriculum-year.js upper-el-year2 1 4      # weeks 1-4 only
 *   node scripts/generate-curriculum-year.js lower-el-year2 5 8      # weeks 5-8 only
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const client = new Anthropic({ timeout: 300000 }); // 5 min timeout per API call

// ============================================================================
// Level configurations
// ============================================================================

const LEVELS = {
  'primary-year1': {
    levelName: 'primary_year1',
    dirName: 'primary-year1-lessons',
    age: '3-4',
    grade: 'Pre-K',
    duration: 30,
    mascot: 'Betsy Bear',
    mascotEmoji: '🐻',
    description: 'First year of Montessori Primary (age 3-4). Very slow pace, lots of repetition, process-oriented. Heavy practical life focus.',
    subjects: getSubjectSchedulePrimaryYear1(),
    curriculumGuide: getPrimaryYear1Guide(),
  },
  'primary-year2': {
    levelName: 'primary_year2',
    dirName: 'primary-year2-lessons',
    age: '4-5',
    grade: 'Pre-K+',
    duration: 30,
    mascot: 'Betsy Bear',
    mascotEmoji: '🐻',
    description: 'Second year of Montessori Primary (age 4-5). Building independence, materials getting complex.',
    subjects: getSubjectSchedulePrimaryYear2(),
    curriculumGuide: getPrimaryYear2Guide(),
  },
  'lower-el-year2': {
    levelName: 'lower_elementary_year2',
    dirName: 'lower-elementary-year2-lessons',
    age: '7-8',
    grade: '2nd',
    duration: 45,
    mascot: 'Ollie Owl',
    mascotEmoji: '🦉',
    description: 'Second year of Lower Elementary (grade 2, age 7-8).',
    subjects: getSubjectScheduleElementary(),
    curriculumGuide: getLowerElYear2Guide(),
  },
  'lower-el-year3': {
    levelName: 'lower_elementary_year3',
    dirName: 'lower-elementary-year3-lessons',
    age: '8-9',
    grade: '3rd',
    duration: 45,
    mascot: 'Ollie Owl',
    mascotEmoji: '🦉',
    description: 'Third year of Lower Elementary (grade 3, age 8-9).',
    subjects: getSubjectScheduleElementary(),
    curriculumGuide: getLowerElYear3Guide(),
  },
  'upper-el-year2': {
    levelName: 'upper_elementary_year2',
    dirName: 'upper-elementary-year2-lessons',
    age: '10-11',
    grade: '5th',
    duration: 60,
    mascot: 'Finn Fox',
    mascotEmoji: '🦊',
    description: 'Second year of Upper Elementary (grade 5, age 10-11).',
    subjects: getSubjectScheduleElementary(),
    curriculumGuide: getUpperElYear2Guide(),
  },
  'upper-el-year3': {
    levelName: 'upper_elementary_year3',
    dirName: 'upper-elementary-year3-lessons',
    age: '11-12',
    grade: '6th',
    duration: 60,
    mascot: 'Finn Fox',
    mascotEmoji: '🦊',
    description: 'Third year of Upper Elementary (grade 6, age 11-12).',
    subjects: getSubjectScheduleElementary(),
    curriculumGuide: getUpperElYear3Guide(),
  },
};

// ============================================================================
// Subject schedules (which subjects on which days)
// ============================================================================

function getSubjectSchedulePrimaryYear1() {
  // Primary: 5 lessons per day across varied subjects
  return {
    // [day1, day2, day3, day4, day5] each day has 5 subjects
    schedule: [
      // slot 1: Practical Life every day
      ['practical_life', 'practical_life', 'practical_life', 'practical_life', 'practical_life'],
      // slot 2: Language M/W/F, Sensorial Tu/Th
      ['language', 'sensorial', 'language', 'sensorial', 'language'],
      // slot 3: Math M/W/F, Culture Tu/Th
      ['math', 'culture', 'math', 'culture', 'math'],
      // slot 4: Sensorial M/W, Geography Tu, Science Th, Art F
      ['sensorial', 'geography', 'sensorial', 'science', 'art_music'],
      // slot 5: Read Aloud every day
      ['read_aloud', 'read_aloud', 'read_aloud', 'read_aloud', 'read_aloud'],
    ],
  };
}

function getSubjectSchedulePrimaryYear2() {
  return {
    schedule: [
      ['practical_life', 'practical_life', 'practical_life', 'practical_life', 'practical_life'],
      ['language', 'sensorial', 'language', 'sensorial', 'language'],
      ['math', 'geography', 'math', 'science', 'math'],
      ['sensorial', 'culture', 'sensorial', 'culture', 'art_music'],
      ['read_aloud', 'read_aloud', 'read_aloud', 'read_aloud', 'read_aloud'],
    ],
  };
}

function getSubjectScheduleElementary() {
  return {
    schedule: [
      // slot 1: Language every day
      ['language', 'language', 'language', 'language', 'language'],
      // slot 2: Math every day
      ['math', 'math', 'math', 'math', 'math'],
      // slot 3: History M/W, Science Tu/Th, Art F
      ['history', 'science', 'history', 'science', 'art_music'],
      // slot 4: Geography M/W, Culture Tu, Read Aloud Th/F
      ['geography', 'culture', 'geography', 'read_aloud', 'read_aloud'],
      // slot 5: Read Aloud M-W, Geography Th, Culture F
      ['read_aloud', 'read_aloud', 'read_aloud', 'geography', 'culture'],
    ],
  };
}

// ============================================================================
// Curriculum guides per level (what to teach each quarter)
// ============================================================================

function getPrimaryYear1Guide() {
  return `
PRIMARY YEAR 1 (age 3-4, Pre-K) — Full Year Curriculum Guide

PRACTICAL LIFE (daily, ~30% of time):
Q1: Pouring dry goods, spooning, scooping, carrying tray, pushing chair in, rolling/unrolling work mat
Q2: Pouring water (pitcher to pitcher), transferring with tongs, opening/closing containers, folding cloths (halves)
Q3: Buttoning frame, zipping frame, snapping frame, hand washing, tooth brushing, table wiping
Q4: Polishing (mirror, wood), sweeping with small broom, flower arranging, simple food prep (banana, crackers)

SENSORIAL:
Q1: Pink Tower (build, grade, vocabulary: large/small), Knobbed Cylinders Block 1
Q2: Brown Stair (build, grade, thick/thin), Knobbed Cylinders Block 2, Color Box 1 (3 primary colors)
Q3: Knobbed Cylinders Block 3, Color Box 2 (11 color pairs), Sound Cylinders, Rough/Smooth Boards
Q4: Knobbed Cylinders Block 4, Fabric Box, Thermic Bottles, Baric Tablets intro, Pink Tower + Brown Stair combo

LANGUAGE (3x/week):
Q1: I Spy beginning sounds (/s/, /m/, /a/), vocabulary enrichment (naming 10 objects), nursery rhymes
Q2: I Spy continuing (/t/, /p/, /r/), beginning Sandpaper Letters (s, m, a, t), finger plays
Q3: Sandpaper Letters (p, r, i, o), I Spy medial sounds, vocabulary categories (animals, foods)
Q4: Sandpaper Letters (n, g, l, h), matching objects to letters, rhyming games. Max 10-12 sounds by year end. NO READING.

MATH (3x/week):
Q1: Number rods 1-3 (one-to-one counting), sorting by color/shape/size
Q2: Number rods 1-5, Sandpaper Numerals 1-3, patterning (AB, ABB)
Q3: Number rods 1-7, Sandpaper Numerals 4-7, zero concept introduction
Q4: Number rods 1-10, Sandpaper Numerals 8-10 and 0, one-to-one correspondence. NO OPERATIONS.

GEOGRAPHY/SCIENCE (1-2x/week):
Q1: Land vs Water (sandpaper globe touch), seasons observation journal
Q2: Globe spinning, name own continent, nature walks with magnifying glass
Q3: Name own country, weather charting (sunny, rainy, cloudy), living vs non-living intro
Q4: 3 continents (own + 2 others), plant observation (grow a bean sprout), color mixing

ART/MUSIC (1x/week):
All year: Finger painting, scribbling, playdough, tearing paper, printing, singing, clapping rhythms, silence game

READ-ALOUD (daily, 10-15 min):
Favorites: Goodnight Moon, Brown Bear Brown Bear, The Very Hungry Caterpillar, Where the Wild Things Are, Caps for Sale, Corduroy, Chicka Chicka Boom Boom, Harold and the Purple Crayon, Owl Babies, We're Going on a Bear Hunt. Heavy repetition — reread favorites 3-4 times.
`;
}

function getPrimaryYear2Guide() {
  return `
PRIMARY YEAR 2 (age 4-5, Pre-K+) — Full Year Curriculum Guide

PRACTICAL LIFE:
Q1: Pouring water (small pitcher to multiple cups), transferring with tweezers, opening jars, folding napkins
Q2: Cutting with scissors (straight lines then curves), gluing/pasting, sewing burlap with large needle, dish washing
Q3: Food prep (spreading butter, cutting banana, squeezing orange), polishing shoes, table setting
Q4: Flower arranging (measuring water, cutting stems), sweeping/mopping, sewing running stitch, cooking simple recipes

SENSORIAL:
Q1: Pink Tower + Brown Stair extensions, Knobbed Cylinders pairing activities, Color Box 2 review + matching
Q2: Color Box 3 (gradations of 9 colors), Geometric Cabinet intro (circles, triangles)
Q3: Geometric Cabinet (quadrilaterals, polygons), Binomial Cube, Constructive Triangles Box 1
Q4: Constructive Triangles Box 2, Geometric Solids intro, Smelling Bottles, Tasting Bottles, Thermic Tablets, Mystery Bag

LANGUAGE:
Q1: Complete remaining Sandpaper Letters (d, b, c, e, f), I Spy all positions, metal inset tracing (circle, triangle)
Q2: Sandpaper Letters (j, k, q, u, v, w, x, y, z) — complete alphabet. Phonogram sh, ch. Metal insets continued.
Q3: Phonograms th, oo, ee. Moveable Alphabet: CVC word building (cat, dog, hen, sit, mop). Begin reading simple words.
Q4: Phonograms ai, oa. Reading phonetic words independently. Writing letters on paper. Vocabulary expansion.

MATH:
Q1: Spindle Box (0-9 with zero), Cards & Counters (odd/even), Number rods 1-10 review
Q2: Golden Bead introduction (units, tens, hundreds, thousands as concrete materials), Teen Board
Q3: Ten Board, Hundred Board, Golden Bead addition (2 digits, no exchange), Bead Stair (1-10)
Q4: Golden Bead addition (3 digits, with exchange), linear counting with 100 chain, skip counting by 10

GEOGRAPHY:
Q1: All 7 continents named and colored, World puzzle map
Q2: North America puzzle map, land/water forms (island/lake, cape/bay)
Q3: South America puzzle map, land/water forms (peninsula/gulf, isthmus/strait), flag work begins
Q4: Europe puzzle map, 2-3 country studies with flags, seasons review

SCIENCE:
Q1: Living vs Non-Living sorting, nature journal, magnifying glass exploration
Q2: Parts of a Plant (root, stem, leaf, flower), grow a bean plant
Q3: Animal classification (vertebrate vs invertebrate intro), butterfly life cycle
Q4: Magnets (attract/repel), sink or float, simple weather station

ART/MUSIC:
Q1: Painting with tempera brushes, cutting shapes, collage
Q2: Color wheel, leaf/nature prints, clay sculptures
Q3: Montessori bells (matching pairs, grading 8 bells), singing from cultures
Q4: Self-portrait drawing, mixed media projects, rhythm instruments

READ-ALOUD (daily, 15 min):
Q1: Eric Carle (The Grouchy Ladybug, The Tiny Seed), Mo Willems (Pigeon series)
Q2: Leo Lionni (Swimmy, Frederick, Inch by Inch), Jan Brett (The Mitten, The Hat)
Q3: Kevin Henkes (Chrysanthemum, Lilly's Purple Plastic Purse), Tomie dePaola
Q4: Dr. Seuss deeper cuts (Horton Hears a Who, The Lorax), Ezra Jack Keats (The Snowy Day, Peter's Chair)
`;
}

function getLowerElYear2Guide() {
  return `
LOWER ELEMENTARY YEAR 2 (grade 2, age 7-8) — Full Year Curriculum Guide

LANGUAGE (daily):
Q1: Review parts of speech with grammar boxes (article, noun, adjective). Cursive letter formation. Spelling: short vowel patterns.
Q2: New parts of speech: adverb, preposition (Montessori grammar symbols). Paragraph writing (topic sentence, supporting details, closing). Spelling: long vowel patterns, silent e.
Q3: Conjunction, interjection. Multi-paragraph writing. Book reports (structured: title, author, setting, characters, plot, opinion). Spelling: vowel teams (ai, ea, oa, igh).
Q4: Research mini-reports (3 paragraphs with facts from 2 sources). Peer editing. Spelling: r-controlled vowels, silent letters. Poetry writing (acrostic, cinquain).

MATH (daily):
Q1: Multi-digit addition with bead frame (dynamic, regrouping through thousands). Multiplication intro with bead bars (concept of groups). Skip counting chains (2, 3, 5, 10).
Q2: Multiplication board (memorize facts 1-5). Introduction to division (sharing/grouping concept with golden beads). Measurement: ruler to nearest inch, clock to 5 minutes.
Q3: Multiplication facts 6-9. Division with stamp game. Money (coin values, making change). Geometry: identify shapes, symmetry, perimeter introduction.
Q4: Unlike fractions introduction (fraction insets — comparing, ordering). 2-step word problems. Data: bar graphs, pictographs. Estimation and rounding to nearest 10 and 100.

HISTORY (2x/week):
Q1: Ancient Egypt deep study (Nile, pyramids, pharaohs, hieroglyphics, mummification, Book of the Dead)
Q2: Ancient India (Indus Valley civilization, caste system, Buddhism, Hinduism), Ancient China (Great Wall, inventions: paper, compass, gunpowder, silk)
Q3: Ancient Greece (city-states: Athens vs Sparta, democracy, Olympics, myths, philosophy), Greek architecture
Q4: Roman Republic and Empire (government, roads, aqueducts, gladiators, Pompeii, fall of Rome)

GEOGRAPHY (2x/week):
Q1: Africa study (physical features: Sahara, Nile, Kilimanjaro; political: key countries; cultural: music, art, animals)
Q2: Asia study (physical: Himalayas, Gobi, rivers; political: China, Japan, India; cultural: food, festivals)
Q3: Water cycle, landform types (mountain, valley, plateau, plain, delta, canyon), map skills (compass, scale, legend)
Q4: European countries and capitals (major ones), climate zones of Europe, cultural geography

SCIENCE (2x/week):
Q1: States of matter (solid, liquid, gas — experiments with ice, water, steam), properties of matter
Q2: Simple machines (lever, inclined plane, wheel/axle, pulley, screw, wedge), force and motion basics
Q3: Animal classification (5 vertebrate classes: fish, amphibian, reptile, bird, mammal — characteristics, examples), invertebrates overview
Q4: Plant anatomy (detailed: roots, stems, leaves, flowers, seeds, fruit), food chains and webs, photosynthesis basics

READ-ALOUD (3x/week):
Q1: Charlotte's Web (E.B. White) — friendship, death, natural cycles
Q2: Stuart Little (E.B. White) — adventure, perseverance
Q3: Mr. Popper's Penguins — responsibility, problem-solving
Q4: Matilda (Roald Dahl) — love of learning, justice, courage
Supplemental: James and the Giant Peach, The Mouse and the Motorcycle

ART/MUSIC (1x/week):
Mixed media projects tied to history/geography themes. Music: recorder introduction, folk songs from studied cultures.
`;
}

function getLowerElYear3Guide() {
  return `
LOWER ELEMENTARY YEAR 3 (grade 3, age 8-9) — Full Year Curriculum Guide

LANGUAGE (daily):
Q1: Complex sentence structure (compound, complex). Verb tenses (past, present, future, progressive). Cursive fluency. Spelling: prefixes (un-, re-, pre-, dis-).
Q2: Paragraph revision process (draft, revise, edit, publish). Research report (multi-paragraph, topic sentences, transitions). Spelling: suffixes (-ful, -less, -ment, -tion).
Q3: Creative writing: short story (character, setting, conflict, resolution). Poetry: haiku, limerick, free verse. Reading comprehension: inference, prediction, main idea.
Q4: Advanced grammar: clauses, compound-complex sentences, punctuation (semicolon, colon). Peer review workshops. Author study. Spelling bees.

MATH (daily):
Q1: Long multiplication with checkerboard (2-digit x 2-digit). Review multiplication facts to 12x12. Estimation and rounding to 1000.
Q2: Long division with racks and tubes (2-3 digit ÷ 1 digit). Decimal introduction (decimal board: tenths, hundredths). Fractions review + unlike denominators.
Q3: Perimeter and area of rectangles and irregular shapes. Volume of rectangular prisms. Data: line plots, bar graphs with scale. Multi-step word problems (3+ steps).
Q4: Factors and multiples (prime/composite). Fraction operations (add/subtract unlike). Order of operations introduction. Geometry: angles (right, acute, obtuse), types of triangles.

HISTORY (2x/week):
Q1: Age of Exploration (Columbus, Magellan, da Gama, Drake). Motivations and consequences. Maps of exploration routes. Impact on indigenous peoples.
Q2: Renaissance (Leonardo da Vinci, Michelangelo, Gutenberg printing press, Florence, scientific method beginnings). Art projects.
Q3: American Revolution (causes: taxation, Boston Tea Party; key figures: Washington, Jefferson, Franklin; Declaration of Independence; battles).
Q4: Industrial Revolution (factories, child labor, inventions: steam engine, spinning jenny). 20th century overview (World Wars, civil rights, technology). Full wall timeline construction.

GEOGRAPHY (2x/week):
Q1: Europe deep study (UK, France, Germany, Italy, Spain, Scandinavia — capitals, languages, landmarks, EU)
Q2: South America deep study (Brazil, Argentina, Peru, Chile — Amazon, Andes, cultures, economies)
Q3: Oceania (Australia, New Zealand, Pacific Islands). Natural resources and economic geography introduction.
Q4: Mapmaking and cartography projects. Environmental geography (deforestation, ocean pollution). Biome research project.

SCIENCE (2x/week):
Q1: Human body: skeletal system (bones, joints, X-rays) and muscular system (types, how they work together)
Q2: Human body: digestive system and respiratory system. Nutrition and healthy eating.
Q3: Electricity basics (circuits, conductors, insulators, static). Sound (vibration, pitch, volume) and light (reflection, refraction, spectrum).
Q4: Ecosystems and habitats. Astronomy (moon phases, constellations, seasons explained by Earth's tilt). Scientific method: full formal experiment with hypothesis, procedure, results, conclusion.

READ-ALOUD (3x/week):
Q1: The Phantom Tollbooth (Norton Juster) — wordplay, mathematics, journey
Q2: A Wrinkle in Time (Madeleine L'Engle) — science fiction, family, courage
Q3: Shiloh (Phyllis Reynolds Naylor) — ethics, advocacy
Q4: Hatchet (Gary Paulsen) — survival, resilience
Supplemental: My Father's Dragon trilogy, The Indian in the Cupboard
`;
}

function getUpperElYear2Guide() {
  return `
UPPER ELEMENTARY YEAR 2 (grade 5, age 10-11) — Full Year Curriculum Guide

LANGUAGE (daily):
Q1: Expository essay (5-paragraph structure: thesis, 3 body paragraphs, conclusion). Research skills: paraphrasing vs quoting, avoiding plagiarism. Vocabulary: Latin roots (port, dict, scrib, ject, rupt).
Q2: Literary analysis: theme, symbolism, point of view, irony. Compare/contrast essay. Vocabulary: Greek roots (graph, phon, chron, geo, bio). Spelling: commonly confused words.
Q3: Research paper with citations (MLA basics: in-text citations, Works Cited page, 3+ sources). Debate: formal structure, opening/rebuttal/closing. Journalism: news article structure (inverted pyramid).
Q4: Creative writing portfolio (short story, personal narrative, poem, persuasive letter). Grammar review: parallel structure, active vs passive voice, sentence variety. Public speaking: 5-minute presentation with visual aids.

MATH (daily):
Q1: Fraction operations: add/subtract unlike denominators, multiply fractions and mixed numbers, reciprocals. Decimal operations: all four operations to hundredths. Converting between fractions, decimals, percentages.
Q2: Ratios and proportions. Percentage problems (tax, tip, discount, markup). Introduction to integers: number line, comparing, absolute value. Coordinate graphing (first quadrant).
Q3: Order of operations (PEMDAS with parentheses and exponents). Pre-algebra: variables, writing expressions, solving one-step equations. Prime factorization, GCF, LCM. Coordinate graphing (all 4 quadrants).
Q4: Geometry: area of triangles, parallelograms, trapezoids. Circumference and area of circles (pi). Volume of rectangular prisms and cylinders. Statistics: mean, median, mode, range. Probability: theoretical vs experimental.

HISTORY — AMERICAN HISTORY FOCUS (2x/week):
Q1: Colonial America (13 colonies, Jamestown, Plymouth, colonial life). Causes of Revolution (taxation, Stamp Act, Boston Massacre, Tea Party). Key figures.
Q2: American Revolution (Declaration of Independence deep read, key battles, Valley Forge, Treaty of Paris). Constitution (articles, amendments, Bill of Rights). Federalists vs Anti-Federalists.
Q3: Westward Expansion (Louisiana Purchase, Lewis & Clark, Trail of Tears, Manifest Destiny, Gold Rush). Civil War (causes: slavery, states' rights; key battles; Emancipation Proclamation; Reconstruction).
Q4: Immigration and industrialization (Ellis Island, factories, labor unions). Progressive Era. Civil Rights movement (Rosa Parks, MLK, Brown v Board, March on Washington). Women's suffrage (Seneca Falls, 19th Amendment).

GEOGRAPHY (2x/week):
Q1: US geography (regions: Northeast, Southeast, Midwest, Southwest, West — states, capitals, landmarks, climates)
Q2: US physical geography (major rivers, mountains, plains, deserts, Great Lakes). Climate change: evidence, causes, effects.
Q3: Population geography: migration patterns, urbanization, demographics. Cultural geography: religions, languages, ethnic diversity worldwide.
Q4: Independent geographic research project. Urban vs rural comparisons. Map projections and their distortions.

SCIENCE (2x/week):
Q1: Chemistry: atoms and elements, periodic table introduction (first 20 elements), states of matter review at molecular level, mixtures vs compounds, solutions.
Q2: Physics: forces and motion (Newton's 3 laws), gravity, friction, simple machines review at formula level (mechanical advantage). Energy transfer (kinetic, potential, thermal).
Q3: Earth science: plate tectonics, earthquakes, volcanoes, rock cycle (igneous, sedimentary, metamorphic). Layers of Earth.
Q4: Space: solar system in depth (each planet), gravity and orbits, space exploration history (Apollo, ISS, Mars rovers). Scientific method: formal lab reports with data tables and graphs.

READ-ALOUD (2x/week):
Q1: Number the Stars (Lois Lowry) — WWII, courage, moral choices
Q2: Bridge to Terabithia (Katherine Paterson) — friendship, imagination, loss
Q3: Tuck Everlasting (Natalie Babbitt) — mortality, choices, natural order
Q4: The Westing Game (Ellen Raskin) — mystery, logic, critical thinking
Supplemental: Bud Not Buddy, Esperanza Rising preview chapters

ART/MUSIC (1x/week):
Renaissance art study and reproduction. Perspective drawing. Music: world music genres, instrument families. Film scoring analysis.
`;
}

function getUpperElYear3Guide() {
  return `
UPPER ELEMENTARY YEAR 3 (grade 6, age 11-12) — Full Year Curriculum Guide

LANGUAGE (daily):
Q1: Argumentative essay with counterarguments and evidence. Research methodology: database searching, evaluating sources, annotated bibliography. Vocabulary: SAT-prep words, context clues.
Q2: Comparative literary analysis (2+ texts). Memoir writing. Grammar: complex punctuation (dashes, ellipses, parenthetical citations). Vocabulary: discipline-specific words (science, history, math).
Q3: Journalism project (class newspaper/blog: editorial, interview, feature, review). Creative writing: flash fiction, spoken word poetry. Speech writing and delivery.
Q4: Capstone writing portfolio (best work from all years, author's reflection, peer and self-assessment). Introduction to world literature (excerpts: Homer, Shakespeare, Rumi, Basho).

MATH (daily):
Q1: Algebra: expressions with variables, combining like terms, distributive property. Solving one- and two-step equations. Inequalities on number line. Negative numbers: all operations.
Q2: Geometry: angle relationships (complementary, supplementary, vertical), triangle angle sum. Area of complex shapes. Surface area and volume of prisms, pyramids, cylinders. Pythagorean theorem introduction.
Q3: Statistics: mean, median, mode with large data sets. Data displays (histograms, box plots, scatter plots). Probability: compound events, tree diagrams, simulations. Ratios/proportions review.
Q4: Real-world math: personal budgeting, simple interest, unit rates, measurement conversions (metric/customary). Coordinate geometry: plotting points, distance between points, graphing linear equations. Math portfolio/capstone.

HISTORY — MODERN WORLD HISTORY (2x/week):
Q1: World War I (causes: alliances, imperialism, assassination; trench warfare; Treaty of Versailles). Russian Revolution. Rise of totalitarianism (fascism, communism, Nazism).
Q2: World War II (European and Pacific theaters, Holocaust, D-Day, atomic bombs, Nuremberg trials). United Nations founding. Universal Declaration of Human Rights.
Q3: Cold War (Iron Curtain, Korean War, Cuban Missile Crisis, Space Race, Berlin Wall fall). Decolonization (Africa, India, Southeast Asia). Civil rights movements worldwide.
Q4: Globalization (technology, trade, internet, cultural exchange). Current events: climate change, migration, democracy vs authoritarianism. Economics: supply/demand, GDP, trade. Government systems comparison (democracy, monarchy, theocracy, oligarchy).

GEOGRAPHY (2x/week):
Q1: Global issues: water access and scarcity, food security, population growth, urbanization
Q2: Geopolitics: borders, conflicts, international organizations (UN, NATO, EU, WHO, WTO), refugee crises
Q3: Environmental sustainability: renewable energy, conservation, deforestation, ocean health, carbon footprint
Q4: Independent research project: choose a global issue, research from multiple perspectives, present findings with map visuals

SCIENCE (2x/week):
Q1: Biology: cells (plant vs animal, organelles, microscope use), DNA basics (double helix, genes, traits), heredity (dominant/recessive, Punnett squares)
Q2: Biology continued: classification of living things (6 kingdoms), ecology (food webs, energy pyramids, biomes, symbiosis). Human impact on ecosystems.
Q3: Chemistry: chemical reactions (reactants/products, conservation of mass), acids and bases (pH scale), periodic table groups and trends. Lab safety and technique.
Q4: Physics: electricity (circuits, voltage, current, resistance, Ohm's law basics), magnetism (electromagnets, motors), waves (transverse, longitudinal, frequency, wavelength). Engineering design challenges. Climate science.

READ-ALOUD (2x/week):
Q1: The Hobbit (J.R.R. Tolkien) — hero's journey, moral growth
Q2: A Long Walk to Water (Linda Sue Park) — South Sudan, survival, interconnection
Q3: Brown Girl Dreaming (Jacqueline Woodson) — identity, race, poetry as literature
Q4: The Crossover (Kwame Alexander) — sports, family, verse novel
Supplemental: Esperanza Rising, Ghost Boys, Refugee

ART/MUSIC (1x/week):
Modern art movements (Impressionism through Contemporary). Portfolio development. Music: songwriting, world music analysis, music and social movements.
`;
}

// ============================================================================
// Main generation logic
// ============================================================================

async function generateDay(level, weekNumber, dayNumber, config) {
  const quarter = Math.ceil(weekNumber / 9);
  const weekInQuarter = ((weekNumber - 1) % 9) + 1;

  // Build the 5-lesson schedule for this day
  const dayLessons = [];
  for (let slot = 0; slot < 5; slot++) {
    const subject = config.subjects.schedule[slot][dayNumber - 1];
    dayLessons.push({
      slot: slot + 1,
      subject,
      sortOrder: (dayNumber - 1) * 5 + slot + 1,
    });
  }

  const prompt = `You are an expert Montessori curriculum designer. Generate exactly 5 lessons for ONE DAY.

LEVEL: ${config.levelName} | GRADE: ${config.grade} (age ${config.age})
WEEK: ${weekNumber}/36 | QUARTER: ${quarter} (week ${weekInQuarter} of Q)
DAY: ${dayNumber} (${['','Monday','Tuesday','Wednesday','Thursday','Friday'][dayNumber]})
DURATION: ${config.duration} min/lesson | MASCOT: ${config.mascot}

CURRICULUM GUIDE:
${config.curriculumGuide}

Generate these 5 lessons:
${dayLessons.map((l, i) => `${i+1}. Subject: ${l.subject} (sort_order: ${l.sortOrder})`).join('\n')}

Each lesson JSON object must have ALL of these fields:
- level_name: "${config.levelName}"
- subject_name, week_number: ${weekNumber}, day_of_week: ${dayNumber}, quarter: ${quarter}
- title (unique, descriptive), description (2-3 sentences), instructions (6-8 numbered steps for parent)
- duration_minutes: ${config.duration}, lesson_type: "guided", materials_needed: [3-6 items]
- sort_order, parent_notes (3-5 sentences with Montessori philosophy), age_adaptations: null
- slide_content.slides: array of EXACTLY 7 slides:
  1. { "type": "title", "heading": "...", "subheading": "...", "mascot_explanation": "..." }
  2. { "type": "materials", "items": [...], "setup_instructions": "...", "mascot_explanation": "..." }
  3. { "type": "instruction", "step": 1, "text": "...", "mascot_explanation": "..." }
  4. { "type": "instruction", "step": 2, "text": "...", "mascot_explanation": "..." }
  5. { "type": "activity", "prompt": "...", "duration_minutes": N, "mascot_explanation": "..." }
  6. { "type": "check_understanding", "items": ["Q1","Q2","Q3"], "mascot_explanation": "..." }
  7. { "type": "wrap_up", "text": "...", "mastery_check": "...", "mascot_explanation": "..." }

mascot_explanation = 2-3 sentences from ${config.mascot} explaining the slide warmly to a ${config.age} year old.

RULES: Follow curriculum guide for Q${quarter}. EVERY lesson title must be UNIQUE across the entire year — never repeat a title from any previous week. Add specificity: include the specific concept, material, or chapter (e.g., "Multiplying Fractions: Area Model with Thirds and Fourths" not just "Multiplying Fractions"). For spiral topics revisited across weeks, differentiate by naming the specific skill/strategy/problem type for that week. Age-appropriate for ${config.age}. Realistic home materials. For read_aloud, use books from Q${quarter} guide.

Output ONLY a valid JSON array of exactly 5 lesson objects. No markdown wrapping.`;

  let text = '';
  const MAX_RETRIES = 6;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      });
      text = response.content[0].type === 'text' ? response.content[0].text : '';
      break;
    } catch (err) {
      const isLastAttempt = attempt >= MAX_RETRIES - 1;
      const status = err.status || err.statusCode;
      const msg = err.message || '';

      // Immediately propagate credit depletion errors — no point retrying
      if (status === 400 && msg.includes('credit balance')) {
        throw err;
      }

      // Rate limited (429) — wait longer with backoff
      if (status === 429) {
        const wait = Math.min(30 + attempt * 30, 120); // 30s, 60s, 90s, 120s...
        console.log(` rate limited (attempt ${attempt + 1}/${MAX_RETRIES}), waiting ${wait}s...`);
        if (isLastAttempt) throw err;
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }

      // Overloaded (529) — wait and retry
      if (status === 529) {
        const wait = 30 + attempt * 20; // 30s, 50s, 70s...
        console.log(` API overloaded (attempt ${attempt + 1}/${MAX_RETRIES}), waiting ${wait}s...`);
        if (isLastAttempt) throw err;
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }

      // Timeout — retry with backoff
      if (err.name === 'APIConnectionTimeoutError' || err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET') {
        const wait = 10 + attempt * 10;
        console.log(` timeout (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${wait}s...`);
        if (isLastAttempt) throw err;
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }

      // Server errors (500, 502, 503) — retry
      if (status >= 500 && status < 600) {
        const wait = 15 + attempt * 15;
        console.log(` server error ${status} (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${wait}s...`);
        if (isLastAttempt) throw err;
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }

      // Unknown error — throw
      throw err;
    }
  }

  let jsonText = text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const lessons = JSON.parse(jsonText);
    if (!Array.isArray(lessons)) throw new Error('Not an array');
    return lessons;
  } catch (err) {
    console.error(`    Day ${dayNumber} parse error: ${err.message}`);
    const debugPath = path.join('scripts', 'data', config.dirName, `week-${String(weekNumber).padStart(2, '0')}-day${dayNumber}-debug.txt`);
    fs.writeFileSync(debugPath, text);
    return null;
  }
}

async function generateWeek(level, weekNumber, config, outDir) {
  console.log(`  Generating week ${weekNumber} (Q${Math.ceil(weekNumber / 9)})...`);

  const weekFile = path.join(outDir, `week-${String(weekNumber).padStart(2, '0')}.json`);

  // Resume partial weeks — load existing lessons
  let allLessons = [];
  let startDay = 1;
  if (fs.existsSync(weekFile)) {
    const existing = JSON.parse(fs.readFileSync(weekFile, 'utf-8'));
    if (Array.isArray(existing) && existing.length > 0 && existing.length < 25) {
      allLessons = existing;
      startDay = Math.floor(existing.length / 5) + 1;
      console.log(`    Resuming from day ${startDay} (${existing.length} lessons already saved)`);
    }
  }

  for (let day = startDay; day <= 5; day++) {
    process.stdout.write(`    Day ${day}...`);
    try {
      const dayLessons = await generateDay(level, weekNumber, day, config);
      if (dayLessons) {
        allLessons.push(...dayLessons);
        console.log(` ✓ ${dayLessons.length} lessons`);
        // Save after each day so partial progress is preserved
        fs.writeFileSync(weekFile, JSON.stringify(allLessons, null, 2));
      } else {
        console.log(` ✗ parse failed, skipping day`);
      }
    } catch (err) {
      const msg = typeof err.message === 'string' ? err.message : JSON.stringify(err);
      // Credit depletion must propagate up to stop everything
      if (msg.includes('credit balance') || msg.includes('billing')) {
        throw err;
      }
      console.log(` ✗ error: ${msg.slice(0, 100)}, skipping day`);
      // Save what we have so far
      if (allLessons.length > 0) {
        fs.writeFileSync(weekFile, JSON.stringify(allLessons, null, 2));
      }
    }
    // Delay between days to avoid rate limits (4000 output tokens/min limit)
    if (day < 5) await new Promise(r => setTimeout(r, 8000));
  }

  return allLessons.length > 0 ? allLessons : null;
}

async function main() {
  const levelKey = process.argv[2];
  const startWeek = parseInt(process.argv[3]) || 1;
  const endWeek = parseInt(process.argv[4]) || 36;

  if (!levelKey || !LEVELS[levelKey]) {
    console.error('Usage: node scripts/generate-curriculum-year.js <level> [startWeek] [endWeek]');
    console.error('Levels:', Object.keys(LEVELS).join(', '));
    process.exit(1);
  }

  const config = LEVELS[levelKey];
  const outDir = path.join('scripts', 'data', config.dirName);

  // Create output directory
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`\nGenerating ${config.levelName} (${config.grade}, age ${config.age})`);
  console.log(`Output: ${outDir}/`);
  console.log(`Weeks: ${startWeek} to ${endWeek}\n`);

  let totalGenerated = 0;
  let totalFailed = 0;

  for (let week = startWeek; week <= endWeek; week++) {
    const weekFile = path.join(outDir, `week-${String(week).padStart(2, '0')}.json`);

    // Skip if already generated (25 = complete, 20+ = close enough)
    if (fs.existsSync(weekFile)) {
      const existing = JSON.parse(fs.readFileSync(weekFile, 'utf-8'));
      if (Array.isArray(existing) && existing.length >= 25) {
        console.log(`  Week ${week}: already exists (${existing.length} lessons), skipping`);
        totalGenerated += existing.length;
        continue;
      }
    }

    try {
      const lessons = await generateWeek(levelKey, week, config, outDir);
      if (lessons) {
        // generateWeek now saves after each day, but do a final write for safety
        fs.writeFileSync(weekFile, JSON.stringify(lessons, null, 2));
        console.log(`  Week ${week}: ✓ ${lessons.length} lessons written`);
        totalGenerated += lessons.length;
      } else {
        console.log(`  Week ${week}: ✗ generation failed`);
        totalFailed++;
      }
    } catch (err) {
      const msg = typeof err.message === 'string' ? err.message : JSON.stringify(err);
      console.error(`  Week ${week}: ✗ error:`, msg);
      // Exit immediately on credit depletion — no point retrying
      if (msg.includes('credit balance is too low') || msg.includes('billing')) {
        console.error('\n  ⛔ API credits depleted. Add credits at console.anthropic.com, then re-run.');
        console.log(`\nPartial progress saved. Generated ${totalGenerated} lessons, ${totalFailed + 1} failures.`);
        console.log(`Files in: ${outDir}/`);
        process.exit(1);
      }
      totalFailed++;
    }

    // Delay between weeks to avoid rate limits
    if (week < endWeek) {
      console.log(`  Waiting 15s before next week...`);
      await new Promise(r => setTimeout(r, 15000));
    }
  }

  console.log(`\nDone! Generated ${totalGenerated} lessons, ${totalFailed} failures.`);
  console.log(`Files in: ${outDir}/`);
}

main().catch(console.error);
