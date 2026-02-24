import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get teacher record
  const { data: teacher } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!teacher) {
    return (
      <div className="py-12 text-center">
        <p className="text-stone-500">You are not registered as a teacher.</p>
      </div>
    )
  }

  // Get teacher's classes
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacher.id)
    .eq('status', 'active')
    .order('day_of_week')
    .order('start_time')

  // Get upcoming sessions
  const today = new Date().toISOString().slice(0, 10)
  const { data: sessions } = await supabase
    .from('class_sessions')
    .select(`
      *,
      classes!class_id (
        title,
        grade_band
      )
    `)
    .in('class_id', (classes || []).map(c => c.id))
    .gte('session_date', today)
    .order('session_date')
    .order('start_time')
    .limit(20)

  const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-800">My Schedule</h2>
          <p className="mt-1 text-sm text-stone-500">Your teaching schedule and upcoming sessions.</p>
        </div>
        {teacher.zoom_link && (
          <a
            href={teacher.zoom_link}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open Zoom
          </a>
        )}
      </div>

      {/* Weekly schedule */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Weekly Classes</h3>
        <div className="mt-2 space-y-2">
          {(!classes || classes.length === 0) ? (
            <p className="text-sm text-stone-400 py-4">No classes assigned yet.</p>
          ) : (
            (classes || []).map(cls => (
              <div key={cls.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
                <div>
                  <p className="font-medium text-stone-800">{cls.title}</p>
                  <p className="text-xs text-stone-400">
                    {DAY_NAMES[cls.day_of_week]}s at {cls.start_time} &middot; {cls.duration_minutes} min &middot; Max {cls.max_students} students
                  </p>
                </div>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                  {cls.grade_band === 'primary' ? 'Primary' : cls.grade_band === 'lower_elementary' ? 'Lower El' : 'Upper El'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Upcoming Sessions</h3>
        <div className="mt-2 space-y-2">
          {(!sessions || sessions.length === 0) ? (
            <p className="text-sm text-stone-400 py-4">No upcoming sessions.</p>
          ) : (
            (sessions || []).map(session => {
              const cls = session.classes as unknown as { title: string; grade_band: string } | null
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
                  {session.zoom_link && (
                    <a
                      href={session.zoom_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                        isToday ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {isToday ? 'Join Now' : 'Zoom Link'}
                    </a>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
