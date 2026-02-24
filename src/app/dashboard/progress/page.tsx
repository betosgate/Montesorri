import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MasteryMap } from '@/components/progress/mastery-map'
import type { MasteryStatus } from '@/lib/types/database'

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, grade_band')
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

  // For each student, get scope items and mastery data
  const studentProgressData: {
    student: { id: string; first_name: string; grade_band: string }
    masteryBySubject: Record<string, {
      items: { id: string; name: string; sub_area: string | null; status: MasteryStatus; sort_order: number }[]
    }>
  }[] = []

  for (const student of (students || [])) {
    const levelId = levels?.find(l => l.name === student.grade_band)?.id
    if (!levelId) continue

    // Get scope items for this level
    const { data: scopeItems } = await supabase
      .from('scope_sequence_items')
      .select('id, name, sub_area, subject_id, sort_order')
      .eq('level_id', levelId)
      .order('sort_order')

    // Get mastery records for this student
    const { data: masteryRecords } = await supabase
      .from('student_mastery')
      .select('scope_item_id, status')
      .eq('student_id', student.id)

    const masteryMap: Record<string, MasteryStatus> = {}
    for (const m of (masteryRecords || [])) {
      masteryMap[m.scope_item_id] = m.status as MasteryStatus
    }

    // Group by subject
    const masteryBySubject: Record<string, {
      items: { id: string; name: string; sub_area: string | null; status: MasteryStatus; sort_order: number }[]
    }> = {}

    for (const item of (scopeItems || [])) {
      if (!masteryBySubject[item.subject_id]) {
        masteryBySubject[item.subject_id] = { items: [] }
      }
      masteryBySubject[item.subject_id].items.push({
        id: item.id,
        name: item.name,
        sub_area: item.sub_area,
        status: masteryMap[item.id] || 'not_introduced',
        sort_order: item.sort_order,
      })
    }

    studentProgressData.push({
      student: { id: student.id, first_name: student.first_name, grade_band: student.grade_band },
      masteryBySubject,
    })
  }

  return (
    <div>
      <div>
        <h2 className="text-xl font-semibold text-stone-800">Progress</h2>
        <p className="mt-1 text-sm text-stone-500">
          Visual overview of skill mastery across all subjects.
        </p>
      </div>

      {studentProgressData.length === 0 ? (
        <p className="mt-8 text-center text-sm text-stone-500">
          No students found. Add a student to start tracking progress.
        </p>
      ) : (
        studentProgressData.map(({ student, masteryBySubject }) => (
          <div key={student.id} className="mt-6">
            <h3 className="text-lg font-medium text-stone-700">
              {student.first_name}
              <span className="ml-2 text-sm font-normal text-stone-400">
                {student.grade_band === 'primary' ? 'Primary (K)' :
                 student.grade_band === 'lower_elementary' ? 'Lower Elementary (1-3)' :
                 'Upper Elementary (4-6)'}
              </span>
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(subjects || []).map(subject => {
                const subjectData = masteryBySubject[subject.id]
                if (!subjectData || subjectData.items.length === 0) return null

                return (
                  <MasteryMap
                    key={subject.id}
                    items={subjectData.items}
                    subjectName={subject.display_name}
                    subjectColor={subject.color || '#999'}
                  />
                )
              })}
            </div>

            {Object.keys(masteryBySubject).length === 0 && (
              <p className="mt-4 text-sm text-stone-400">
                No scope &amp; sequence data loaded yet. Mastery tracking will appear once curriculum data is seeded.
              </p>
            )}
          </div>
        ))
      )}
    </div>
  )
}
