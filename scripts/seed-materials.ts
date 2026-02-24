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
  const materialsPath = join(__dirname, 'data', 'materials.json')
  const materials = JSON.parse(readFileSync(materialsPath, 'utf-8'))

  console.log(`Seeding ${materials.length} materials...`)

  // Upsert in batches of 50 to avoid payload limits
  const batchSize = 50
  for (let i = 0; i < materials.length; i += batchSize) {
    const batch = materials.slice(i, i + batchSize)
    const { error } = await supabase
      .from('materials_inventory')
      .upsert(batch, { onConflict: 'code' })

    if (error) {
      console.error(`Error seeding batch ${i / batchSize + 1}:`, error)
      throw error
    }
    console.log(`  Batch ${i / batchSize + 1}: ${batch.length} materials upserted`)
  }

  console.log('Done! All materials seeded.')
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
