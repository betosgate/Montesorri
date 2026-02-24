import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Profile } from '@/lib/types/database'

function getAcademicWeek(): number {
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

function getDayOfWeek(): number {
  const day = new Date().getDay()
  if (day === 0 || day === 6) return 1
  return day
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as Profile | null
  const displayName = typedProfile?.display_name ?? 'there'

  // Get students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, grade_band')
    .eq('parent_id', user.id)
    .eq('enrollment_status', 'active')

  // Get curriculum level IDs
  const { data: levels } = await supabase
    .from('curriculum_levels')
    .select('id, name')

  const levelMap = Object.fromEntries(
    (levels || []).map((l) => [l.name, l.id])
  )

  const weekNumber = getAcademicWeek()
  const dayOfWeek = getDayOfWeek()

  // Count today's lessons and completed ones per student
  let totalLessons = 0
  let completedLessons = 0

  if (students && students.length > 0) {
    for (const student of students) {
      const levelId = levelMap[student.grade_band]
      if (!levelId) continue

      const { count: lessonCount } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('level_id', levelId)
        .eq('week_number', weekNumber)
        .eq('day_of_week', dayOfWeek)

      const { data: todayLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('level_id', levelId)
        .eq('week_number', weekNumber)
        .eq('day_of_week', dayOfWeek)

      const lessonIds = (todayLessons || []).map(l => l.id)
      totalLessons += lessonCount || 0

      if (lessonIds.length > 0) {
        const { count: doneCount } = await supabase
          .from('student_lesson_progress')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', student.id)
          .eq('status', 'completed')
          .in('lesson_id', lessonIds)

        completedLessons += doneCount || 0
      }
    }
  }

  // Get next upcoming class
  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  let nextClass: { title: string; day: string; time: string; zoom_link: string | null } | null = null
  if (students && students.length > 0) {
    const studentIds = students.map(s => s.id)
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        classes (
          title,
          day_of_week,
          start_time,
          zoom_link
        )
      `)
      .in('student_id', studentIds)
      .eq('status', 'active')
      .limit(1)

    if (enrollments && enrollments.length > 0) {
      const cls = enrollments[0].classes as unknown as { title: string; day_of_week: number; start_time: string; zoom_link: string | null } | null
      if (cls) {
        nextClass = {
          title: cls.title,
          day: dayNames[cls.day_of_week] || 'TBD',
          time: cls.start_time,
          zoom_link: cls.zoom_link,
        }
      }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800">
        Welcome back, {displayName}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Week {weekNumber} &middot; Here&apos;s an overview of your day.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Today's Lessons Card */}
        <Link
          href="/dashboard/lessons"
          className="group rounded-lg border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-sm font-medium text-stone-500">Today&apos;s Lessons</h2>
          {totalLessons > 0 ? (
            <>
              <p className="mt-2 text-3xl font-semibold text-stone-800">
                {completedLessons}/{totalLessons}
              </p>
              <div className="mt-3 h-2 w-full rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-stone-400">
                {totalLessons - completedLessons} remaining
              </p>
            </>
          ) : (
            <p className="mt-2 text-lg text-stone-300">No lessons today</p>
          )}
          <p className="mt-3 text-xs font-medium text-green-700 opacity-0 transition-opacity group-hover:opacity-100">
            View lessons &rarr;
          </p>
        </Link>

        {/* Next Zoom Class Card */}
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-sm font-medium text-stone-500">Next Zoom Class</h2>
          {nextClass ? (
            <>
              <p className="mt-2 text-lg font-semibold text-stone-800">{nextClass.title}</p>
              <p className="mt-1 text-sm text-stone-500">
                {nextClass.day} at {nextClass.time}
              </p>
              {nextClass.zoom_link && (
                <a
                  href={nextClass.zoom_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Join Class
                </a>
              )}
            </>
          ) : (
            <p className="mt-2 text-lg text-stone-300">No classes scheduled</p>
          )}
        </div>

        {/* Students Card */}
        <Link
          href="/dashboard/students"
          className="group rounded-lg border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-sm font-medium text-stone-500">My Students</h2>
          {students && students.length > 0 ? (
            <div className="mt-3 space-y-2">
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">{s.first_name}</span>
                  <span className="text-xs text-stone-400 capitalize">
                    {s.grade_band.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-lg text-stone-300">No students yet</p>
          )}
          <p className="mt-3 text-xs font-medium text-green-700 opacity-0 transition-opacity group-hover:opacity-100">
            Manage students &rarr;
          </p>
        </Link>
      </div>
    </div>
  )
}
