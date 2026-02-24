import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  const dataPath = join(__dirname, 'data', 'great-lessons.json')
  const data = JSON.parse(readFileSync(dataPath, 'utf-8'))

  // Fetch level IDs
  const { data: levels, error: levelsErr } = await supabase
    .from('curriculum_levels')
    .select('id, name')
  if (levelsErr) throw levelsErr

  const levelMap = Object.fromEntries(levels!.map((l) => [l.name, l.id]))

  // Seed Great Lessons
  console.log(`Seeding ${data.great_lessons.length} Great Lessons...`)
  for (const lesson of data.great_lessons) {
    const { error } = await supabase
      .from('great_lessons')
      .upsert(lesson, { onConflict: 'lesson_number' })
    if (error) {
      console.error(`Error seeding great lesson ${lesson.lesson_number}:`, error)
      throw error
    }
  }

  // Get inserted great lesson IDs
  const { data: insertedLessons } = await supabase
    .from('great_lessons')
    .select('id, lesson_number')
    .order('lesson_number')

  const lessonIdMap = Object.fromEntries(
    insertedLessons!.map((l) => [l.lesson_number, l.id])
  )

  // Seed follow-up activities
  const followups = data.followups.map((f: Record<string, unknown>) => ({
    great_lesson_id: lessonIdMap[f.lesson_number as number],
    week_offset: f.week_offset,
    level_id: levelMap[f.level_name as string],
    focus_area: f.focus_area,
    activities: f.activities,
    materials_needed: f.materials_needed || [],
  }))

  console.log(`Seeding ${followups.length} follow-up activities...`)

  const batchSize = 50
  for (let i = 0; i < followups.length; i += batchSize) {
    const batch = followups.slice(i, i + batchSize)
    const { error } = await supabase
      .from('great_lesson_followups')
      .insert(batch)
    if (error) {
      console.error(`Error seeding followup batch ${i / batchSize + 1}:`, error)
      throw error
    }
    console.log(`  Batch ${i / batchSize + 1}: ${batch.length} followups inserted`)
  }

  console.log('Done! All Great Lessons and followups seeded.')
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
