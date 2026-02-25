import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getCurrentAcademicWeek(): number {
  const now = new Date()
  const startMonth = 8
  const startYear = now.getMonth() >= startMonth ? now.getFullYear() : now.getFullYear() - 1
  const academicStart = new Date(startYear, startMonth, 1)
  while (academicStart.getDay() !== 1) academicStart.setDate(academicStart.getDate() + 1)
  return Math.max(1, Math.min(36, Math.floor((now.getTime() - academicStart.getTime()) / (7 * 86400000)) + 1))
}

export default async function StudentLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; day?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const currentAcademicWeek = getCurrentAcademicWeek()
  const weekNum = params.week ? Math.max(1, Math.min(36, parseInt(params.week, 10) || currentAcademicWeek)) : currentAcademicWeek
  const selectedDay = params.day ? Math.max(1, Math.min(5, parseInt(params.day, 10) || 1)) : null

  // Get lessons for this week
  let query = supabase
    .from('lessons')
    .select(`
      id,
      title,
      description,
      week_number,
      day_of_week,
      duration_minutes,
      lesson_type,
      subjects!subject_id (
        display_name,
        color
      )
    `)
    .eq('week_number', weekNum)
    .order('day_of_week')
    .order('sort_order')

  if (selectedDay) {
    query = query.eq('day_of_week', selectedDay)
  }

  const { data: lessons } = await query

  // Group lessons by day
  const lessonsByDay: Record<number, typeof lessons> = {}
  for (const lesson of lessons || []) {
    if (!lessonsByDay[lesson.day_of_week]) lessonsByDay[lesson.day_of_week] = []
    lessonsByDay[lesson.day_of_week]!.push(lesson)
  }

  const quarterNum = Math.ceil(weekNum / 9)
  const quarterNames = ['', 'Fall (Q1)', 'Winter (Q2)', 'Spring (Q3)', 'Late Spring (Q4)']

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-800">My Lessons</h2>

      {/* Week navigator */}
      <div className="mt-4 flex items-center gap-3">
        {weekNum > 1 ? (
          <Link
            href={`/student/lessons?week=${weekNum - 1}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-500 hover:bg-stone-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
          </Link>
        ) : <div className="h-8 w-8" />}

        <div className="text-center flex-1">
          <p className="text-sm font-semibold text-stone-700">Week {weekNum} of 36</p>
          <p className="text-xs text-stone-400">{quarterNames[quarterNum]}</p>
        </div>

        {weekNum < 36 ? (
          <Link
            href={`/student/lessons?week=${weekNum + 1}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-500 hover:bg-stone-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </Link>
        ) : <div className="h-8 w-8" />}
      </div>

      {/* Quick jump to current week */}
      {weekNum !== currentAcademicWeek && (
        <div className="mt-2 text-center">
          <Link
            href={`/student/lessons?week=${currentAcademicWeek}`}
            className="text-xs text-green-700 hover:text-green-800 font-medium"
          >
            Jump to current week ({currentAcademicWeek})
          </Link>
        </div>
      )}

      {/* Day tabs */}
      <div className="mt-4 flex gap-1 rounded-lg bg-stone-100 p-1">
        <Link
          href={`/student/lessons?week=${weekNum}`}
          className={`flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors ${
            !selectedDay ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          All Days
        </Link>
        {[1, 2, 3, 4, 5].map(d => (
          <Link
            key={d}
            href={`/student/lessons?week=${weekNum}&day=${d}`}
            className={`flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors ${
              selectedDay === d ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {DAY_NAMES[d].slice(0, 3)}
          </Link>
        ))}
      </div>

      {/* Lessons grouped by day */}
      {(lessons || []).length === 0 ? (
        <p className="mt-8 text-center text-sm text-stone-500 py-8">
          No lessons loaded for this week yet.
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(lessonsByDay)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([day, dayLessons]) => (
              <div key={day}>
                {!selectedDay && (
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
                    {DAY_NAMES[Number(day)]}
                  </h3>
                )}
                <div className="space-y-2">
                  {(dayLessons || []).map((lesson, i) => {
                    const subj = lesson.subjects as unknown as { display_name: string; color: string | null } | null
                    return (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/lessons/${lesson.id}`}
                        className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 transition-shadow hover:shadow-md"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: subj?.color || '#999' }}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800">{lesson.title}</p>
                          <p className="text-xs text-stone-400">
                            {subj?.display_name} &middot; {lesson.duration_minutes} min &middot; {lesson.lesson_type}
                          </p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 shrink-0 text-stone-300">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
