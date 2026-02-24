import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'

const masteryColors: Record<string, string> = {
  not_introduced: 'bg-stone-100 text-stone-500',
  presented: 'bg-blue-100 text-blue-700',
  practicing: 'bg-yellow-100 text-yellow-700',
  developing: 'bg-orange-100 text-orange-700',
  mastered: 'bg-green-100 text-green-700',
  applied: 'bg-purple-100 text-purple-700',
}

const masteryLabels: Record<string, string> = {
  not_introduced: 'Not Introduced',
  presented: 'Presented',
  practicing: 'Practicing',
  developing: 'Developing',
  mastered: 'Mastered',
  applied: 'Applied',
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .eq('parent_id', user.id)
    .single()

  if (!student) notFound()

  // Get mastery overview by subject
  const { data: masteryData } = await supabase
    .from('student_mastery')
    .select(`
      status,
      scope_sequence_items (
        subjects (
          name,
          display_name,
          color
        )
      )
    `)
    .eq('student_id', studentId)

  // Aggregate mastery by subject
  const subjectMastery: Record<string, Record<string, number>> = {}
  for (const item of masteryData || []) {
    const scopeItem = item.scope_sequence_items as unknown as {
      subjects: { name: string; display_name: string; color: string } | null
    } | null
    const subjectName = scopeItem?.subjects?.name || 'unknown'
    if (!subjectMastery[subjectName]) {
      subjectMastery[subjectName] = {}
    }
    subjectMastery[subjectName][item.status] =
      (subjectMastery[subjectName][item.status] || 0) + 1
  }

  // Get recent lesson progress
  const { data: recentProgress } = await supabase
    .from('student_lesson_progress')
    .select(`
      status,
      completed_at,
      lessons (
        title,
        subjects (
          display_name,
          color
        )
      )
    `)
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false })
    .limit(10)

  // Get recent observations
  const { data: observations } = await supabase
    .from('observations')
    .select('*')
    .eq('student_id', studentId)
    .order('observation_date', { ascending: false })
    .limit(5)

  const gradeBandLabels: Record<string, string> = {
    primary: 'Primary (K)',
    lower_elementary: 'Lower Elementary (1-3)',
    upper_elementary: 'Upper Elementary (4-6)',
  }

  return (
    <div>
      <Link
        href="/dashboard/students"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
        </svg>
        All Students
      </Link>

      {/* Student header */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700">
          {student.first_name[0]}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-stone-800">
            {student.first_name} {student.last_name}
          </h2>
          <p className="text-sm text-stone-500">
            {gradeBandLabels[student.grade_band]} &middot; Year {student.academic_year} &middot; Week {student.start_week} start
          </p>
        </div>
      </div>

      {/* Mastery overview */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-stone-700">Mastery Overview</h3>
        {Object.keys(subjectMastery).length > 0 ? (
          <div className="mt-4 space-y-3">
            {Object.entries(subjectMastery).map(([subject, statuses]) => {
              const total = Object.values(statuses).reduce((a, b) => a + b, 0)
              const mastered = (statuses.mastered || 0) + (statuses.applied || 0)
              const pct = total > 0 ? Math.round((mastered / total) * 100) : 0

              return (
                <div key={subject} className="rounded-lg border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700 capitalize">
                      {subject.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-stone-500">{pct}% mastered</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {Object.entries(statuses).map(([status, count]) => (
                      <div
                        key={status}
                        className={clsx(
                          'h-2 rounded-full',
                          masteryColors[status]?.split(' ')[0] || 'bg-stone-200'
                        )}
                        style={{ width: `${(count / total) * 100}%` }}
                        title={`${masteryLabels[status]}: ${count}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(statuses).map(([status, count]) => (
                      <span
                        key={status}
                        className={clsx(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs',
                          masteryColors[status]
                        )}
                      >
                        {masteryLabels[status]}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">
            No mastery data yet. Complete lessons to start tracking progress.
          </p>
        )}
      </div>

      {/* Recent activity */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Recent lessons */}
        <div>
          <h3 className="text-lg font-medium text-stone-700">Recent Lessons</h3>
          {recentProgress && recentProgress.length > 0 ? (
            <div className="mt-4 space-y-2">
              {recentProgress.map((p, i) => {
                const lesson = p.lessons as unknown as {
                  title: string
                  subjects: { display_name: string; color: string } | null
                } | null

                return (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-stone-100 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-stone-700">
                        {lesson?.title || 'Unknown lesson'}
                      </p>
                      <p className="text-xs text-stone-400">
                        {lesson?.subjects?.display_name}
                      </p>
                    </div>
                    <span className={clsx(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                    )}>
                      {p.status}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-500">No lesson activity yet.</p>
          )}
        </div>

        {/* Recent observations */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-stone-700">Observations</h3>
            <Link
              href="/dashboard/observations"
              className="text-xs font-medium text-green-700 hover:text-green-800"
            >
              Add observation
            </Link>
          </div>
          {observations && observations.length > 0 ? (
            <div className="mt-4 space-y-2">
              {observations.map((obs) => (
                <div key={obs.id} className="rounded-lg border border-stone-100 bg-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-400 capitalize">
                      {obs.observation_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-stone-400">{obs.observation_date}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-700 line-clamp-2">{obs.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-500">No observations yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
