import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { MasteryStatus } from '@/lib/types/database'

const STATUS_LABELS: Record<MasteryStatus, string> = {
  not_introduced: 'Not Introduced',
  presented: 'Presented',
  practicing: 'Practicing',
  developing: 'Developing',
  mastered: 'Mastered',
  applied: 'Applied',
}

const STATUS_COLORS: Record<MasteryStatus, string> = {
  not_introduced: 'bg-stone-200',
  presented: 'bg-purple-300',
  practicing: 'bg-amber-300',
  developing: 'bg-blue-400',
  mastered: 'bg-green-500',
  applied: 'bg-emerald-600',
}

export default async function StudentProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, display_name, color')
    .order('sort_order')

  // Get mastery records (student would access their own mastery data)
  // In a real app, we'd need to know which student record maps to this user
  const { data: mastery } = await supabase
    .from('student_mastery')
    .select(`
      status,
      scope_sequence_items!scope_item_id (
        name,
        sub_area,
        subject_id
      )
    `)

  // Group by subject
  const bySubject: Record<string, { total: number; mastered: number; items: { name: string; status: MasteryStatus }[] }> = {}
  for (const m of (mastery || [])) {
    const item = m.scope_sequence_items as unknown as { name: string; sub_area: string | null; subject_id: string } | null
    if (!item) continue
    const sid = item.subject_id
    if (!bySubject[sid]) bySubject[sid] = { total: 0, mastered: 0, items: [] }
    bySubject[sid].total++
    if (m.status === 'mastered' || m.status === 'applied') bySubject[sid].mastered++
    bySubject[sid].items.push({ name: item.name, status: m.status as MasteryStatus })
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-800">My Progress</h2>
      <p className="mt-1 text-sm text-stone-500">See how you&apos;re doing across all subjects.</p>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-sm ${STATUS_COLORS[status as MasteryStatus]}`} />
            <span className="text-xs text-stone-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Subject progress */}
      <div className="mt-6 space-y-4">
        {(subjects || []).map(subject => {
          const data = bySubject[subject.id]
          if (!data) return null

          const pct = data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0

          return (
            <div key={subject.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color || '#999' }} />
                  <h3 className="font-medium text-stone-800">{subject.display_name}</h3>
                </div>
                <span className="text-sm text-stone-500">{pct}% mastered</span>
              </div>

              <div className="mt-2 h-3 rounded-full bg-stone-100 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>

              <p className="mt-1 text-xs text-stone-400">
                {data.mastered} of {data.total} skills mastered
              </p>
            </div>
          )
        })}

        {Object.keys(bySubject).length === 0 && (
          <p className="text-center text-sm text-stone-500 py-8">
            No progress data yet. Start completing lessons to track your progress!
          </p>
        )}
      </div>
    </div>
  )
}
