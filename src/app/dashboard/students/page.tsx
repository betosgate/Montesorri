import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AddStudentForm } from '@/components/students/add-student-form'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('parent_id', user.id)
    .order('created_at')

  const gradeBandLabels: Record<string, string> = {
    primary: 'Primary (K)',
    lower_elementary: 'Lower Elementary (1-3)',
    upper_elementary: 'Upper Elementary (4-6)',
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-800">My Students</h2>
          <p className="mt-1 text-sm text-stone-500">
            Manage your children&apos;s profiles and enrollment.
          </p>
        </div>
      </div>

      {/* Student cards */}
      {students && students.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/dashboard/students/${student.id}`}
              className="group rounded-lg border border-stone-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 font-semibold">
                  {student.first_name[0]}
                </div>
                <div>
                  <h3 className="font-medium text-stone-800">
                    {student.first_name} {student.last_name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {gradeBandLabels[student.grade_band] || student.grade_band}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className={
                  student.enrollment_status === 'active'
                    ? 'text-green-600 font-medium'
                    : 'text-stone-400'
                }>
                  {student.enrollment_status === 'active' ? 'Active' : student.enrollment_status}
                </span>
                <span className="text-stone-400">
                  Week {student.start_week} start
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center">
          <p className="text-stone-500">No students added yet.</p>
        </div>
      )}

      {/* Add student form */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-stone-700">Add a Student</h3>
        <AddStudentForm />
      </div>
    </div>
  )
}
