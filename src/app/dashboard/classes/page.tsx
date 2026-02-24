import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EnrollmentPicker } from '@/components/classes/enrollment-picker'

export default async function ClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get parent's students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, grade_band')
    .eq('parent_id', user.id)
    .eq('enrollment_status', 'active')

  // Get available classes with teacher info
  const { data: classes } = await supabase
    .from('classes')
    .select(`
      *,
      teachers!teacher_id (
        user_id,
        bio,
        zoom_link,
        profiles:user_id (
          display_name
        )
      )
    `)
    .eq('status', 'active')
    .order('day_of_week')
    .order('start_time')

  // Get existing enrollments for this parent's students
  const studentIds = (students || []).map(s => s.id)
  const { data: enrollments } = studentIds.length > 0
    ? await supabase
        .from('enrollments')
        .select('id, student_id, class_id, status')
        .in('student_id', studentIds)
        .eq('status', 'active')
    : { data: [] }

  // Get upcoming sessions
  const today = new Date().toISOString().slice(0, 10)
  const { data: sessions } = await supabase
    .from('class_sessions')
    .select(`
      id,
      session_date,
      start_time,
      duration_minutes,
      zoom_link,
      class_id,
      classes!class_id (
        title,
        grade_band
      )
    `)
    .gte('session_date', today)
    .order('session_date')
    .limit(10)

  return (
    <div>
      <div>
        <h2 className="text-xl font-semibold text-stone-800">Classes</h2>
        <p className="mt-1 text-sm text-stone-500">
          Browse and enroll in live Zoom classes with certified Montessori teachers.
        </p>
      </div>

      {/* Upcoming sessions */}
      {(sessions || []).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Upcoming Classes</h3>
          <div className="mt-2 space-y-2">
            {(sessions || []).map(session => {
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
                      {' '}&middot; {session.start_time} &middot; {session.duration_minutes} min
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

      {/* Class enrollment */}
      <div className="mt-6">
        <EnrollmentPicker
          students={students || []}
          classes={classes || []}
          enrollments={enrollments || []}
        />
      </div>
    </div>
  )
}
