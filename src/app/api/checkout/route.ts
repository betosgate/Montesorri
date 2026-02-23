import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeServer } from '@/lib/stripe/server'

export async function POST(request: Request) {
  try {
    // Authenticate the user via Supabase server client
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const { studentId } = (await request.json()) as { studentId: string }

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Verify the student belongs to this parent
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, first_name, last_name, parent_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    if (student.parent_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: student does not belong to this user' },
        { status: 403 }
      )
    }

    // Look up an existing Stripe customer ID from the subscriptions table
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('parent_id', user.id)
      .limit(1)
      .single()

    let stripeCustomerId = existingSubscription?.stripe_customer_id

    // If no existing customer, create one in Stripe
    if (!stripeCustomerId) {
      const customer = await getStripeServer().customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      stripeCustomerId = customer.id
    }

    // Create a Stripe Checkout session in subscription mode
    const session = await getStripeServer().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        student_id: studentId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          student_id: studentId,
        },
      },
      success_url: `${request.headers.get('origin')}/dashboard?checkout=success`,
      cancel_url: `${request.headers.get('origin')}/dashboard?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
