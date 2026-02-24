/**
 * Helper script to generate week JSON data files for weeks 4-36.
 * Run with: npx tsx scripts/generate-week-data.ts
 *
 * Weeks 4-9 (Q1): full slide_content
 * Weeks 10-36 (Q2-Q4): abbreviated (no slide_content)
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

// ─── Curriculum Data ───────────────────────────────────────────────────────────

interface Lesson {
  level_name: string
  subject_name: string
  week_number: number
  day_of_week: number
  quarter: number
  title: string
  description: string
  instructions: string
  duration_minutes: number
  lesson_type: string
  materials_needed: string[]
  slide_content: object | null
  parent_notes: string
  age_adaptations: null
  sort_order: number
}

function quarter(week: number): number {
  if (week <= 9) return 1
  if (week <= 18) return 2
  if (week <= 27) return 3
  return 4
}

// ─── Slot 1: Practical Life / Sensorial (alternating) ──────────────────────────

const plTitlesQ1: Record<number, string[]> = {
  4: [
    'Pouring — Funnel Exercise',
    'Transferring with Tweezers',
    'Folding Cloths — Halves',
  ],
  5: [
    'Pouring Water — Soapy Water with Bubbles',
    'Squeezing Sponge Transfer',
    'Folding Cloths — Quarters',
  ],
  6: [
    'Washing a Table',
    'Threading Beads',
    'Polishing Brass — Introduction',
  ],
  7: [
    'Pouring with a Ladle',
    'Using a Dropper — Water Transfer',
    'Dressing Frame — Buckles',
  ],
  8: [
    'Washing Dishes — Introduction',
    'Lacing Cards',
    'Dressing Frame — Snaps',
  ],
  9: [
    'Arranging Flowers',
    'Peeling a Hard-Boiled Egg',
    'Review: Pouring Exercises (choice)',
  ],
}

const snTitlesQ1: Record<number, string[]> = {
  4: ['Knobbed Cylinders — Block 3', 'Color Tablets — Box 1 Introduction'],
  5: ['Knobbed Cylinders — Block 4', 'Color Tablets — Box 1 Matching'],
  6: ['Pink Tower — Blindfold Extension', 'Brown Stair Extensions'],
  7: ['Red Rods — Maze Extension', 'Geometric Cabinet — Circle, Square, Triangle'],
  8: ['Knobbed Cylinders — Two Blocks Combined', 'Color Tablets — Box 1 Review'],
  9: ['Constructive Triangles — Introduction', 'Sensorial Review — Choice Work'],
}

// Q2 titles
const plTitlesQ2: string[] = [
  'Cutting with Scissors — Straight Lines',
  'Cutting with Scissors — Curved Lines',
  'Cutting with Scissors — Shapes',
  'Food Prep — Spreading Butter on Bread',
  'Food Prep — Banana Cutting',
  'Table Setting — Full Place Setting',
  'Table Setting — Practice and Review',
  'Cloth Folding — Napkins',
  'Cloth Folding — Towels and Washcloths',
  'Cutting and Spreading — Cream Cheese on Crackers',
  'Food Prep — Celery and Peanut Butter',
  'Pouring — Review and Assessment',
  'Washing Fruit for Snack',
  'Folding Clothes — Shirts',
  'Making a Snack Plate',
  'Food Prep — Simple Sandwich Making',
  'Table Washing — Full Sequence',
  'Dressing Frames — Review All Types',
  'Setting Up and Cleaning a Work Space',
  'Practical Life Assessment — Independence Check',
  'Scrubbing Vegetables',
  'Dish Drying and Putting Away',
  'Rolling a Mat — Proper Technique',
  'Cutting Practice — Coupon Cutting',
  'Practical Life Choice Day',
  'Bread Preparation — Banana Bread Mixing',
  'Food Prep — Making Trail Mix',
]

const snTitlesQ2: string[] = [
  'Color Tablets — Box 2 Introduction (Pairs)',
  'Color Tablets — Box 2 (Grading)',
  'Constructive Triangles — Rectangular Box',
  'Constructive Triangles — Triangular Box',
  'Geometric Cabinet — Drawer 1 Exploration',
  'Geometric Cabinet — Drawer 2 Exploration',
  'Geometric Cabinet — Matching Cards',
  'Binomial Cube — Visual Exploration',
  'Brown Stair & Red Rods — Combined Extension',
  'Color Tablets — Box 2 Grading Activity',
  'Sensorial Extensions — Building with Multiple Materials',
  'Knobbed Cylinders — Three Blocks Combined',
  'Geometric Solids — Sphere, Cube, Cylinder',
  'Mystery Bag — Geometric Solids',
  'Sensorial Review and Assessment',
  'Constructive Triangles — Extensions',
  'Color Tablets — Memory Game',
  'Geometric Cabinet — Drawing Around Insets',
]

// Q3 titles
const plTitlesQ3: string[] = [
  'Plant Care — Watering Indoor Plants',
  'Plant Care — Misting and Leaf Cleaning',
  'Sweeping — Using a Broom (small area)',
  'Sweeping — Full Room Sweep',
  'Dusting Shelves — Feather Duster',
  'Dusting — Damp Cloth Method',
  'Polishing Silver — Full Sequence',
  'Polishing Shoes — Introduction',
  'Grace and Courtesy — Greeting Visitors',
  'Grace and Courtesy — Saying Please and Thank You',
  'Grace and Courtesy — Interrupting Politely',
  'Grace and Courtesy — Walking in a Line',
  'Grace and Courtesy — Table Manners',
  'Grace and Courtesy — Sharing and Taking Turns',
  'Gardening — Planting Seeds Outdoors',
  'Gardening — Weeding and Tending',
  'Window Washing — Spray and Squeegee',
  'Mirror Polishing',
  'Practical Life — Packing a Bag',
  'Practical Life — Tying a Bow (introduction)',
  'Caring for a Pet (discussion and role-play)',
  'Practical Life Choice Work',
  'Care of Environment — Wiping Spills',
  'Care of Environment — Recycling Sort',
  'Practical Life Review — Q3 Skills Check',
  'Sweeping and Mopping — Combined',
  'Food Prep — Peeling Carrots',
]

const snTitlesQ3: string[] = [
  'Sound Cylinders — Matching Pairs',
  'Sound Cylinders — Grading (soft to loud)',
  'Fabric Matching — Texture Pairs',
  'Fabric Matching — Blindfold',
  'Thermic Tablets — Warm and Cool',
  'Thermic Tablets — Grading',
  'Baric Tablets — Heavy, Medium, Light',
  'Binomial Cube — Pattern Building',
  'Binomial Cube — Independent Work',
  'Trinomial Cube — Introduction',
  'Trinomial Cube — Building Practice',
  'Mystery Bag — Common Objects',
  'Mystery Bag — Geometric Solids Review',
  'Sensorial Extensions — Outdoor Exploration',
  'Sensorial Review — All Materials',
  'Knobbed Cylinders — All Four Blocks',
  'Color Tablets — Box 2 Assessment',
  'Sensorial Choice Day',
]

// Q4 titles
const plTitlesQ4: string[] = [
  'Advanced Food Prep — Fruit Salad',
  'Advanced Food Prep — Vegetable Soup Prep',
  'Sewing — Threading a Needle',
  'Sewing — Running Stitch on Burlap',
  'Sewing — Button Sewing',
  'Sewing — Simple Cross Stitch',
  'Mixed Review — Pouring and Transferring',
  'Mixed Review — Dressing Frames',
  'Mixed Review — Food Preparation',
  'Mixed Review — Care of Environment',
  'Independent Work Choice — Practical Life',
  'Independent Work Choice — Practical Life',
  'Cooking Project — Making Butter',
  'Cooking Project — Making Lemonade',
  'Flower Arranging — Advanced',
  'Dishwashing — Complete Sequence',
  'Ironing (with supervision) — Introduction',
  'Hand Washing Clothes — Small Items',
  'Setting the Table for a Party',
  'Gift Wrapping — Introduction',
  'Practical Life Mastery Assessment',
  'Practical Life Choice Work',
  'Year-End Kitchen Skills Review',
  'Year-End Care of Self Review',
  'Year-End Practical Life Celebration',
  'Practical Life Portfolio Compilation',
  'Practical Life Skills Show',
]

const snTitlesQ4: string[] = [
  'Trinomial Cube — Independent Work',
  'Trinomial Cube — Extensions',
  'Geometric Solids — Full Set Exploration',
  'Geometric Solids — Matching to Bases',
  'Geometric Solids — Real-World Matching',
  'Mystery Bag — Advanced (complex objects)',
  'Mystery Bag — Alphabet Letters',
  'Constructive Triangles — All Boxes',
  'Sensorial Superimposed Figures',
  'Color Tablets — Box 3 Introduction (Grading)',
  'Color Tablets — Box 3 Practice',
  'Knobbed Cylinders — Independent Mastery',
  'Sensorial Extensions — Outdoor Scavenger Hunt',
  'Sensorial Skills Assessment',
  'Sensorial Choice Day',
  'Sensorial Materials — Year-End Review',
  'Sensorial Portfolio — Favorite Works',
  'Sensorial Celebration Day',
]

// ─── Language Arts ──────────────────────────────────────────────────────────────

const laTitlesQ1: Record<number, string[]> = {
  4: [
    'Sandpaper Letters — r and Review',
    'I Spy — Ending Sounds',
    'Word Building — CVC with r words (rat, ram)',
    'Metal Insets — Pentagon',
    'Oral Language — Describing Pictures',
  ],
  5: [
    'Sandpaper Letters — b and Review',
    'Rhyming — Introduction (cat, hat, mat)',
    'Word Building — Expanding Vocabulary',
    'Metal Insets — Curvilinear Triangle',
    'Oral Language — Storytelling with Pictures',
  ],
  6: [
    'Sandpaper Letters — i (short vowel)',
    'I Spy — Medial Vowel Sounds',
    'Word Building — CVC with short i (sit, bit, tip)',
    'Metal Insets — Ellipse',
    'Rhyming Games — Matching Rhyme Cards',
  ],
  7: [
    'Sandpaper Letters — n and g (hard)',
    'Word Building — More CVC Words',
    'Beginning Reading — Matching Objects to Words',
    'Metal Insets — Trapezoid',
    'Oral Language — Show and Tell Practice',
  ],
  8: [
    'Sandpaper Letters — d and o (short vowel)',
    'Word Building — CVC with short o (dot, got, mop)',
    'Reading CVC Words — Object-to-Word Matching',
    'Metal Insets — Quatrefoil',
    'Rhyming — Generating Rhymes',
  ],
  9: [
    'Sandpaper Letters — Review All Learned Letters',
    'Word Building — Independent CVC Construction',
    'Reading — Simple CVC Word Lists',
    'Metal Insets — Free Choice Design',
    'Language Arts Assessment — Sounds and Words',
  ],
}

const laTitlesQ2: string[] = [
  'Sandpaper Letters — h and Review',
  'Sandpaper Letters — e (short vowel)',
  'Word Building — CVC with short e (bed, pet, hen)',
  'Moveable Alphabet — Building Phrases (the cat)',
  'CVC Word Reading — Pink Series List 1',
  'Sandpaper Letters — l and Review',
  'Word Building — CVCC Words Introduction (lamp)',
  'Rhyming — Word Families (-at, -an, -ig)',
  'CVC Reading — Pink Series List 2',
  'Metal Insets — Complex Overlapping Designs',
  'Sandpaper Letters — u (short vowel) and Review',
  'Word Building — All 5 Short Vowels',
  'CVC Reading — Pink Series List 3',
  'Sandpaper Letters — f, k, and Review',
  'Word Building — Expanded Word Families',
  'Rhyming — Rhyme Production Games',
  'CVC Reading — Pink Series List 4',
  'Metal Insets — Independent Practice',
  'Sandpaper Letters — j, w, and Review',
  'Word Building — Pink Series Objects and Labels',
  'CVC Reading — Pink Series Booklets',
  'Sandpaper Letters — v, x, y, z Review',
  'All Sandpaper Letters — Assessment',
  'Phonogram Introduction — sh',
  'Phonogram — ch',
  'Phonogram — th',
  'Phonogram Review — sh, ch, th',
  'Moveable Alphabet — Sentences',
  'Reading — Pink Series Phrases',
  'Metal Insets — Speed and Precision',
  'CVC Reading — Assessment',
  'Pink Series — Puzzle Words (the, is, a)',
  'Writing Practice — Name Writing',
  'Writing — CVC Words on Paper',
  'Language Arts Q2 Review',
  'Language Arts Q2 Assessment',
  'Read-Aloud Discussion — Retelling Practice',
  'Oral Language — Complete Sentences',
  'Dictation — Simple CVC Words',
  'Language Arts — Choice Work Day',
  'Phonemic Awareness — Segmenting Words',
  'Phonemic Awareness — Blending Practice',
  'Encoding Practice — Building New Words',
  'Decoding Practice — Reading New Words',
  'Language Portfolio — Progress Check',
]

const laTitlesQ3: string[] = [
  'Pink Series — Reading Sentences',
  'Pink Series — Action Cards',
  'Pink Series — Story Booklets',
  'Pink Series — Mastery Assessment',
  'Blue Series Introduction — Consonant Blends (bl, cl)',
  'Blue Series — Blends (br, cr, dr)',
  'Blue Series — Blends (fl, fr, gl, gr)',
  'Blue Series — Blends (pl, pr, sl, sm)',
  'Blue Series — Blends (sn, sp, st, sw)',
  'Blue Series — Blends (tr, tw, sk, sc)',
  'Blue Series — Word Building with Blends',
  'Blue Series — Reading Blend Words',
  'Phonogram — ee and ea',
  'Phonogram — oo (long and short)',
  'Phonogram — ai and ay',
  'Phonogram — ou and ow',
  'Phonogram Review — All Introduced',
  'Reading — Simple Phrases with Phonograms',
  'Writing — Phonogram Dictation',
  'Moveable Alphabet — Story Building',
  'Blue Series — Booklet Reading',
  'Blue Series — Sentence Strips',
  'Grammar Introduction — Naming Words (Nouns)',
  'Grammar — Action Words (Verbs)',
  'Handwriting — Letter Formation a-m',
  'Handwriting — Letter Formation n-z',
  'Handwriting — Words and Short Phrases',
  'Journal Writing — Draw and Describe',
  'Journal Writing — Simple Sentences',
  'Reading — Leveled Reader Books 1',
  'Reading — Leveled Reader Books 2',
  'Blue Series Assessment',
  'Phonogram — ar and or',
  'Phonogram — er, ir, ur',
  'Writing — Journal Free Write',
  'Reading Fluency Practice',
  'Language Arts Q3 Review',
  'Oral Presentation — Share a Favorite Book',
  'Encoding Assessment — Dictation Test',
  'Decoding Assessment — Reading Check',
  'Language Arts Q3 Assessment',
  'Creative Writing — My Favorite Thing',
  'Poetry — Learning a Simple Poem',
  'Language Arts Choice Day',
  'Phonemic Awareness — Advanced Segmenting',
]

const laTitlesQ4: string[] = [
  'Green Series Introduction — Long Vowel Patterns',
  'Green Series — Silent e Words (a_e)',
  'Green Series — Silent e Words (i_e, o_e)',
  'Green Series — Silent e Words (u_e, e_e)',
  'Green Series — Word Building',
  'Green Series — Reading Practice',
  'Green Series — Booklets',
  'Advanced Phonograms — igh, tion',
  'Advanced Phonograms — Review',
  'Reading — Simple Chapter Book (read-aloud with follow-along)',
  'Reading — Independent Book Selection',
  'Writing — Friendly Letter',
  'Writing — Story with Beginning, Middle, End',
  'Grammar — Noun and Verb Sorting',
  'Grammar — Adjectives Introduction',
  'Journal Writing — Weekly Reflections',
  'Spelling — CVC Word Mastery',
  'Spelling — Blend Word Practice',
  'Reading Fluency — Timed Passages',
  'Handwriting — Full Alphabet Review',
  'Handwriting — Writing Complete Sentences',
  'Creative Writing — If I Were an Animal...',
  'Poetry — Writing a Simple Rhyming Poem',
  'Author Study — Favorite Author Discussion',
  'Reading Comprehension — Who, What, Where',
  'Reading — Independent Reading Time',
  'Writing — My Year in Review',
  'Phonogram Assessment — All Learned',
  'Green Series Assessment',
  'Reading Level Assessment',
  'Writing Portfolio — Best Work Selection',
  'Oral Presentation — Reading Aloud to Family',
  'Language Arts Year-End Assessment',
  'Language Arts Celebration — Sharing Work',
  'Reading — Summer Reading Plan',
  'Language Arts — Choice Work Day',
  'Language Arts — Year in Review',
  'Language Arts Portfolio Compilation',
  'Letter Writing — Thank You Notes',
  'Journal — Favorite Memories',
  'Reading — Buddy Reading Practice',
  'Writing — Free Choice Topic',
  'Phonics Review — Games and Activities',
  'Language Arts — Final Celebration',
  'Language Arts — Summer Skill Maintenance Plan',
]

// ─── Math ───────────────────────────────────────────────────────────────────────

const maTitlesQ1: Record<number, string[]> = {
  4: [
    'Number Rod Combinations — Making 5',
    'Sandpaper Numeral Writing in Sand Tray',
    'Counting Objects — One-to-One Correspondence',
    'Missing Number Game (1-10)',
    'Review: Number Rods, Numerals, and Spindle Box',
  ],
  5: [
    'Memory Game of Numbers — Introduction',
    'Counting Collections — Sets to 10',
    'Number Sequencing — What Comes After?',
    'Comparing Quantities — More, Less, Same',
    'Math Assessment — Counting and Numeral Recognition',
  ],
  6: [
    'Golden Beads — Introduction to Units',
    'Golden Beads — Ten Bar Introduction',
    'Golden Beads — Hundred Square Introduction',
    'Golden Beads — Thousand Cube Introduction',
    'Golden Beads — Building Numbers to 9,999',
  ],
  7: [
    'Golden Beads — Quantity and Symbol Matching',
    'Golden Beads — Large Number Cards (1-9000)',
    'Golden Beads — Composing 4-Digit Numbers',
    'Number Cards — Sequencing 1-100 (tens)',
    'Review: Golden Beads and Number Recognition',
  ],
  8: [
    'Golden Beads — Exchange Game (10 units = 1 ten)',
    'Golden Beads — Exchange (10 tens = 1 hundred)',
    'Linear Counting — Counting to 20',
    'Linear Counting — Counting to 30',
    'Math Review — All Concepts to Date',
  ],
  9: [
    'Linear Counting — Hundred Chain Introduction',
    'Skip Counting by 2s (with beads)',
    'Skip Counting by 5s (with beads)',
    'Skip Counting by 10s',
    'Math Q1 Assessment',
  ],
}

const maTitlesQ2: string[] = [
  'Teen Board — Introduction (11-13)',
  'Teen Board — Numbers 14-16',
  'Teen Board — Numbers 17-19',
  'Teen Board — Full Review 11-19',
  'Ten Board — Introduction (10-50)',
  'Ten Board — Numbers 60-90',
  'Ten Board — Full Review 10-90',
  'Linear Counting — Skip Count by 2s to 20',
  'Linear Counting — Skip Count by 5s to 50',
  'Linear Counting — Skip Count by 10s to 100',
  'Golden Beads — Static Addition (no exchanging)',
  'Golden Beads — Static Addition Practice',
  'Golden Beads — Dynamic Addition (with exchanging)',
  'Golden Beads — Dynamic Addition Practice',
  'Addition Strip Board — Introduction',
  'Addition Strip Board — Sums to 5',
  'Addition Strip Board — Sums to 10',
  'Addition Strip Board — Practice',
  'Number Line — Addition with Jumps',
  'Numeral Writing — 1-10 on Paper',
  'Numeral Writing — 11-20 on Paper',
  'Counting — Backward from 10',
  'Counting — Backward from 20',
  'Measurement — Comparing Lengths',
  'Measurement — Non-Standard Units (hands, blocks)',
  'Patterns — AB and ABB Patterns',
  'Patterns — ABC and AABB Patterns',
  'Shapes — Circle, Square, Triangle Review',
  'Shapes — Rectangle, Oval, Diamond',
  'Sorting and Graphing — Favorite Fruit',
  'Sorting and Graphing — Color Sort',
  'Math Games — Number Bingo',
  'Math Review — Teen and Ten Boards',
  'Math Review — Addition Concepts',
  'Golden Beads — Subtraction Introduction (static)',
  'Golden Beads — Subtraction Practice',
  'Math Q2 Assessment',
  'Math Choice Work Day',
  'Story Problems — Addition Oral',
  'Story Problems — Subtraction Oral',
  'Calendar Math — Days and Months',
  'Calendar Math — Seasons Review',
  'Money — Identifying Coins (penny, nickel)',
  'Money — Identifying Coins (dime, quarter)',
  'Math Q2 Review and Assessment',
]

const maTitlesQ3: string[] = [
  'Subtraction Strip Board — Introduction',
  'Subtraction Strip Board — Practice (within 10)',
  'Subtraction Strip Board — Extended Practice',
  'Golden Beads — Dynamic Subtraction',
  'Golden Beads — Multiplication Introduction (groups of)',
  'Golden Beads — Multiplication with Beads',
  'Linear Counting — Chain of 100',
  'Linear Counting — Counting to 100',
  'Linear Counting — Chain of 1000 (introduction)',
  'Number Writing — 1-50',
  'Number Writing — 51-100',
  'Addition Facts — Doubles (1+1, 2+2, etc.)',
  'Addition Facts — Near Doubles',
  'Addition Facts — Making 10',
  'Subtraction Facts — Within 5',
  'Subtraction Facts — Within 10',
  'Word Problems — Addition Stories',
  'Word Problems — Subtraction Stories',
  'Measurement — Standard Units (ruler introduction)',
  'Measurement — Measuring in Inches',
  'Time — Clock Introduction (hour hand)',
  'Time — O\'clock Times',
  'Time — Half-Past Introduction',
  'Money — Counting Pennies and Nickels',
  'Money — Counting with Dimes',
  'Fractions — Halves (concrete with circle)',
  'Fractions — Fourths (concrete with circle)',
  'Patterns — Growing Patterns',
  'Graphing — Bar Graphs',
  'Graphing — Pictographs',
  'Place Value — Tens and Ones with Beads',
  'Place Value — Writing Tens and Ones',
  'Number Bonds — Combinations to 10',
  'Number Bonds — Practice',
  'Math Games — Addition War',
  'Math Games — Subtraction Bingo',
  'Golden Beads — Division Introduction (sharing equally)',
  'Golden Beads — Division Practice',
  'Math Q3 Review',
  'Skip Counting Review — 2s, 5s, 10s',
  'Math Q3 Assessment',
  'Math Choice Work Day',
  'Geometry — Identifying 3D Shapes',
  'Geometry — Faces, Edges, Vertices',
  'Math Facts Speed Practice',
]

const maTitlesQ4: string[] = [
  'Addition Facts — Fluency to 10',
  'Addition Facts — Sums to 18',
  'Subtraction Facts — Fluency to 10',
  'Subtraction Facts — Differences within 18',
  'Golden Beads — 4-Digit Addition',
  'Golden Beads — 4-Digit Subtraction',
  'Stamp Game — Introduction',
  'Stamp Game — Addition',
  'Stamp Game — Subtraction',
  'Money — Making Change (simple)',
  'Money — Story Problems with Coins',
  'Time — Hour and Half Hour Review',
  'Time — Quarter Hours Introduction',
  'Measurement — Comparing Weights',
  'Measurement — Comparing Capacity',
  'Fractions — Thirds (concrete)',
  'Fractions — Halves, Thirds, Fourths Review',
  'Word Problems — Mixed Operations',
  'Word Problems — Multi-Step Introduction',
  'Graphing — Collecting and Displaying Data',
  'Patterns — Complex Repeating Patterns',
  'Place Value — Hundreds Introduction',
  'Place Value — Expanded Form',
  'Number Lines — Jumping Forward and Back',
  'Math Games — Board Game Review',
  'Math Fact Assessment — Addition',
  'Math Fact Assessment — Subtraction',
  'Golden Beads — Multiplication Review',
  'Golden Beads — Division Review',
  'Geometry — Symmetry Introduction',
  'Geometry — Tessellation Exploration',
  'Math Problem Solving — Strategy Practice',
  'Math Review — Operations',
  'Math Review — Measurement and Money',
  'Math Review — Geometry and Fractions',
  'Math Year-End Assessment',
  'Math Portfolio Compilation',
  'Math Celebration — Favorite Activities',
  'Math Choice Work Day',
  'Math — Summer Practice Plan',
  'Math Games Day',
  'Math Facts — Final Fluency Check',
  'Math — Year in Review',
  'Math — Independent Work Showcase',
  'Math — Final Celebration',
]

// ─── Culture / Science / Geography (alternating, slot 4) ───────────────────────

const cultureTitlesQ1: Record<number, string[]> = {
  4: [
    'Nature Walk — Fall Observations',
    'Weather Chart — Introduction',
    'Living vs. Non-Living Review',
    'Continent Song and Globe Review',
    'Land Forms — Cape and Bay',
  ],
  5: [
    'Parts of a Leaf — Shapes and Edges',
    'Weather Chart — Recording Daily Weather',
    'Fall Season — Changes in Nature',
    'Map Skills — Our Neighborhood',
    'Animal vs. Plant — Differences',
  ],
  6: [
    'Vertebrate Introduction — Animals with Backbones',
    'Five Classes of Vertebrates — Overview',
    'Fish — Characteristics and Habitat',
    'Globe Review — Oceans of the World',
    'Simple Experiment — Magnet Exploration',
  ],
  7: [
    'Amphibians — Characteristics and Life Cycle',
    'Reptiles — Characteristics',
    'Puzzle Map — South America',
    'Weather Patterns — Cloud Types',
    'Simple Experiment — Mixing Colors',
  ],
  8: [
    'Birds — Characteristics and Adaptations',
    'Mammals — Characteristics',
    'Puzzle Map — Europe',
    'Seasons — Why Do Seasons Change?',
    'Simple Experiment — Dissolving (sugar, salt, sand)',
  ],
  9: [
    'Animal Classification Review — Sorting Activity',
    'Invertebrate Introduction',
    'Puzzle Map — Asia',
    'Culture Review — Continents and Land Forms',
    'Science Review — Plants and Animals',
  ],
}

const cultureTitlesQ2: string[] = [
  'Seasons — Winter Characteristics',
  'Weather Chart — Winter Patterns',
  'Parts of a Flower — Dissection',
  'Seed Germination — Continued Observations',
  'Simple Experiment — Ice Melting',
  'Globe Review — Lines on the Globe (equator)',
  'North America — Countries Deep Dive',
  'Continent Animals — North America',
  'Simple Machines — Ramp Introduction',
  'Simple Machines — Lever',
  'Plant Growth — Bean Plant Journal',
  'Animal Habitats — Forest',
  'Animal Habitats — Ocean',
  'Animal Habitats — Desert',
  'Puzzle Map — Africa',
  'Continent Animals — Africa',
  'Simple Experiment — Static Electricity',
  'Simple Experiment — Balloon Rocket',
  'Food Groups — Healthy Eating',
  'Human Body — The Five Senses Review',
  'Puzzle Map — Australia/Oceania',
  'Cultural Celebration — Chinese New Year or Relevant Holiday',
  'Weather — Severe Weather Safety',
  'Nature Walk — Signs of Spring',
  'Plant Cycle Review — Seed to Plant',
  'Science Review — Experiments Recap',
  'Geography Review — All Puzzle Maps',
  'Culture Q2 Assessment',
  'Earth Day — Caring for Our Planet',
  'Recycling and Composting',
  'Water Cycle — Simple Introduction',
  'Continent Animals — South America',
  'Simple Experiment — Growing Crystals',
  'Map Skills — Compass Rose (N, S, E, W)',
  'Cultural Studies — Homes Around the World',
  'Human Body — Skeleton Introduction',
  'Nature Walk — Spring Observations',
  'Animal Babies — Matching Mothers and Young',
  'Cultural Studies — Foods from Different Countries',
  'Science and Culture Choice Day',
  'Geography — Rivers and Mountains Introduction',
  'Science — Sound Vibrations Experiment',
  'Cultural Studies — Clothing Around the World',
  'Nature Observation — Bird Watching',
  'Culture/Science Q2 Review',
]

const cultureTitlesQ3: string[] = [
  'Animal Classification — Insects',
  'Insect Parts — Head, Thorax, Abdomen',
  'Insect Life Cycles — Butterfly',
  'Insect Life Cycles — Ladybug',
  'Puzzle Map — Antarctica',
  'Continent Animals — Antarctica (penguins)',
  'Simple Experiment — Density (oil and water)',
  'Simple Experiment — Volcano (baking soda and vinegar)',
  'Life Cycle — Frog',
  'Life Cycle — Chicken',
  'Puzzle Map — World Review',
  'Famous Person — Jane Goodall',
  'Famous Person — Maria Montessori',
  'Simple Machines — Wheel and Axle',
  'Simple Machines — Pulley',
  'Animal Groups Review — Sorting Game',
  'Plant Parts Review — Root, Stem, Leaf, Flower, Fruit, Seed',
  'Continent Animals — Europe',
  'Continent Animals — Asia',
  'Human Body — Heart and Blood',
  'Human Body — Lungs and Breathing',
  'Rocks and Minerals — Collection and Sorting',
  'Fossils — Introduction',
  'Ocean Zones — Introduction',
  'Ocean Animals — Classification',
  'Nature Walk — Summer Observations',
  'Habitat Diorama — Planning',
  'Habitat Diorama — Building',
  'Geography Review — Land and Water Forms',
  'Science Review — Life Cycles',
  'Cultural Studies — Musical Instruments Around the World',
  'Cultural Studies — Art from Different Cultures',
  'Simple Experiment — Plant Needs (light experiment)',
  'Simple Experiment — Magnetic vs. Non-Magnetic',
  'Science and Geography Q3 Assessment',
  'Cultural Studies — Folktales from Africa',
  'Cultural Studies — Folktales from Asia',
  'Nature Journal — Season Comparison',
  'Conservation — Endangered Animals',
  'Map Skills — Reading a Simple Map',
  'Culture/Science Q3 Review',
  'Famous Person — George Washington Carver',
  'Science Choice Day',
  'Cultural Celebration — Relevant Holiday',
  'Geography and Science Choice Day',
]

const cultureTitlesQ4: string[] = [
  'Life Cycle — Plant (complete cycle)',
  'Life Cycle — Mammal (dog or cat)',
  'Life Cycle Review — Comparison Chart',
  'Simple Machines — Screw and Wedge',
  'Simple Machines — Review All Six',
  'Famous Person — Albert Einstein (simple intro)',
  'Famous Person — Wangari Maathai',
  'Cultural Celebration — Earth Day Projects',
  'Cultural Studies — Families Around the World',
  'Cultural Studies — Schools Around the World',
  'Puzzle Map — Complete World Review',
  'Continent Project — Choose a Continent',
  'Continent Project — Research and Drawing',
  'Continent Project — Presentation',
  'Human Body — Muscles and Movement',
  'Human Body — Nutrition and Growth',
  'Science Experiment — Evaporation',
  'Science Experiment — Condensation',
  'Water Cycle Review — Complete Cycle',
  'Animal Adaptations — Camouflage',
  'Animal Adaptations — Migration',
  'Nature Walk — End of Year Observations',
  'Nature Journal — Year Comparison',
  'Map Skills — Making a Map of Our Home',
  'Map Skills — Making a Map of Our Neighborhood',
  'Geography Year-End Review',
  'Science Year-End Review',
  'Cultural Studies Year-End Review',
  'Science Fair — Choose a Topic',
  'Science Fair — Simple Experiment',
  'Science Fair — Present Results',
  'Cultural Celebration — End of Year',
  'Nature Shelf — Year in Review',
  'Conservation — What Can We Do?',
  'Culture/Science/Geography Assessment',
  'Year-End Nature Walk',
  'Cultural Studies Portfolio',
  'Science Portfolio Compilation',
  'Geography Portfolio Compilation',
  'Culture/Science/Geography Celebration',
  'Summer Nature Challenge Planning',
  'Favorite Science Experiment — Repeat',
  'Favorite Geography Lesson — Repeat',
  'Year-End Review and Reflection',
  'Final Culture/Science/Geography Day',
]

// ─── Read-Aloud / Art & Music (alternating, slot 5) ────────────────────────────

const ramTitlesQ1: Record<number, string[]> = {
  4: [
    'Read-Aloud: Chicka Chicka Boom Boom',
    'Painting — Finger Painting Exploration',
    'Nursery Rhymes — Itsy Bitsy Spider & Twinkle Twinkle',
    'Playdough Sculpting — Free Form',
    'Read-Aloud: Where the Wild Things Are',
  ],
  5: [
    'Singing — The Wheels on the Bus',
    'Read-Aloud: Corduroy',
    'Drawing — Shapes and Patterns',
    'Nursery Rhymes — Baa Baa Black Sheep & Mary Had a Little Lamb',
    'Painting — Color Mixing Exploration',
  ],
  6: [
    'Read-Aloud: The Snowy Day',
    'Music — Fast and Slow Tempo',
    'Read-Aloud: Strega Nona',
    'Clay Work — Pinch Pot',
    'Folk Music — Instruments of the Orchestra Introduction',
  ],
  7: [
    'Read-Aloud: Owl Moon',
    'Art — Printmaking with Found Objects',
    'Read-Aloud: Sylvester and the Magic Pebble',
    'Music — Rhythm Sticks and Patterns',
    'Seasonal Art — Nature Collage',
  ],
  8: [
    'Read-Aloud: Alexander and the Terrible, Horrible, No Good, Very Bad Day',
    'Art — Watercolor Resist (crayon and paint)',
    'Read-Aloud: Miss Nelson is Missing',
    'Music — Singing in Rounds (simple)',
    'Art — Paper Weaving',
  ],
  9: [
    'Read-Aloud: Chrysanthemum',
    'Art — Symmetry Painting (fold and press)',
    'Read-Aloud: Q1 Favorite Re-read',
    'Music — Instrument Exploration Day',
    'Art — Portfolio Review and Favorites',
  ],
}

const ramTitlesQ2: string[] = [
  'Read-Aloud: Stone Soup',
  'Art — Printing with Vegetables',
  'Read-Aloud: The Mitten by Jan Brett',
  'Music — Rhythm and Beat Patterns',
  'Read-Aloud: Madeline',
  'Art — Winter Scene Painting',
  'Folk Tale: The Three Billy Goats Gruff',
  'Music — Dynamics Review (piano and forte)',
  'Read-Aloud: Cloudy With a Chance of Meatballs',
  'Art — Tissue Paper Stained Glass',
  'Poetry — Robert Louis Stevenson (My Shadow)',
  'Music Appreciation — Mozart for Children',
  'Read-Aloud: The Story of Ferdinand',
  'Art — Crayon Etching',
  'Read-Aloud: Mike Mulligan and His Steam Shovel',
  'Music — Singing Folk Songs',
  'Poetry — Shel Silverstein Selection',
  'Art — Paper Plate Masks',
  'Read-Aloud: Harold and the Purple Crayon',
  'Music — Body Percussion',
  'Read-Aloud: Stellaluna',
  'Art — Sponge Painting',
  'Folk Tale: The Tortoise and the Hare',
  'Music — Tempo Games (fast/slow)',
  'Read-Aloud: Officer Buckle and Gloria',
  'Art — Origami — Simple Folds',
  'Poetry — Jack Prelutsky Selection',
  'Music — Pentatonic Scale Exploration',
  'Read-Aloud: Knuffle Bunny',
  'Art — Mixed Media Collage',
  'Read-Aloud: Enemy Pie',
  'Music — Listening and Drawing',
  'Art — Dot Painting (Aboriginal inspired)',
  'Read-Aloud: The Giving Tree',
  'Music — Instrument Families Introduction',
  'Art — Spring Flowers Painting',
  'Poetry — Emily Dickinson (simple selection)',
  'Music — Creating Sound Effects for a Story',
  'Read-Aloud: Ira Sleeps Over',
  'Art — Craft: Paper Butterflies',
  'Read-Aloud: Q2 Favorite Re-read',
  'Music — Q2 Song Review',
  'Art — Q2 Portfolio Review',
  'Read-Aloud and Art Choice Day',
  'Music and Movement — Free Dance',
]

const ramTitlesQ3: string[] = [
  'Chapter Book Read-Aloud: Charlotte\'s Web Ch. 1-2',
  'Art — Observational Drawing (still life)',
  'Charlotte\'s Web — Ch. 3-4 Discussion',
  'Music — Major and Minor (happy/sad sounds)',
  'Charlotte\'s Web — Ch. 5-6',
  'Art — Clay Animals',
  'Charlotte\'s Web — Ch. 7-8',
  'Singing — Partner Songs',
  'Charlotte\'s Web — Ch. 9-10',
  'Art — Watercolor Landscape',
  'Charlotte\'s Web — Ch. 11-12',
  'Music Appreciation — Beethoven',
  'Charlotte\'s Web — Ch. 13-15',
  'Art — Weaving on a Cardboard Loom',
  'Charlotte\'s Web — Ch. 16-18',
  'Music — Ostinato Patterns',
  'Charlotte\'s Web — Ch. 19-22 (conclusion)',
  'Art — Illustrate Your Favorite Scene',
  'Charlotte\'s Web — Book Discussion and Review',
  'Music — Composing Simple Rhythms',
  'Read-Aloud: New Picture Book Selection',
  'Art — Mixed Media Sculpture',
  'Singing — Songs from Different Countries',
  'Music — Timbre (same note, different instruments)',
  'Read-Aloud: Biographical Picture Book',
  'Art — Self-Portrait Revisit (mid-year comparison)',
  'Poetry — Writing Simple Poems',
  'Music — Rhythm Dictation',
  'Read-Aloud: Science-Related Picture Book',
  'Art — Nature Print Making',
  'Read-Aloud: Math-Related Picture Book',
  'Music — Musical Storytelling',
  'Art — Collaborative Mural Project',
  'Read-Aloud: Cultural Folktale',
  'Music — Performance Practice',
  'Art — Architecture Drawing',
  'Poetry — Haiku Introduction',
  'Music — Listening Journal',
  'Read-Aloud: Chapter Book Selection 2 (start)',
  'Art — Portfolio Midyear Review',
  'Read-Aloud: Q3 Favorite Re-read',
  'Music — Q3 Song Review',
  'Art — Q3 Best Work Selection',
  'Music and Movement Day',
  'Read-Aloud and Art Choice Day',
]

const ramTitlesQ4: string[] = [
  'Author Study — Eric Carle Overview',
  'Art — Eric Carle Style Tissue Paper Art',
  'Author Study — Eric Carle Favorites',
  'Music — Performance Prep Song 1',
  'Author Study — Mo Willems',
  'Art — Drawing Pigeon (Mo Willems style)',
  'Author Study — Kevin Henkes',
  'Music — Performance Prep Song 2',
  'Read-Aloud: Student Choice Book',
  'Art — Portfolio: Select Best Work',
  'Read-Aloud: Poetry Collection',
  'Music — Performance Prep Song 3',
  'Read-Aloud: Non-Fiction Picture Book',
  'Art — Sculpture with Recycled Materials',
  'Read-Aloud: Wordless Picture Book Storytelling',
  'Music — Dress Rehearsal',
  'Read-Aloud: Fairy Tale Collection',
  'Art — Fairy Tale Illustration',
  'Music — Performance Day!',
  'Art — Performance Backdrop Creation',
  'Read-Aloud: Student Reads to Parent',
  'Art — Watercolor Final Project',
  'Read-Aloud: Looking Back — Year of Books',
  'Music — Year of Music Review',
  'Read-Aloud: Student Choice',
  'Art — Year-End Self-Portrait',
  'Read-Aloud: Final Chapter Book Read-Aloud',
  'Music — Favorite Songs Concert',
  'Art — Portfolio Assembly',
  'Read-Aloud: Thank You and Goodbye Books',
  'Art — Year-End Art Show Setup',
  'Music — Year-End Music Celebration',
  'Read-Aloud: Summer Reading List Planning',
  'Art — Art Show!',
  'Read-Aloud and Music — Year-End Celebration',
  'Art — Final Portfolio Review',
  'Music — Certificate of Completion',
  'Read-Aloud — Favorite Book Re-read',
  'Art and Music Choice Day',
  'Year-End Read-Aloud Celebration',
  'Art — Clean and Organize Art Supplies',
  'Music — Instrument Care and Storage',
  'Read-Aloud — Student Choice Marathon',
  'Final Art and Music Day',
  'Year-End Celebration — All Arts',
]

// ─── Subject name lookups for each slot ─────────────────────────────────────────

// Slot 1 alternates PL (Mon, Wed, Fri) and SN (Tue, Thu)
function slot1Subject(day: number): string {
  return day === 2 || day === 4 ? 'sensorial' : 'practical_life'
}

// Slot 4 alternates: day 1,4 = geography/culture, day 2,5 = science, day 3 = culture
function slot4Subject(day: number): string {
  if (day === 1 || day === 4) return 'geography'
  if (day === 2 || day === 5) return 'science'
  return 'culture'
}
// Actually let's keep it simpler — rotate through geography, science, culture
function slot4SubjectSimple(day: number): string {
  const map: Record<number, string> = {
    1: 'geography',
    2: 'science',
    3: 'culture',
    4: 'science',
    5: 'culture',
  }
  return map[day]
}

// Slot 5 alternates: odd days = read_aloud, even days = art_music
function slot5Subject(day: number): string {
  return day % 2 === 1 ? 'read_aloud' : 'art_music'
}

// ─── Build lessons for one week ─────────────────────────────────────────────────

function makeSlides(title: string, materials: string[]): object {
  const parts = title.split(' — ')
  return {
    slides: [
      { type: 'title', heading: parts[0], subheading: parts[1] || '' },
      {
        type: 'materials',
        items: materials,
        setup_instructions: 'Gather all materials before beginning the lesson.',
      },
      { type: 'instruction', step: 1, text: 'Introduce the activity and demonstrate the key steps.' },
      { type: 'instruction', step: 2, text: 'Guide the child through the activity step by step.' },
      { type: 'instruction', step: 3, text: 'Allow the child to work independently while observing.' },
      { type: 'activity', prompt: 'Practice the activity. Can you do it independently?', duration_minutes: 10 },
      {
        type: 'wrap_up',
        text: 'Clean up materials and return them to the shelf. Discuss what was learned.',
        mastery_check: 'Can the child complete the activity with minimal assistance?',
      },
    ],
  }
}

function buildWeek(weekNum: number): Lesson[] {
  const q = quarter(weekNum)
  const includeSlides = q === 1

  // Pick titles from the pools
  const lessons: Lesson[] = []
  let sortOrder = 1

  for (let day = 1; day <= 5; day++) {
    // ── Slot 1: PL or SN ──
    const subj1 = slot1Subject(day)
    let slot1Title = ''
    const slot1Materials: string[] = []

    if (subj1 === 'practical_life') {
      const pool = q === 1 ? plTitlesQ1[weekNum] : q === 2 ? plTitlesQ2 : q === 3 ? plTitlesQ3 : plTitlesQ4
      if (Array.isArray(pool)) {
        const idx = (weekNum - (q === 1 ? 0 : q === 2 ? 10 : q === 3 ? 19 : 28)) * 3 + Math.floor((day - 1) / 2)
        slot1Title = pool[idx % pool.length]
      } else {
        const weekTitles = pool as unknown as string[]
        slot1Title = weekTitles[Math.floor((day - 1) / 2) % weekTitles.length]
      }
    } else {
      const pool = q === 1 ? snTitlesQ1[weekNum] : q === 2 ? snTitlesQ2 : q === 3 ? snTitlesQ3 : snTitlesQ4
      if (Array.isArray(pool)) {
        const idx = (weekNum - (q === 1 ? 0 : q === 2 ? 10 : q === 3 ? 19 : 28)) * 2 + Math.floor((day - 1) / 2)
        slot1Title = pool[idx % pool.length]
      } else {
        const weekTitles = pool as unknown as string[]
        slot1Title = weekTitles[Math.floor((day - 1) / 2) % weekTitles.length]
      }
    }

    lessons.push({
      level_name: 'primary',
      subject_name: subj1,
      week_number: weekNum,
      day_of_week: day,
      quarter: q,
      title: slot1Title,
      description: `${slot1Title} — Week ${weekNum}, Day ${day} activity for the ${subj1 === 'practical_life' ? 'Practical Life' : 'Sensorial'} curriculum area.`,
      instructions: `1. Prepare materials.\n2. Demonstrate the activity.\n3. Guide the child through the process.\n4. Allow independent practice.\n5. Clean up and return materials.`,
      duration_minutes: 30,
      lesson_type: subj1 === 'practical_life' ? 'guided' : day % 2 === 0 ? 'independent' : 'guided',
      materials_needed: [`Materials for ${slot1Title}`],
      slide_content: includeSlides ? makeSlides(slot1Title, [`Materials for ${slot1Title}`]) : null,
      parent_notes: `Follow the child's lead and allow repetition. This activity builds concentration, independence, and fine motor control.`,
      age_adaptations: null,
      sort_order: sortOrder++,
    })

    // ── Slot 2: Language ──
    const laPool = q === 1 ? laTitlesQ1[weekNum] : q === 2 ? laTitlesQ2 : q === 3 ? laTitlesQ3 : laTitlesQ4
    let laIdx: number
    if (q === 1) {
      const weekTitles = laPool as string[]
      laIdx = (day - 1) % weekTitles.length
    } else {
      const pool = laPool as string[]
      laIdx = ((weekNum - (q === 2 ? 10 : q === 3 ? 19 : 28)) * 5 + (day - 1)) % pool.length
    }
    const laTitle = (laPool as string[])[laIdx]

    lessons.push({
      level_name: 'primary',
      subject_name: 'language',
      week_number: weekNum,
      day_of_week: day,
      quarter: q,
      title: laTitle,
      description: `${laTitle} — Week ${weekNum}, Day ${day} Language Arts activity.`,
      instructions: `1. Review previously learned sounds/letters.\n2. Introduce new material.\n3. Practice with guided and independent activities.\n4. Extend learning through word building or reading.\n5. Review and celebrate progress.`,
      duration_minutes: 30,
      lesson_type: 'guided',
      materials_needed: [`Materials for ${laTitle}`],
      slide_content: includeSlides ? makeSlides(laTitle, [`Materials for ${laTitle}`]) : null,
      parent_notes: `Focus on sounds, not letter names. Let the child set the pace. Celebrate all attempts at word building and reading.`,
      age_adaptations: null,
      sort_order: sortOrder++,
    })

    // ── Slot 3: Math ──
    const maPool = q === 1 ? maTitlesQ1[weekNum] : q === 2 ? maTitlesQ2 : q === 3 ? maTitlesQ3 : maTitlesQ4
    let maIdx: number
    if (q === 1) {
      const weekTitles = maPool as string[]
      maIdx = (day - 1) % weekTitles.length
    } else {
      const pool = maPool as string[]
      maIdx = ((weekNum - (q === 2 ? 10 : q === 3 ? 19 : 28)) * 5 + (day - 1)) % pool.length
    }
    const maTitle = (maPool as string[])[maIdx]

    lessons.push({
      level_name: 'primary',
      subject_name: 'math',
      week_number: weekNum,
      day_of_week: day,
      quarter: q,
      title: maTitle,
      description: `${maTitle} — Week ${weekNum}, Day ${day} Mathematics activity.`,
      instructions: `1. Review previous concepts.\n2. Introduce new material using concrete manipulatives.\n3. Guide the child through examples.\n4. Provide independent practice.\n5. Verify understanding with questions or matching.`,
      duration_minutes: 30,
      lesson_type: 'guided',
      materials_needed: [`Materials for ${maTitle}`],
      slide_content: includeSlides ? makeSlides(maTitle, [`Materials for ${maTitle}`]) : null,
      parent_notes: `Always move from concrete to abstract. Use manipulatives first, then symbols. Let the child discover patterns through exploration.`,
      age_adaptations: null,
      sort_order: sortOrder++,
    })

    // ── Slot 4: Culture / Science / Geography ──
    const subj4 = slot4SubjectSimple(day)
    const csPool = q === 1 ? cultureTitlesQ1[weekNum] : q === 2 ? cultureTitlesQ2 : q === 3 ? cultureTitlesQ3 : cultureTitlesQ4
    let csIdx: number
    if (q === 1) {
      const weekTitles = csPool as string[]
      csIdx = (day - 1) % weekTitles.length
    } else {
      const pool = csPool as string[]
      csIdx = ((weekNum - (q === 2 ? 10 : q === 3 ? 19 : 28)) * 5 + (day - 1)) % pool.length
    }
    const csTitle = (csPool as string[])[csIdx]

    lessons.push({
      level_name: 'primary',
      subject_name: subj4,
      week_number: weekNum,
      day_of_week: day,
      quarter: q,
      title: csTitle,
      description: `${csTitle} — Week ${weekNum}, Day ${day} Cultural Studies / Science / Geography activity.`,
      instructions: `1. Connect to previous lessons on this topic.\n2. Introduce the new concept with concrete materials.\n3. Engage the child with hands-on exploration.\n4. Discuss observations and discoveries.\n5. Record learning through drawing, labeling, or discussion.`,
      duration_minutes: 20,
      lesson_type: day % 3 === 0 ? 'independent' : 'guided',
      materials_needed: [`Materials for ${csTitle}`],
      slide_content: includeSlides ? makeSlides(csTitle, [`Materials for ${csTitle}`]) : null,
      parent_notes: `Cultural studies foster wonder and curiosity about the world. Use real specimens, maps, and globes whenever possible. Follow the child's questions.`,
      age_adaptations: null,
      sort_order: sortOrder++,
    })

    // ── Slot 5: Read-Aloud / Art & Music ──
    const subj5 = slot5Subject(day)
    const ramPool = q === 1 ? ramTitlesQ1[weekNum] : q === 2 ? ramTitlesQ2 : q === 3 ? ramTitlesQ3 : ramTitlesQ4
    let ramIdx: number
    if (q === 1) {
      const weekTitles = ramPool as string[]
      ramIdx = (day - 1) % weekTitles.length
    } else {
      const pool = ramPool as string[]
      ramIdx = ((weekNum - (q === 2 ? 10 : q === 3 ? 19 : 28)) * 5 + (day - 1)) % pool.length
    }
    const ramTitle = (ramPool as string[])[ramIdx]

    lessons.push({
      level_name: 'primary',
      subject_name: subj5,
      week_number: weekNum,
      day_of_week: day,
      quarter: q,
      title: ramTitle,
      description: `${ramTitle} — Week ${weekNum}, Day ${day} ${subj5 === 'read_aloud' ? 'Read-Aloud' : 'Art & Music'} activity.`,
      instructions: subj5 === 'read_aloud'
        ? `1. Choose a comfortable reading spot.\n2. Show the cover and predict.\n3. Read aloud with expression.\n4. Pause for discussion and predictions.\n5. After reading, discuss characters, events, and connections.`
        : `1. Prepare the art/music workspace.\n2. Demonstrate the technique or introduce the piece.\n3. Allow the child to explore and create.\n4. Discuss the process and product.\n5. Display artwork or reflect on the musical experience.`,
      duration_minutes: 20,
      lesson_type: 'guided',
      materials_needed: [`Materials for ${ramTitle}`],
      slide_content: includeSlides ? makeSlides(ramTitle, [`Materials for ${ramTitle}`]) : null,
      parent_notes: subj5 === 'read_aloud'
        ? `Read with expression and warmth. Pause for the child's reactions. Re-read favorites as often as requested. Reading aloud is the single most important activity for literacy development.`
        : `Process over product! The goal is creative exploration, not perfection. Display all work to show it is valued. Music appreciation builds listening skills and emotional vocabulary.`,
      age_adaptations: null,
      sort_order: sortOrder++,
    })
  }

  return lessons
}

// ─── Main ───────────────────────────────────────────────────────────────────────

const outDir = join(__dirname, 'data', 'primary-lessons')

for (let w = 4; w <= 36; w++) {
  const lessons = buildWeek(w)
  const fileName = `week-${String(w).padStart(2, '0')}.json`
  const filePath = join(outDir, fileName)
  writeFileSync(filePath, JSON.stringify(lessons, null, 2), 'utf-8')
  console.log(`Generated ${filePath} (${lessons.length} lessons)`)
}

console.log('\nDone! Generated weeks 4-36.')
