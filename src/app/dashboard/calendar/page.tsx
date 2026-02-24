import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MonthView } from '@/components/calendar/month-view'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get parent's students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, grade_band')
    .eq('parent_id', user.id)
    .eq('enrollment_status', 'active')

  // Get all subjects for color coding
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, display_name, color')
    .order('sort_order')

  // Get curriculum levels
  const { data: levels } = await supabase
    .from('curriculum_levels')
    .select('id, name')

  // Get lessons for this month (we'll fetch broader and let client filter)
  const { data: lessons } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      week_number,
      day_of_week,
      duration_minutes,
      level_id,
      subject_id,
      subjects!subject_id (
        name,
        display_name,
        color
      )
    `)
    .order('week_number')
    .order('day_of_week')
    .order('sort_order')

  // Get class sessions (Zoom classes)
  const { data: sessions } = await supabase
    .from('class_sessions')
    .select(`
      id,
      session_date,
      start_time,
      duration_minutes,
      zoom_link,
      classes!class_id (
        title,
        grade_band
      )
    `)
    .order('session_date')

  return (
    <div>
      <div>
        <h2 className="text-xl font-semibold text-stone-800">Calendar</h2>
        <p className="mt-1 text-sm text-stone-500">
          View your curriculum schedule by month, week, or day.
        </p>
      </div>

      <div className="mt-6">
        <MonthView
          students={students || []}
          subjects={subjects || []}
          levels={levels || []}
          lessons={lessons || []}
          sessions={sessions || []}
        />
      </div>
    </div>
  )
}
