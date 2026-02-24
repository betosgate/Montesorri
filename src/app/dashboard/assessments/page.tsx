import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AssessmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, grade_band')
    .eq('parent_id', user.id)
    .eq('enrollment_status', 'active')

  // Get subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, display_name, color')
    .order('sort_order')

  // Calculate current quarter
  const now = new Date()
  const month = now.getMonth()
  let quarter: number
  if (month >= 8 && month <= 10) quarter = 1      // Sep-Nov
  else if (month >= 11 || month <= 1) quarter = 2  // Dec-Feb
  else if (month >= 2 && month <= 4) quarter = 3   // Mar-May
  else quarter = 4                                   // Jun-Aug

  // Get assessment data (mastery counts per subject per student)
  const assessmentData: {
    student: { id: string; first_name: string; grade_band: string }
    subjectStats: { subject: string; color: string; total: number; mastered: number; inProgress: number }[]
  }[] = []

  for (const student of (students || [])) {
    const { data: mastery } = await supabase
      .from('student_mastery')
      .select(`
        status,
        scope_sequence_items!scope_item_id (
          subject_id
        )
      `)
      .eq('student_id', student.id)

    const subjectCounts: Record<string, { total: number; mastered: number; inProgress: number }> = {}
    for (const m of (mastery || [])) {
      const scopeItem = m.scope_sequence_items as unknown as { subject_id: string } | null
      if (!scopeItem) continue
      const sid = scopeItem.subject_id
      if (!subjectCounts[sid]) subjectCounts[sid] = { total: 0, mastered: 0, inProgress: 0 }
      subjectCounts[sid].total++
      if (m.status === 'mastered' || m.status === 'applied') subjectCounts[sid].mastered++
      if (m.status === 'practicing' || m.status === 'developing') subjectCounts[sid].inProgress++
    }

    const subjectStats = (subjects || [])
      .filter(s => subjectCounts[s.id])
      .map(s => ({
        subject: s.display_name,
        color: s.color || '#999',
        ...subjectCounts[s.id],
      }))

    assessmentData.push({
      student: { id: student.id, first_name: student.first_name, grade_band: student.grade_band },
      subjectStats,
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-800">Assessments</h2>
          <p className="mt-1 text-sm text-stone-500">
            Quarterly progress assessments. Currently Quarter {quarter}.
          </p>
        </div>
        <Link
          href="/dashboard/portfolio"
          className="rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          View Portfolio
        </Link>
      </div>

      {assessmentData.length === 0 ? (
        <p className="mt-8 text-center text-sm text-stone-500 py-8">
          No students found. Add a student to begin assessments.
        </p>
      ) : (
        assessmentData.map(({ student, subjectStats }) => (
          <div key={student.id} className="mt-6">
            <h3 className="text-lg font-medium text-stone-700">
              {student.first_name} — Q{quarter} Assessment
            </h3>

            {subjectStats.length === 0 ? (
              <p className="mt-2 text-sm text-stone-400">
                No mastery data recorded yet. Complete lessons and log mastery to generate assessments.
              </p>
            ) : (
              <div className="mt-3 rounded-lg border border-stone-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone-500">Subject</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-stone-500">Skills Tracked</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-stone-500">Mastered</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-stone-500">In Progress</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-stone-500">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {subjectStats.map(stat => {
                      const pct = stat.total > 0 ? Math.round((stat.mastered / stat.total) * 100) : 0
                      return (
                        <tr key={stat.subject}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
                              <span className="font-medium text-stone-700">{stat.subject}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-stone-600">{stat.total}</td>
                          <td className="px-4 py-3 text-center text-green-700 font-medium">{stat.mastered}</td>
                          <td className="px-4 py-3 text-center text-amber-600">{stat.inProgress}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-1 rounded-full bg-stone-100 overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-stone-500 w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
