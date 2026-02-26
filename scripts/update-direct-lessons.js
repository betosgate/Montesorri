#!/usr/bin/env node
/**
 * Update DIRECT-classified lessons with household substitutes and preparation steps.
 *
 * For each DIRECT lesson, adds:
 *   - conversion_type: "DIRECT"
 *   - household_substitutes: list of items from home
 *   - preparation_steps: what the parent does before the lesson
 *   - control_of_error: how the child self-checks
 *   - extension_ideas: 2-3 follow-up activities
 *
 * This is ADDITIVE — existing lesson content is NOT modified.
 * No mascot audio rebuild needed.
 *
 * Usage: node scripts/update-direct-lessons.js [--level primary]
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Household substitute mappings by subject/keyword
// ---------------------------------------------------------------------------

const SUBSTITUTE_RULES = [
  // Practical Life — Pouring
  {
    match: (t, m) => t.includes('pouring') && (t.includes('water') || m.includes('water')),
    substitutes: ['Two small pitchers or measuring cups', 'Baking sheet or tray to catch spills', 'Small sponge', 'Water', 'Towel'],
    prep: 'Fill one pitcher halfway with water. Place both on a tray. Have sponge and towel ready.',
    control: 'The child can see if water spilled on the tray. The sponge teaches self-correction.',
    extensions: ['Try pouring colored water to see it better', 'Advance to pouring into smaller cups', 'Pour dry rice or beans for a quieter version'],
  },
  {
    match: (t, m) => t.includes('pouring') && (t.includes('dry') || t.includes('grain') || m.includes('rice') || m.includes('beans')),
    substitutes: ['Two small bowls or cups', 'Tray', 'Dry rice, lentils, or beans', 'Small broom and dustpan'],
    prep: 'Fill one bowl with rice/beans. Place both on the tray.',
    control: 'Spilled grains on the tray show where control is needed. Child sweeps up any spills.',
    extensions: ['Use different sized containers', 'Try with a funnel', 'Count how many spoonfuls fill a cup'],
  },
  // Transferring
  {
    match: (t) => t.includes('spooning') || t.includes('spoon') && t.includes('transfer'),
    substitutes: ['Two small bowls', 'Tablespoon', 'Dried beans or large beads', 'Tray'],
    prep: 'Place beans in one bowl. Set both bowls and spoon on tray.',
    control: 'Child can see if any beans fell outside the bowls.',
    extensions: ['Use a smaller spoon for challenge', 'Count the items transferred', 'Try with water using a ladle'],
  },
  {
    match: (t) => t.includes('tong') || t.includes('tweezer') || t.includes('eyedropper'),
    substitutes: ['Kitchen tongs or large tweezers', 'Two small bowls', 'Cotton balls, pom-poms, or large beads', 'Tray'],
    prep: 'Place items in one bowl. Set tongs and both bowls on tray.',
    control: 'Dropped items show where the child needs more practice.',
    extensions: ['Sort by color while transferring', 'Use smaller items for challenge', 'Time yourself — how fast can you transfer them all?'],
  },
  // Cleaning
  {
    match: (t) => t.includes('polish') || t.includes('scrub') || t.includes('wash') || t.includes('clean') || t.includes('sweep') || t.includes('mop') || t.includes('dust'),
    substitutes: ['Small spray bottle with water', 'Soft cloths or rags', 'Small bucket', 'Sponge', 'Child-sized broom (or cut-down broom)'],
    prep: 'Set up a cleaning station with all supplies organized left-to-right in order of use.',
    control: 'The surface shows if it is clean or still dirty — built-in feedback.',
    extensions: ['Clean a mirror (fingerprints are visible feedback)', 'Wash a plant\'s leaves', 'Polish shoes or wooden items'],
  },
  // Food prep
  {
    match: (t) => t.includes('cooking') || t.includes('baking') || t.includes('recipe') || t.includes('food prep') || t.includes('snack') || t.includes('fruit') || t.includes('spread') || t.includes('peel') || t.includes('slice') || t.includes('grate'),
    substitutes: ['Child-safe knife or butter knife', 'Cutting board', 'Ingredients as listed in the lesson', 'Apron', 'Mixing bowls and utensils', 'Hand washing supplies'],
    prep: 'Wash hands first. Set out all ingredients and tools before calling the child. Pre-wash produce.',
    control: 'The finished food item shows the result. Taste-testing is the best self-check!',
    extensions: ['Let the child serve the food to family', 'Draw or write about what you made', 'Try a variation with different ingredients'],
  },
  // Dressing
  {
    match: (t) => t.includes('dress') || t.includes('button') || t.includes('zip') || t.includes('lace') || t.includes('tie') || t.includes('buckle'),
    substitutes: ['A button-down shirt or jacket', 'Shoes with laces', 'A jacket with a zipper', 'Child\'s own clothing'],
    prep: 'Lay out the clothing item flat on a table. Demonstrate slowly before the child tries.',
    control: 'The clothing shows if it\'s done correctly — buttons aligned, zipper closed, laces tied.',
    extensions: ['Practice on different types of fasteners', 'Time yourself getting dressed independently', 'Help a younger sibling or stuffed animal get dressed'],
  },
  // Sewing / handwork
  {
    match: (t) => t.includes('sew') || t.includes('stitch') || t.includes('weave') || t.includes('knit') || t.includes('thread'),
    substitutes: ['Large plastic needle or blunt tapestry needle', 'Yarn or embroidery thread', 'Burlap or felt squares', 'Hole punch (for pre-punching sewing cards)'],
    prep: 'Pre-punch holes in the fabric or card. Thread the needle and tie a knot at the end.',
    control: 'The stitching pattern shows whether the child followed the path correctly.',
    extensions: ['Sew a simple pouch or felt ornament', 'Create a sewing card from cardboard', 'Practice different stitch patterns'],
  },
  // Woodworking
  {
    match: (t) => t.includes('woodwork') || t.includes('hammer') || t.includes('sand'),
    substitutes: ['Small piece of soft wood (balsa or pine)', 'Sandpaper (fine and coarse grit)', 'Non-toxic paint and brush', 'Drop cloth or newspaper', 'Apron'],
    prep: 'Cover the work surface. Pre-cut wood to child-safe size. Demonstrate sanding with the grain.',
    control: 'The child can feel if the wood is smooth by running fingers over it.',
    extensions: ['Make a gift for someone', 'Paint a design or pattern', 'Try different sandpaper grits and compare results'],
  },
  // Sensorial — Fabric
  {
    match: (t) => t.includes('fabric') || t.includes('texture'),
    substitutes: ['6-8 fabric swatches in pairs (cotton, silk, wool, denim, felt, burlap)', 'Blindfold or sleep mask', 'Basket or tray'],
    prep: 'Cut fabric into matching pairs (about 4" squares). Place in a basket.',
    control: 'After matching blindfolded, remove the blindfold to check pairs.',
    extensions: ['Add more fabric types for challenge', 'Describe textures using descriptive words', 'Sort by rough/smooth, thick/thin'],
  },
  // Sensorial — Sound
  {
    match: (t) => t.includes('sound') && (t.includes('cylinder') || t.includes('box') || t.includes('match')),
    substitutes: ['6 identical small containers with lids (film canisters, pill bottles, or small jars)', 'Filling materials: rice, beans, sand, bells, paper clips, beads', 'Tape to seal lids', 'Matching colored stickers for pairs'],
    prep: 'Fill pairs of containers with the same material. Seal with tape. Mark matching pairs with same-colored stickers on the bottom (hidden from child).',
    control: 'Child flips containers to check if sticker colors match.',
    extensions: ['Grade sounds from quiet to loud', 'Make more pairs with new materials', 'Play a memory game with the sound pairs'],
  },
  // Sensorial — Thermic
  {
    match: (t) => t.includes('thermic') || t.includes('temperature'),
    substitutes: ['Metal spoon', 'Wooden spoon', 'Smooth stone', 'Felt square', 'Glass jar', 'Ceramic tile'],
    prep: 'Gather objects of different materials. Let them sit at room temperature.',
    control: 'Discussion-based: "Which feels coldest? Warmest? Why?" (metal conducts heat faster)',
    extensions: ['Place objects in the sun and compare again', 'Try objects from the fridge vs room temperature', 'Sort by "cold-feeling" to "warm-feeling"'],
  },
  // Sensorial — Baric (weight)
  {
    match: (t) => t.includes('baric') || t.includes('weight'),
    substitutes: ['3-6 identical small containers (film canisters or small boxes)', 'Coins, sand, or small rocks to add different weights', 'Tape to seal', 'Blindfold'],
    prep: 'Fill containers with different amounts of coins/sand to create varying weights. Seal with tape.',
    control: 'Number the containers on the bottom from lightest to heaviest. Child checks after sorting.',
    extensions: ['Use a kitchen scale to verify weight order', 'Add more containers for finer discrimination', 'Compare household objects: "Which is heavier?"'],
  },
  // Mystery bag / stereognostic
  {
    match: (t) => t.includes('mystery bag') || t.includes('stereognostic'),
    substitutes: ['Cloth bag or pillowcase', '5-8 familiar household objects (spoon, ball, key, button, block, coin, crayon, shell)'],
    prep: 'Place objects in the bag. Child reaches in without looking.',
    control: 'Child names the object by touch, then pulls it out to verify.',
    extensions: ['Add new unfamiliar objects', 'Describe the object before guessing', 'Sort objects by texture or shape after identifying'],
  },
  // Science experiments
  {
    match: (t) => t.includes('magnet') || t.includes('float') || t.includes('sink') || t.includes('magnif') || t.includes('experiment'),
    substitutes: ['Magnifying glass', 'Magnets (refrigerator magnets work)', 'Basin of water', 'Various small objects to test', 'Science journal and pencil'],
    prep: 'Gather testing objects. Set up the experiment station with all materials visible.',
    control: 'Record predictions and results — compare what the child expected vs what happened.',
    extensions: ['Test more objects around the house', 'Draw results in a science journal', 'Make predictions before testing — "What do you think will happen?"'],
  },
  // Art
  {
    match: (t) => t.includes('paint') || t.includes('watercolor') || t.includes('drawing') || t.includes('art') || t.includes('collage') || t.includes('clay'),
    substitutes: ['Paper (drawing, watercolor, or construction)', 'Crayons, colored pencils, or markers', 'Watercolor paints and brush', 'Smock or old shirt', 'Cup of water and paper towels'],
    prep: 'Cover the work surface. Set out materials in order of use. Demonstrate technique first.',
    control: 'Art is self-expressive — focus on the process, not the product.',
    extensions: ['Display the artwork proudly', 'Try the same subject with a different medium', 'Look at famous artwork for inspiration'],
  },
  // Nature / outdoor
  {
    match: (t) => t.includes('nature walk') || t.includes('outdoor') || t.includes('garden') || t.includes('plant'),
    substitutes: ['Nature journal and pencil', 'Magnifying glass', 'Collection bag or basket', 'Weather-appropriate clothing'],
    prep: 'Choose a safe outdoor area. Bring observation tools and journal.',
    control: 'Compare observations with field guides or look up findings together.',
    extensions: ['Press leaves or flowers', 'Start a nature collection', 'Photograph interesting finds'],
  },
  // Grace and courtesy
  {
    match: (t) => t.includes('grace') || t.includes('courtesy') || t.includes('manner') || t.includes('greeting'),
    substitutes: ['No materials needed — this is a role-play and discussion lesson'],
    prep: 'Think of scenarios to role-play. Keep it playful and positive.',
    control: 'Practice in real situations throughout the day.',
    extensions: ['Role-play at a pretend restaurant', 'Write thank-you notes', 'Practice with stuffed animals or dolls'],
  },
  // Music
  {
    match: (t) => t.includes('music') || t.includes('rhythm') || t.includes('song') || t.includes('instrument') || t.includes('bell'),
    substitutes: ['Pots, pans, wooden spoons for rhythm', 'Homemade shakers (rice in sealed containers)', 'Singing voice', 'Recorded music to listen to'],
    prep: 'Gather sound-making objects. Choose a space where noise is okay.',
    control: 'Can the child repeat a rhythm pattern? Can they keep a steady beat?',
    extensions: ['Create a simple song together', 'Clap rhythm patterns for each other to copy', 'Listen to different genres and compare'],
  },
];

/**
 * Find the best substitute rule for a lesson.
 */
function findSubstitutes(lesson) {
  const title = (lesson.title || '').toLowerCase();
  const materials = (lesson.materials_needed || []).map(m => m.toLowerCase()).join(' ');

  for (const rule of SUBSTITUTE_RULES) {
    if (rule.match(title, materials)) {
      return rule;
    }
  }

  // Default fallback
  return {
    substitutes: lesson.materials_needed || ['See lesson for materials list'],
    prep: 'Review the lesson steps. Gather all materials before calling your child to the work area.',
    control: 'Observe the child — can they complete the activity independently?',
    extensions: ['Repeat the lesson another day', 'Let the child show a family member what they learned', 'Connect this activity to daily life'],
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const level = process.argv.includes('--level')
    ? process.argv[process.argv.indexOf('--level') + 1]
    : 'primary';

  const classPath = path.join(__dirname, 'data', 'lesson-classifications.json');
  if (!fs.existsSync(classPath)) {
    console.error('Run classify-lessons.js first!');
    process.exit(1);
  }

  const classifications = JSON.parse(fs.readFileSync(classPath, 'utf8'));
  const lessonsDir = path.join(__dirname, 'data', `${level}-lessons`);

  console.log(`\nUpdating DIRECT lessons for ${level}...\n`);

  const weekFiles = fs.readdirSync(lessonsDir)
    .filter(f => f.startsWith('week-') && f.endsWith('.json'))
    .sort();

  let updated = 0;
  let noneUpdated = 0;

  for (const file of weekFiles) {
    const weekNum = parseInt(file.replace('week-', '').replace('.json', ''));
    const filePath = path.join(lessonsDir, file);
    const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let fileModified = false;

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const key = `${level}-lessons/week-${String(weekNum).padStart(2, '0')}/lesson-${String(i + 1).padStart(2, '0')}`;
      const classification = classifications[key];

      if (!classification) continue;

      if (classification.type === 'DIRECT') {
        const subs = findSubstitutes(lesson);

        lesson.conversion_type = 'DIRECT';
        lesson.household_substitutes = subs.substitutes;
        lesson.preparation_steps = subs.prep;
        lesson.control_of_error = subs.control;
        lesson.extension_ideas = subs.extensions;

        updated++;
        fileModified = true;
      } else if (classification.type === 'NONE') {
        lesson.conversion_type = 'NONE';
        lesson.household_substitutes = ['The book mentioned in the lesson', 'Comfortable reading area'];
        lesson.preparation_steps = 'Choose a cozy spot. Preview the book before reading it aloud.';
        lesson.control_of_error = 'Discussion-based — ask open-ended questions about the story.';
        lesson.extension_ideas = ['Draw a favorite scene', 'Retell the story in your own words', 'Act out a scene together'];

        noneUpdated++;
        fileModified = true;
      }
    }

    if (fileModified) {
      fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2));
    }

    console.log(`  ${file}: updated`);
  }

  console.log(`\n=== DIRECT LESSON UPDATE COMPLETE ===`);
  console.log(`DIRECT lessons updated: ${updated}`);
  console.log(`NONE (read-aloud) lessons updated: ${noneUpdated}`);
}

main();
