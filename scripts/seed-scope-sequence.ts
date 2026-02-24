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
  // First, fetch curriculum_levels and subjects to resolve IDs
  const { data: levels, error: levelsErr } = await supabase
    .from('curriculum_levels')
    .select('id, name')
  if (levelsErr) throw levelsErr

  const { data: subjects, error: subjectsErr } = await supabase
    .from('subjects')
    .select('id, name')
  if (subjectsErr) throw subjectsErr

  const levelMap = Object.fromEntries(levels!.map((l) => [l.name, l.id]))
  const subjectMap = Object.fromEntries(subjects!.map((s) => [s.name, s.id]))

  console.log('Level IDs:', levelMap)
  console.log('Subject IDs:', subjectMap)

  const scopePath = join(__dirname, 'data', 'scope-sequence.json')
  const rawItems = JSON.parse(readFileSync(scopePath, 'utf-8'))

  // Map level_name and subject_name to UUIDs
  const items = rawItems.map((item: Record<string, unknown>) => {
    const levelId = levelMap[item.level_name as string]
    const subjectId = subjectMap[item.subject_name as string]

    if (!levelId) {
      console.warn(`Unknown level: ${item.level_name}`)
      return null
    }
    if (!subjectId) {
      console.warn(`Unknown subject: ${item.subject_name}`)
      return null
    }

    const { level_name, subject_name, ...rest } = item
    return {
      ...rest,
      level_id: levelId,
      subject_id: subjectId,
    }
  }).filter(Boolean)

  console.log(`Seeding ${items.length} scope & sequence items...`)

  // Upsert in batches of 50
  const batchSize = 50
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const { error } = await supabase
      .from('scope_sequence_items')
      .insert(batch)

    if (error) {
      console.error(`Error seeding batch ${i / batchSize + 1}:`, error)
      throw error
    }
    console.log(`  Batch ${i / batchSize + 1}: ${batch.length} items inserted`)
  }

  console.log('Done! All scope & sequence items seeded.')
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
