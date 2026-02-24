import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ObservationForm } from '@/components/tracking/observation-form'

export default async function ObservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all observations for user's students
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('parent_id', user.id)

  const studentIds = (students || []).map((s) => s.id)

  const { data: observations } = await supabase
    .from('observations')
    .select('*')
    .in('student_id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000'])
    .order('observation_date', { ascending: false })
    .limit(50)

  // Get student names for display
  const { data: studentNames } = await supabase
    .from('students')
    .select('id, first_name')
    .in('id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000'])

  const nameMap = Object.fromEntries(
    (studentNames || []).map((s) => [s.id, s.first_name])
  )

  const typeLabels: Record<string, string> = {
    anecdotal: 'Anecdotal',
    work_log: 'Work Log',
    concentration: 'Concentration',
    social_emotional: 'Social-Emotional',
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-800">Observation Journal</h2>
      <p className="mt-1 text-sm text-stone-500">
        Record observations about your child&apos;s work, concentration, and development.
      </p>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-stone-700">Quick Entry</h3>
        <div className="mt-2">
          <ObservationForm />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-medium text-stone-700">Recent Observations</h3>
        {observations && observations.length > 0 ? (
          <div className="mt-4 space-y-3">
            {observations.map((obs) => (
              <div
                key={obs.id}
                className="rounded-lg border border-stone-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-stone-700">
                      {nameMap[obs.student_id] || 'Unknown'}
                    </span>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                      {typeLabels[obs.observation_type] || obs.observation_type}
                    </span>
                    {obs.curriculum_area && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                        {obs.curriculum_area}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-400">{obs.observation_date}</span>
                </div>
                <p className="mt-2 text-sm text-stone-600">{obs.content}</p>
                <div className="mt-2 flex gap-4 text-xs text-stone-400">
                  {obs.concentration_duration && (
                    <span>Concentration: {obs.concentration_duration} min</span>
                  )}
                  {obs.independence_level && (
                    <span className="capitalize">
                      {obs.independence_level.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">No observations recorded yet.</p>
        )}
      </div>
    </div>
  )
}
