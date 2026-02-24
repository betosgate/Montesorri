import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'
import { weeklySummaryEmail } from '@/lib/email/templates'
import { NextResponse } from 'next/server'

// This endpoint should be called weekly by a cron scheduler (e.g., Vercel Cron)
// Protected by a secret token to prevent unauthorized access
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get all active students with parent info
  const { data: students } = await supabase
    .from('students')
    .select(`
      id,
      first_name,
      parent_id,
      profiles!parent_id (
        display_name
      )
    `)
    .eq('enrollment_status', 'active')

  // Calculate current week
  const now = new Date()
  const startMonth = 8
  const startYear = now.getMonth() >= startMonth ? now.getFullYear() : now.getFullYear() - 1
  const academicStart = new Date(startYear, startMonth, 1)
  while (academicStart.getDay() !== 1) academicStart.setDate(academicStart.getDate() + 1)
  const weekNum = Math.max(1, Math.min(36, Math.floor((now.getTime() - academicStart.getTime()) / (7 * 86400000)) + 1))

  let emailsSent = 0

  for (const student of (students || [])) {
    // Get lesson completion for this week
    const { count: completed } = await supabase
      .from('student_lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student.id)
      .eq('status', 'completed')

    const { count: observations } = await supabase
      .from('observations')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student.id)

    // Get parent email
    const { data: auth } = await supabase.auth.admin.getUserById(student.parent_id)
    const parentEmail = auth?.user?.email
    if (!parentEmail) continue

    const parentProfile = student.profiles as unknown as { display_name: string } | null

    const html = weeklySummaryEmail({
      parentName: parentProfile?.display_name || 'Parent',
      studentName: student.first_name,
      weekNumber: weekNum,
      lessonsCompleted: completed || 0,
      totalLessons: 25, // ~5 lessons/day * 5 days
      observationCount: observations || 0,
      upcomingClassName: null,
      upcomingClassDay: null,
    })

    await sendEmail({
      to: parentEmail,
      subject: `Week ${weekNum} Summary for ${student.first_name}`,
      html,
    })

    emailsSent++
  }

  return NextResponse.json({ success: true, emailsSent })
}
