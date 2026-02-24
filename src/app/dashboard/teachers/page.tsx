import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TeachersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Get all teachers with profile info
  const { data: teachers } = await supabase
    .from('teachers')
    .select(`
      *,
      profiles:user_id (
        display_name,
        avatar_url
      )
    `)
    .order('created_at')

  // Get class counts per teacher
  const { data: classes } = await supabase
    .from('classes')
    .select('teacher_id, status')
    .eq('status', 'active')

  const classCounts: Record<string, number> = {}
  for (const cls of (classes || [])) {
    classCounts[cls.teacher_id] = (classCounts[cls.teacher_id] || 0) + 1
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-800">Teachers</h2>
          <p className="mt-1 text-sm text-stone-500">
            Manage your teaching staff. {(teachers || []).length} total.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {(!teachers || teachers.length === 0) ? (
          <p className="text-center text-sm text-stone-500 py-8">No teachers registered yet.</p>
        ) : (
          (teachers || []).map(teacher => {
            const profile = teacher.profiles as unknown as { display_name: string | null; avatar_url: string | null } | null
            const activeClasses = classCounts[teacher.id] || 0

            return (
              <div key={teacher.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 font-medium text-sm">
                    {(profile?.display_name || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">{profile?.display_name || 'Unnamed Teacher'}</p>
                    <p className="text-xs text-stone-400">
                      {activeClasses} active class{activeClasses !== 1 ? 'es' : ''} &middot; Max {teacher.max_classes}
                      {teacher.is_substitute && ' (Substitute)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    teacher.is_active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {teacher.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
