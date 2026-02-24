import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { student_id, scope_item_id, status, notes } = body

  if (!student_id || !scope_item_id || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify the student belongs to this parent
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', student_id)
    .eq('parent_id', user.id)
    .single()

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {
    student_id,
    scope_item_id,
    status,
    notes: notes || null,
    updated_at: now,
  }

  if (status === 'presented') {
    updates.date_presented = now
  }
  if (status === 'mastered' || status === 'applied') {
    updates.date_mastered = now
  }

  const { data, error } = await supabase
    .from('student_mastery')
    .upsert(updates, { onConflict: 'student_id,scope_item_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id')
  const subjectId = searchParams.get('subject_id')

  if (!studentId) {
    return NextResponse.json({ error: 'student_id required' }, { status: 400 })
  }

  let query = supabase
    .from('student_mastery')
    .select(`
      *,
      scope_sequence_items!scope_item_id (
        name,
        sub_area,
        subject_id,
        sort_order
      )
    `)
    .eq('student_id', studentId)

  if (subjectId) {
    query = query.eq('scope_sequence_items.subject_id', subjectId)
  }

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
