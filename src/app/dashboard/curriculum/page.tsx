import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CurriculumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Get levels
  const { data: levels } = await supabase
    .from('curriculum_levels')
    .select('*')
    .order('name')

  // Get subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('sort_order')

  // Get lesson counts per level
  const { data: lessonCounts } = await supabase
    .from('lessons')
    .select('level_id')

  const countByLevel: Record<string, number> = {}
  for (const l of (lessonCounts || [])) {
    countByLevel[l.level_id] = (countByLevel[l.level_id] || 0) + 1
  }

  // Get scope item counts per level
  const { data: scopeCounts } = await supabase
    .from('scope_sequence_items')
    .select('level_id')

  const scopeByLevel: Record<string, number> = {}
  for (const s of (scopeCounts || [])) {
    scopeByLevel[s.level_id] = (scopeByLevel[s.level_id] || 0) + 1
  }

  // Get materials count
  const { count: materialsCount } = await supabase
    .from('materials_inventory')
    .select('*', { count: 'exact', head: true })

  // Get great lessons count
  const { count: greatLessonsCount } = await supabase
    .from('great_lessons')
    .select('*', { count: 'exact', head: true })

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-800">Curriculum Management</h2>
      <p className="mt-1 text-sm text-stone-500">
        Overview and management of curriculum data.
      </p>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Materials</p>
          <p className="mt-1 text-2xl font-bold text-stone-800">{materialsCount || 0}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Great Lessons</p>
          <p className="mt-1 text-2xl font-bold text-stone-800">{greatLessonsCount || 0}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Subjects</p>
          <p className="mt-1 text-2xl font-bold text-stone-800">{(subjects || []).length}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Curriculum Levels</p>
          <p className="mt-1 text-2xl font-bold text-stone-800">{(levels || []).length}</p>
        </div>
      </div>

      {/* Levels breakdown */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Curriculum Levels</h3>
        <div className="mt-3 space-y-3">
          {(levels || []).map(level => (
            <div key={level.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-stone-800">{level.display_name}</h4>
                  <p className="text-xs text-stone-400">
                    Ages {level.age_range} &middot; {level.daily_hours}h/day &middot; {level.description}
                  </p>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-lg font-bold text-stone-800">{countByLevel[level.id] || 0}</p>
                    <p className="text-[10px] text-stone-400">Lessons</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-stone-800">{scopeByLevel[level.id] || 0}</p>
                    <p className="text-[10px] text-stone-400">Scope Items</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subjects */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Subjects</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(subjects || []).map(subject => (
            <div key={subject.id} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3">
              <span className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color || '#999' }} />
              <div>
                <p className="text-sm font-medium text-stone-700">{subject.display_name}</p>
                <p className="text-[10px] text-stone-400">Icon: {subject.icon} &middot; Order: {subject.sort_order}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
