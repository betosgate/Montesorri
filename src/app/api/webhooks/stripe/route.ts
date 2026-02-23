import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeServer } from '@/lib/stripe/server'

// Use service role client -- webhooks have no user context
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const stripeServer = getStripeServer()
  let event
  try {
    event = stripeServer.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id
        const studentId = session.metadata?.student_id
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.toString()
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.toString()

        if (userId && studentId && subscriptionId) {
          await supabaseAdmin.from('subscriptions').insert({
            parent_id: userId,
            student_id: studentId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            current_period_start: new Date().toISOString(),
          })

          await supabaseAdmin
            .from('students')
            .update({
              enrollment_status: 'active',
              stripe_subscription_id: subscriptionId,
            })
            .eq('id', studentId)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        const subscriptionId = ((invoice as unknown) as Record<string, unknown>).subscription as string | undefined

        if (!subscriptionId) break

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', subscriptionId)

        const { data: subRecord } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (subRecord) {
          await supabaseAdmin.from('payment_history').insert({
            subscription_id: subRecord.id,
            stripe_invoice_id: invoice.id,
            amount_cents: invoice.amount_paid ?? 0,
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subscriptionId = ((invoice as unknown) as Record<string, unknown>).subscription as string | undefined

        if (!subscriptionId) break

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id)

        await supabaseAdmin
          .from('students')
          .update({ enrollment_status: 'withdrawn' })
          .eq('stripe_subscription_id', subscription.id)
        break
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
