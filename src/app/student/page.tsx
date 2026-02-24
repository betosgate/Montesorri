import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function StudentHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // For student accounts, the user IS the student (via parent linking)
  // Get the student record linked to this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  // Calculate academic week
  const now = new Date()
  const startMonth = 8
  const startYear = now.getMonth() >= startMonth ? now.getFullYear() : now.getFullYear() - 1
  const academicStart = new Date(startYear, startMonth, 1)
  while (academicStart.getDay() !== 1) academicStart.setDate(academicStart.getDate() + 1)
  const weekNum = Math.max(1, Math.min(36, Math.floor((now.getTime() - academicStart.getTime()) / (7 * 86400000)) + 1))

  // Get upcoming Zoom classes
  const today = now.toISOString().slice(0, 10)
  const { data: sessions } = await supabase
    .from('class_sessions')
    .select(`
      id,
      session_date,
      start_time,
      duration_minutes,
      zoom_link,
      classes!class_id (
        title
      )
    `)
    .gte('session_date', today)
    .order('session_date')
    .limit(3)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800">
        Hello, {profile?.display_name || 'Student'}!
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Week {weekNum} of 36 &middot; {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* Today's Work card */}
        <Link
          href="/student/lessons"
          className="rounded-xl border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-medium text-stone-800">Today&apos;s Work</h2>
          <p className="mt-2 text-sm text-stone-500">
            See your lessons and activities for today. Mark them off as you go!
          </p>
          <p className="mt-4 text-sm font-medium text-green-700">Start Learning</p>
        </Link>

        {/* My Progress card */}
        <Link
          href="/student/progress"
          className="rounded-xl border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-lg font-medium text-stone-800">My Progress</h2>
          <p className="mt-2 text-sm text-stone-500">
            See how far you&apos;ve come and what skills you&apos;re working on.
          </p>
          <p className="mt-4 text-sm font-medium text-green-700">View Progress</p>
        </Link>
      </div>

      {/* Upcoming Zoom classes */}
      {(sessions || []).length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Upcoming Classes</h3>
          <div className="mt-2 space-y-2">
            {(sessions || []).map(session => {
              const cls = session.classes as unknown as { title: string } | null
              const isToday = session.session_date === today
              return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isToday ? 'border-blue-200 bg-blue-50' : 'border-stone-200 bg-white'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-stone-700">{cls?.title || 'Class'}</p>
                    <p className="text-xs text-stone-400">
                      {new Date(session.session_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' '}&middot; {session.start_time}
                    </p>
                  </div>
                  {session.zoom_link && isToday && (
                    <a
                      href={session.zoom_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      Join Now
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
