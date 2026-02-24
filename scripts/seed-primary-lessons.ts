import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface RawLesson {
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
  slide_content: Record<string, unknown>
  parent_notes: string
  age_adaptations: unknown
  sort_order: number
}

async function seed() {
  // Fetch level IDs
  const { data: levels, error: levelsErr } = await supabase
    .from('curriculum_levels')
    .select('id, name')
  if (levelsErr) throw levelsErr

  const levelMap = Object.fromEntries(levels!.map((l) => [l.name, l.id]))

  // Fetch subject IDs
  const { data: subjects, error: subjectsErr } = await supabase
    .from('subjects')
    .select('id, name')
  if (subjectsErr) throw subjectsErr

  const subjectMap = Object.fromEntries(subjects!.map((s) => [s.name, s.id]))

  const primaryLevelId = levelMap['primary']
  if (!primaryLevelId) {
    console.error('Could not find "primary" level in curriculum_levels table')
    process.exit(1)
  }

  // Read all week files
  const lessonsDir = join(__dirname, 'data', 'primary-lessons')
  const weekFiles = readdirSync(lessonsDir)
    .filter((f) => f.startsWith('week-') && f.endsWith('.json'))
    .sort((a, b) => {
      const weekA = parseInt(a.match(/week-(\d+)/)?.[1] || '0')
      const weekB = parseInt(b.match(/week-(\d+)/)?.[1] || '0')
      return weekA - weekB
    })

  console.log(`Found ${weekFiles.length} week files to seed`)

  let totalSeeded = 0

  for (const file of weekFiles) {
    const weekNum = parseInt(file.match(/week-(\d+)/)?.[1] || '0')
    const filePath = join(lessonsDir, file)
    const rawLessons: RawLesson[] = JSON.parse(readFileSync(filePath, 'utf-8'))

    // Transform: replace level_name/subject_name with level_id/subject_id
    const lessons = rawLessons.map((raw) => {
      const subjectId = subjectMap[raw.subject_name]
      if (!subjectId) {
        console.warn(`  Warning: Unknown subject "${raw.subject_name}" in ${file}, lesson "${raw.title}"`)
      }

      return {
        level_id: primaryLevelId,
        subject_id: subjectId,
        week_number: raw.week_number,
        day_of_week: raw.day_of_week,
        quarter: raw.quarter,
        title: raw.title,
        description: raw.description,
        instructions: raw.instructions,
        duration_minutes: raw.duration_minutes,
        lesson_type: raw.lesson_type,
        materials_needed: raw.materials_needed,
        slide_content: raw.slide_content,
        parent_notes: raw.parent_notes,
        age_adaptations: raw.age_adaptations,
        sort_order: raw.sort_order,
      }
    }).filter((l) => l.subject_id) // Skip lessons with unknown subjects

    // Delete existing lessons for this week to allow re-seeding
    const { error: deleteErr } = await supabase
      .from('lessons')
      .delete()
      .eq('level_id', primaryLevelId)
      .eq('week_number', weekNum)

    if (deleteErr) {
      console.error(`  Error deleting existing week ${weekNum}:`, deleteErr)
    }

    // Insert in batches
    const batchSize = 25
    for (let i = 0; i < lessons.length; i += batchSize) {
      const batch = lessons.slice(i, i + batchSize)
      const { error } = await supabase
        .from('lessons')
        .insert(batch)

      if (error) {
        console.error(`  Error seeding week ${weekNum} batch ${i / batchSize + 1}:`, error)
        throw error
      }
    }

    totalSeeded += lessons.length
    console.log(`  Week ${weekNum}: ${lessons.length} lessons seeded`)
  }

  console.log(`\nDone! ${totalSeeded} primary lessons seeded across ${weekFiles.length} weeks.`)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
