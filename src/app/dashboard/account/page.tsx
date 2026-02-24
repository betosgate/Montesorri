import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountForm } from '@/components/account/account-form'
import { SubscriptionCard } from '@/components/account/subscription-card'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select(`
      *,
      students!student_id (
        first_name,
        last_name,
        grade_band
      )
    `)
    .eq('parent_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-800">Account Settings</h2>
      <p className="mt-1 text-sm text-stone-500">
        Manage your profile and subscriptions.
      </p>

      {/* Profile section */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Profile</h3>
        <div className="mt-2">
          <AccountForm
            profile={{
              display_name: profile?.display_name || '',
              phone: profile?.phone || '',
              timezone: profile?.timezone || 'America/New_York',
            }}
            email={user.email || ''}
          />
        </div>
      </div>

      {/* Subscriptions section */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Subscriptions</h3>
        <div className="mt-2 space-y-3">
          {(!subscriptions || subscriptions.length === 0) ? (
            <p className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-500">
              No active subscriptions. Enroll a student to get started.
            </p>
          ) : (
            (subscriptions || []).map(sub => {
              const student = sub.students as unknown as { first_name: string; last_name: string; grade_band: string } | null
              return (
                <SubscriptionCard
                  key={sub.id}
                  studentName={student ? `${student.first_name} ${student.last_name}` : 'Unknown'}
                  gradeBand={student?.grade_band || ''}
                  status={sub.status}
                  currentPeriodEnd={sub.current_period_end}
                  cancelAtPeriodEnd={sub.cancel_at_period_end}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
