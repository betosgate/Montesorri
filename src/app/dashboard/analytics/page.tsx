import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Get counts
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('enrollment_status', 'active')

  const { count: teacherCount } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: classCount } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: subCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: lessonCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })

  const { count: observationCount } = await supabase
    .from('observations')
    .select('*', { count: 'exact', head: true })

  // Get enrollment by grade band
  const { data: studentsByGrade } = await supabase
    .from('students')
    .select('grade_band')
    .eq('enrollment_status', 'active')

  const gradeBreakdown: Record<string, number> = {}
  for (const s of (studentsByGrade || [])) {
    gradeBreakdown[s.grade_band] = (gradeBreakdown[s.grade_band] || 0) + 1
  }

  const stats = [
    { label: 'Active Students', value: studentCount || 0, color: 'bg-green-100 text-green-700' },
    { label: 'Active Teachers', value: teacherCount || 0, color: 'bg-blue-100 text-blue-700' },
    { label: 'Active Classes', value: classCount || 0, color: 'bg-purple-100 text-purple-700' },
    { label: 'Subscriptions', value: subCount || 0, color: 'bg-amber-100 text-amber-700' },
    { label: 'Total Lessons', value: lessonCount || 0, color: 'bg-stone-100 text-stone-700' },
    { label: 'Observations', value: observationCount || 0, color: 'bg-teal-100 text-teal-700' },
  ]

  const GRADE_LABELS: Record<string, string> = {
    primary: 'Primary (K)',
    lower_elementary: 'Lower Elementary (1-3)',
    upper_elementary: 'Upper Elementary (4-6)',
  }

  const monthlyRevenue = (subCount || 0) * 50

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-800">Analytics</h2>
      <p className="mt-1 text-sm text-stone-500">Platform overview and key metrics.</p>

      {/* Stats grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-stone-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue estimate */}
      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <p className="text-sm text-stone-500">Estimated Monthly Revenue</p>
        <p className="mt-1 text-2xl font-bold text-green-700">${monthlyRevenue.toLocaleString()}</p>
        <p className="text-xs text-stone-400">{subCount || 0} subscriptions &times; $50/mo</p>
      </div>

      {/* Grade band distribution */}
      <div className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">Enrollment by Grade Band</h3>
        {Object.entries(gradeBreakdown).length === 0 ? (
          <p className="text-sm text-stone-400">No enrollment data yet.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(gradeBreakdown).map(([band, count]) => {
              const total = studentCount || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={band}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-700">{GRADE_LABELS[band] || band}</span>
                    <span className="text-stone-500">{count} ({pct}%)</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-stone-100 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
