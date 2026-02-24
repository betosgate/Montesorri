import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function StudentLessonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Calculate academic week and day
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon...
  const academicDay = dayOfWeek >= 1 && dayOfWeek <= 5 ? dayOfWeek : 0

  const startMonth = 8
  const startYear = now.getMonth() >= startMonth ? now.getFullYear() : now.getFullYear() - 1
  const academicStart = new Date(startYear, startMonth, 1)
  while (academicStart.getDay() !== 1) academicStart.setDate(academicStart.getDate() + 1)
  const weekNum = Math.max(1, Math.min(36, Math.floor((now.getTime() - academicStart.getTime()) / (7 * 86400000)) + 1))

  // Get lessons for this week
  const { data: lessons } = await supabase
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

  const todayLessons = (lessons || []).filter(l => l.day_of_week === academicDay)
  const DAY_NAMES = ['Weekend', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-800">My Lessons</h2>
      <p className="mt-1 text-sm text-stone-500">
        Week {weekNum} &middot; {DAY_NAMES[academicDay] || 'Weekend'}
      </p>

      {academicDay === 0 ? (
        <div className="mt-8 rounded-xl border border-stone-200 bg-white p-8 text-center">
          <h3 className="text-lg font-medium text-stone-700">It&apos;s the weekend!</h3>
          <p className="mt-2 text-sm text-stone-500">
            Enjoy your time off. Your next lessons start on Monday.
          </p>
        </div>
      ) : todayLessons.length === 0 ? (
        <p className="mt-8 text-center text-sm text-stone-500 py-8">
          No lessons loaded for today yet.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {todayLessons.map((lesson, i) => {
            const subj = lesson.subjects as unknown as { display_name: string; color: string | null } | null
            return (
              <Link
                key={lesson.id}
                href={`/dashboard/lessons/${lesson.id}`}
                className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: subj?.color || '#999' }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800">{lesson.title}</p>
                  <p className="text-xs text-stone-400">
                    {subj?.display_name} &middot; {lesson.duration_minutes} min
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-stone-300">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
