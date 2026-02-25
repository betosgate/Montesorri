import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import type { LessonProgressStatus } from '@/lib/types/database'

// Map subject names to display colors
const subjectColors: Record<string, string> = {
  practical_life: 'bg-amber-50 border-amber-200 text-amber-800',
  sensorial: 'bg-purple-50 border-purple-200 text-purple-800',
  language: 'bg-green-50 border-green-200 text-green-800',
  math: 'bg-orange-50 border-orange-200 text-orange-800',
  geometry: 'bg-blue-50 border-blue-200 text-blue-800',
  culture: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  science: 'bg-teal-50 border-teal-200 text-teal-800',
  history: 'bg-pink-50 border-pink-200 text-pink-800',
  geography: 'bg-lime-50 border-lime-200 text-lime-800',
  art_music: 'bg-red-50 border-red-200 text-red-800',
  read_aloud: 'bg-indigo-50 border-indigo-200 text-indigo-800',
}

const statusBadge: Record<string, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-stone-100 text-stone-600' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  skipped: { label: 'Skipped', className: 'bg-stone-100 text-stone-400' },
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getCurrentAcademicWeek(): number {
  const now = new Date()
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const sept1 = new Date(year, 8, 1)
  const firstMonday = new Date(sept1)
  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() + 1)
  }
  const diffMs = now.getTime() - firstMonday.getTime()
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(36, diffWeeks))
}

export default async function TodaysLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; day?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const currentAcademicWeek = getCurrentAcademicWeek()
  const weekNumber = params.week ? Math.max(1, Math.min(36, parseInt(params.week, 10) || currentAcademicWeek)) : currentAcademicWeek
  const selectedDay = params.day ? Math.max(1, Math.min(5, parseInt(params.day, 10) || 0)) : null

  // Get the parent's students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, grade_band')
    .eq('parent_id', user.id)
    .eq('enrollment_status', 'active')

  if (!students || students.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-stone-800">Lessons</h2>
        <p className="mt-2 text-sm text-stone-600">
          No active students found. Add a student to get started.
        </p>
      </div>
    )
  }

  // Get curriculum level IDs
  const { data: levels } = await supabase
    .from('curriculum_levels')
    .select('id, name')

  const levelMap = Object.fromEntries(
    (levels || []).map((l) => [l.name, l.id])
  )

  // For each student, get this week's lessons
  const studentLessons = await Promise.all(
    students.map(async (student) => {
      const levelId = levelMap[student.grade_band]
      if (!levelId) return { student, lessons: [] }

      let query = supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          duration_minutes,
          lesson_type,
          sort_order,
          day_of_week,
          subjects (
            name,
            display_name,
            icon,
            color
          )
        `)
        .eq('level_id', levelId)
        .eq('week_number', weekNumber)
        .order('day_of_week')
        .order('sort_order')

      if (selectedDay) {
        query = query.eq('day_of_week', selectedDay)
      }

      const { data: lessons } = await query

      // Get progress for these lessons
      const lessonIds = (lessons || []).map((l) => l.id)
      const { data: progress } = await supabase
        .from('student_lesson_progress')
        .select('lesson_id, status')
        .eq('student_id', student.id)
        .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000'])

      const progressMap = Object.fromEntries(
        (progress || []).map((p) => [p.lesson_id, p.status as LessonProgressStatus])
      )

      return {
        student,
        lessons: (lessons || []).map((l) => ({
          ...l,
          progress: progressMap[l.id] || 'not_started' as LessonProgressStatus,
        })),
      }
    })
  )

  const completedCount = studentLessons.reduce(
    (sum, sl) => sum + sl.lessons.filter((l) => l.progress === 'completed').length,
    0
  )
  const totalCount = studentLessons.reduce(
    (sum, sl) => sum + sl.lessons.length,
    0
  )
  const quarterNum = Math.ceil(weekNumber / 9)
  const quarterNames = ['', 'Fall (Q1)', 'Winter (Q2)', 'Spring (Q3)', 'Late Spring (Q4)']

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-800">Lessons</h2>
          <p className="mt-1 text-sm text-stone-500">
            {completedCount}/{totalCount} completed
          </p>
        </div>
        <Link
          href="/dashboard/calendar"
          className="text-sm font-medium text-green-700 hover:text-green-800"
        >
          View Calendar
        </Link>
      </div>

      {/* Week navigator */}
      <div className="mt-4 flex items-center gap-3">
        {weekNumber > 1 ? (
          <Link
            href={`/dashboard/lessons?week=${weekNumber - 1}${selectedDay ? `&day=${selectedDay}` : ''}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-500 hover:bg-stone-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
          </Link>
        ) : <div className="h-8 w-8" />}

        <div className="text-center flex-1">
          <p className="text-sm font-semibold text-stone-700">Week {weekNumber} of 36</p>
          <p className="text-xs text-stone-400">{quarterNames[quarterNum]}</p>
        </div>

        {weekNumber < 36 ? (
          <Link
            href={`/dashboard/lessons?week=${weekNumber + 1}${selectedDay ? `&day=${selectedDay}` : ''}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-500 hover:bg-stone-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </Link>
        ) : <div className="h-8 w-8" />}
      </div>

      {/* Quick jump to current week */}
      {weekNumber !== currentAcademicWeek && (
        <div className="mt-2 text-center">
          <Link
            href={`/dashboard/lessons?week=${currentAcademicWeek}`}
            className="text-xs text-green-700 hover:text-green-800 font-medium"
          >
            Jump to current week ({currentAcademicWeek})
          </Link>
        </div>
      )}

      {/* Day tabs */}
      <div className="mt-4 flex gap-1 rounded-lg bg-stone-100 p-1">
        <Link
          href={`/dashboard/lessons?week=${weekNumber}`}
          className={`flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors ${
            !selectedDay ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          All
        </Link>
        {[1, 2, 3, 4, 5].map(d => (
          <Link
            key={d}
            href={`/dashboard/lessons?week=${weekNumber}&day=${d}`}
            className={`flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors ${
              selectedDay === d ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {DAY_NAMES[d].slice(0, 3)}
          </Link>
        ))}
      </div>

      {studentLessons.map(({ student, lessons }) => (
        <div key={student.id} className="mt-8">
          <h3 className="text-lg font-medium text-stone-700">
            {student.first_name}&apos;s Lessons
          </h3>
          <p className="text-xs text-stone-500 capitalize">
            {student.grade_band.replace(/_/g, ' ')}
          </p>

          {lessons.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              No lessons found for this selection.
            </p>
          ) : (
            <div className="mt-4 space-y-6">
              {/* Group by day */}
              {Object.entries(
                lessons.reduce((acc, l) => {
                  const d = l.day_of_week
                  if (!acc[d]) acc[d] = []
                  acc[d].push(l)
                  return acc
                }, {} as Record<number, typeof lessons>)
              )
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, dayLessons]) => (
                  <div key={day}>
                    {!selectedDay && (
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
                        {DAY_NAMES[Number(day)]}
                      </h4>
                    )}
                    <div className="space-y-2">
                      {dayLessons.map((lesson) => {
                        const subj = lesson.subjects as unknown as { name: string; display_name: string } | null
                        const subjectName = subj?.name || ''
                        const subjectDisplay = subj?.display_name || subjectName
                        const colorClasses = subjectColors[subjectName] || 'bg-stone-50 border-stone-200 text-stone-800'
                        const badge = statusBadge[lesson.progress] || statusBadge.not_started

                        return (
                          <Link
                            key={lesson.id}
                            href={`/dashboard/lessons/${lesson.id}?studentId=${student.id}`}
                            className={clsx(
                              'flex items-center justify-between rounded-lg border p-4 transition-shadow hover:shadow-md',
                              colorClasses
                            )}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                                  {subjectDisplay}
                                </span>
                                <span className={clsx(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                  badge.className
                                )}>
                                  {badge.label}
                                </span>
                              </div>
                              <h4 className="mt-1 font-medium">{lesson.title}</h4>
                              {lesson.description && (
                                <p className="mt-0.5 text-sm opacity-80 line-clamp-1">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                            <div className="ml-4 flex flex-col items-end gap-1">
                              <span className="text-sm font-medium">
                                {lesson.duration_minutes} min
                              </span>
                              <span className="text-xs capitalize opacity-60">
                                {lesson.lesson_type}
                              </span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
