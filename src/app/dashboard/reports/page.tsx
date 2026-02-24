import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, grade_band')
    .eq('parent_id', user.id)
    .eq('enrollment_status', 'active')

  // Get lesson progress counts per student
  const progressData: {
    student: { id: string; first_name: string; grade_band: string }
    lessonsCompleted: number
    totalLessons: number
    observationCount: number
    attendanceDays: number
  }[] = []

  for (const student of (students || [])) {
    const { count: completed } = await supabase
      .from('student_lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student.id)
      .eq('status', 'completed')

    const { count: obsCount } = await supabase
      .from('observations')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student.id)

    // Estimate attendance from completed lessons (unique days)
    const { data: completedDays } = await supabase
      .from('student_lesson_progress')
      .select('completed_at')
      .eq('student_id', student.id)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)

    const uniqueDays = new Set(
      (completedDays || []).map(d => d.completed_at?.slice(0, 10)).filter(Boolean)
    )

    progressData.push({
      student: { id: student.id, first_name: student.first_name, grade_band: student.grade_band },
      lessonsCompleted: completed || 0,
      totalLessons: 180 * 5, // estimate: 36 weeks * 5 days * 5 lessons
      observationCount: obsCount || 0,
      attendanceDays: uniqueDays.size,
    })
  }

  const GRADE_LABELS: Record<string, string> = {
    primary: 'Primary (K)',
    lower_elementary: 'Lower Elementary (1-3)',
    upper_elementary: 'Upper Elementary (4-6)',
  }

  const reportTypes = [
    { name: 'Attendance Log', description: 'Days with completed lessons, suitable for state attendance requirements', icon: 'calendar' },
    { name: 'Subject Coverage', description: 'Hours spent per subject area with state standard alignment', icon: 'chart' },
    { name: 'Progress Narrative', description: 'Written summary of student growth per subject (quarterly)', icon: 'document' },
    { name: 'Portfolio Export', description: 'PDF compilation of featured portfolio items', icon: 'photo' },
    { name: 'Common Core Crosswalk', description: 'Montessori scope mapped to Common Core State Standards', icon: 'link' },
    { name: 'Annual Summary', description: 'Year-end comprehensive report for homeschool records', icon: 'star' },
  ]

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-800">Reports</h2>
      <p className="mt-1 text-sm text-stone-500">
        Generate compliance reports for your state homeschool requirements.
      </p>

      {/* Student summary cards */}
      <div className="mt-6 space-y-3">
        {progressData.map(({ student, lessonsCompleted, observationCount, attendanceDays }) => (
          <div key={student.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-800">{student.first_name}</p>
                <p className="text-xs text-stone-400">{GRADE_LABELS[student.grade_band]}</p>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-stone-800">{attendanceDays}</p>
                  <p className="text-[10px] text-stone-400">Attendance Days</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-stone-800">{lessonsCompleted}</p>
                  <p className="text-[10px] text-stone-400">Lessons Done</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-stone-800">{observationCount}</p>
                  <p className="text-[10px] text-stone-400">Observations</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report types */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Available Reports</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {reportTypes.map(report => (
            <button
              key={report.name}
              className="rounded-lg border border-stone-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
            >
              <p className="font-medium text-stone-800">{report.name}</p>
              <p className="mt-1 text-xs text-stone-400">{report.description}</p>
              <p className="mt-2 text-xs font-medium text-green-700">Generate Report</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
