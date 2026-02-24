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

function getAcademicWeek(): number {
  // Simple calculation: assume academic year starts first Monday of September
  const now = new Date()
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  const sept1 = new Date(year, 8, 1)
  // Find first Monday of September
  const firstMonday = new Date(sept1)
  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() + 1)
  }
  const diffMs = now.getTime() - firstMonday.getTime()
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(36, diffWeeks))
}

function getDayOfWeek(): number {
  const day = new Date().getDay()
  // Convert Sunday=0...Saturday=6 to Monday=1...Friday=5
  if (day === 0 || day === 6) return 1 // Weekend defaults to Monday
  return day
}

export default async function TodaysLessonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get the parent's students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, grade_band')
    .eq('parent_id', user.id)
    .eq('enrollment_status', 'active')

  if (!students || students.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-stone-800">Today&apos;s Lessons</h2>
        <p className="mt-2 text-sm text-stone-600">
          No active students found. Add a student to get started.
        </p>
      </div>
    )
  }

  const weekNumber = getAcademicWeek()
  const dayOfWeek = getDayOfWeek()

  // Get curriculum level IDs
  const { data: levels } = await supabase
    .from('curriculum_levels')
    .select('id, name')

  const levelMap = Object.fromEntries(
    (levels || []).map((l) => [l.name, l.id])
  )

  // For each student, get today's lessons
  const studentLessons = await Promise.all(
    students.map(async (student) => {
      const levelId = levelMap[student.grade_band]
      if (!levelId) return { student, lessons: [] }

      const { data: lessons } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          duration_minutes,
          lesson_type,
          sort_order,
          subjects (
            name,
            display_name,
            icon,
            color
          )
        `)
        .eq('level_id', levelId)
        .eq('week_number', weekNumber)
        .eq('day_of_week', dayOfWeek)
        .order('sort_order')

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

  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const completedCount = studentLessons.reduce(
    (sum, sl) => sum + sl.lessons.filter((l) => l.progress === 'completed').length,
    0
  )
  const totalCount = studentLessons.reduce(
    (sum, sl) => sum + sl.lessons.length,
    0
  )

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-800">Today&apos;s Lessons</h2>
          <p className="mt-1 text-sm text-stone-500">
            Week {weekNumber} &middot; {dayNames[dayOfWeek]} &middot;{' '}
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
              No lessons found for today. Check back on a weekday or verify curriculum is loaded.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {lessons.map((lesson) => {
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
          )}
        </div>
      ))}
    </div>
  )
}
