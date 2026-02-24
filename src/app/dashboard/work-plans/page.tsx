import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkPlanBuilder } from '@/components/work-plan/builder'

export default async function WorkPlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, grade_band')
    .eq('parent_id', user.id)
    .eq('enrollment_status', 'active')

  // Get subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, display_name, color')
    .order('sort_order')

  // Get curriculum levels
  const { data: levels } = await supabase
    .from('curriculum_levels')
    .select('id, name')

  // Calculate current academic week
  const now = new Date()
  const startMonth = 8
  const startYear = now.getMonth() >= startMonth ? now.getFullYear() : now.getFullYear() - 1
  const academicStart = new Date(startYear, startMonth, 1)
  while (academicStart.getDay() !== 1) academicStart.setDate(academicStart.getDate() + 1)
  const weekNum = Math.max(1, Math.min(36, Math.floor((now.getTime() - academicStart.getTime()) / (7 * 86400000)) + 1))

  // Get existing work plans for current student (we'll let client filter)
  const studentIds = (students || []).map(s => s.id)
  const { data: workPlans } = studentIds.length > 0
    ? await supabase
        .from('work_plans')
        .select('*')
        .in('student_id', studentIds)
        .eq('week_number', weekNum)
    : { data: [] }

  // Get lessons for current week for all levels
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
      lesson_type,
      subjects!subject_id (
        name,
        display_name,
        color
      )
    `)
    .eq('week_number', weekNum)
    .order('day_of_week')
    .order('sort_order')

  return (
    <div>
      <div>
        <h2 className="text-xl font-semibold text-stone-800">Work Plans</h2>
        <p className="mt-1 text-sm text-stone-500">
          Plan and customize your weekly learning schedule. Week {weekNum} of 36.
        </p>
      </div>

      <div className="mt-6">
        <WorkPlanBuilder
          students={students || []}
          subjects={subjects || []}
          levels={levels || []}
          lessons={lessons || []}
          workPlans={workPlans || []}
          currentWeek={weekNum}
        />
      </div>
    </div>
  )
}
