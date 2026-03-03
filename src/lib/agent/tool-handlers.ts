import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { searchFAQ } from './faq-search'
import stateRequirements from '../../../scripts/data/state-homeschool-requirements.json'
import subjectMapping from '../../../scripts/data/subject-mapping.json'

// Stripe API helper — direct fetch, no SDK needed in tool handlers
async function stripeRequest(
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, string>
): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  })
  return res.json() as Promise<Record<string, unknown>>
}

// Service-role Supabase client for admin operations (support tickets, payment updates)
function getAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const MONTESSORI_SUBJECTS = [
  'Mathematics (including Geometry)',
  'English Language Arts (Reading, Writing, Spelling, Grammar)',
  'Science (Physical, Life, Earth Sciences)',
  'Social Studies (Geography, History, Cultural Studies)',
  'Practical Life Skills (Health, Safety, Life Skills)',
  'Art and Music',
  'Sensorial Development',
  'Physical Education (integrated movement activities)',
]

const GRADE_LABELS: Record<string, string> = {
  primary: 'Kindergarten (Primary, Ages 3-6)',
  lower_elementary: 'Grades 1-3 (Lower Elementary, Ages 6-9)',
  upper_elementary: 'Grades 4-6 (Upper Elementary, Ages 9-12)',
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    switch (name) {
      case 'search_faq':
        return handleSearchFAQ(input, supabase, userId)

      case 'get_user_profile':
        return handleGetUserProfile(supabase, userId)

      case 'get_students':
        return handleGetStudents(supabase, userId)

      case 'get_state_requirements':
        return handleGetStateRequirements(input)

      case 'get_attendance_data':
        return handleGetAttendanceData(input, supabase, userId)

      case 'get_subject_hours':
        return handleGetSubjectHours(input, supabase, userId)

      case 'get_lesson_progress':
        return handleGetLessonProgress(input, supabase, userId)

      case 'update_user_profile':
        return handleUpdateUserProfile(input, supabase, userId)

      case 'generate_notice_of_intent':
        return handleGenerateNotice(supabase, userId)

      case 'check_compliance_status':
        return handleCheckCompliance(supabase, userId)

      case 'get_subscription_details':
        return handleGetSubscriptionDetails(input, supabase, userId)

      case 'cancel_subscription':
        return handleCancelSubscription(input, supabase, userId)

      case 'request_refund':
        return handleRequestRefund(input, supabase, userId)

      case 'escalate_to_support':
        return handleEscalateToSupport(input, userId)

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return JSON.stringify({ error: `Tool execution failed: ${message}` })
  }
}

async function handleSearchFAQ(
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const query = input.query as string
  // Get user's state to filter state-specific FAQs
  const { data: profile } = await supabase
    .from('profiles')
    .select('state_code')
    .eq('id', userId)
    .single()

  const results = searchFAQ(query, profile?.state_code)
  return JSON.stringify({
    results: results.map(r => ({
      question: r.entry.question,
      answer: r.entry.answer,
      category: r.entry.category,
      confidence: Math.round(r.score * 100) / 100,
      related_ids: r.entry.related,
    })),
    total_matches: results.length,
    top_confidence: results[0]?.score ?? 0,
  })
}

async function handleGetUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('display_name, phone, state_code, state_name, address_line1, address_line2, city, state_address, zip_code, email_override, compliance_tracking_enabled')
    .eq('id', userId)
    .single()

  if (error) return JSON.stringify({ error: 'Could not fetch profile' })

  const { data: { user } } = await supabase.auth.getUser()

  return JSON.stringify({
    name: profile.display_name || 'Not set',
    email: user?.email || 'Not available',
    phone: profile.phone || null,
    state_code: profile.state_code || null,
    state_name: profile.state_name || null,
    address: {
      line1: profile.address_line1 || null,
      line2: profile.address_line2 || null,
      city: profile.city || null,
      state: profile.state_address || null,
      zip: profile.zip_code || null,
    },
    email_override: profile.email_override || null,
    compliance_tracking: profile.compliance_tracking_enabled ?? false,
    missing_fields: [
      !profile.display_name && 'name',
      !profile.phone && 'phone',
      !profile.state_code && 'state',
      !profile.address_line1 && 'address',
      !profile.city && 'city',
      !profile.zip_code && 'zip_code',
    ].filter(Boolean),
  })
}

async function handleGetStudents(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: students, error } = await supabase
    .from('students')
    .select('id, first_name, last_name, date_of_birth, grade_band, enrollment_status, academic_year, start_week')
    .eq('parent_id', userId)
    .order('first_name')

  if (error) return JSON.stringify({ error: 'Could not fetch students' })
  if (!students || students.length === 0) {
    return JSON.stringify({ students: [], message: 'No students enrolled. Add students from the dashboard first.' })
  }

  return JSON.stringify({
    students: students.map(s => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      date_of_birth: s.date_of_birth,
      grade_band: s.grade_band,
      grade_label: GRADE_LABELS[s.grade_band] || s.grade_band,
      enrollment_status: s.enrollment_status,
      academic_year: s.academic_year,
      start_week: s.start_week,
    })),
    count: students.length,
  })
}

function handleGetStateRequirements(input: Record<string, unknown>): string {
  const stateCode = (input.state_code as string)?.toUpperCase()
  if (!stateCode || stateCode.length !== 2) {
    return JSON.stringify({ error: 'Invalid state code. Please provide a 2-letter US state code.' })
  }

  const stateData = (stateRequirements.states as unknown as Record<string, unknown>)[stateCode]
  if (!stateData) {
    return JSON.stringify({ error: `No data found for state code: ${stateCode}` })
  }

  return JSON.stringify(stateData)
}

async function handleGetAttendanceData(
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const studentId = input.student_id as string
  if (!studentId) return JSON.stringify({ error: 'student_id is required' })

  // Verify student belongs to parent
  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, parent_id, grade_band')
    .eq('id', studentId)
    .single()

  if (!student || student.parent_id !== userId) {
    return JSON.stringify({ error: 'Student not found or does not belong to this parent' })
  }

  // Get completed lessons with dates
  const { data: completedLessons } = await supabase
    .from('student_lesson_progress')
    .select('completed_at, duration_actual')
    .eq('student_id', studentId)
    .eq('status', 'completed')
    .not('completed_at', 'is', null)

  const uniqueDays = new Set(
    (completedLessons || []).map(d => d.completed_at?.slice(0, 10)).filter(Boolean)
  )

  const totalMinutes = (completedLessons || []).reduce(
    (sum, l) => sum + (l.duration_actual || 30), 0
  )

  // Get state attendance requirement
  const { data: profile } = await supabase
    .from('profiles')
    .select('state_code')
    .eq('id', userId)
    .single()

  let daysRequired: number | null = null
  if (profile?.state_code) {
    const sd = (stateRequirements.states as unknown as Record<string, { requirements?: { attendance_tracking?: { days_required?: number | null } } }>)[profile.state_code]
    daysRequired = sd?.requirements?.attendance_tracking?.days_required ?? null
  }

  return JSON.stringify({
    student_name: student.first_name,
    total_school_days: uniqueDays.size,
    total_lessons_completed: completedLessons?.length || 0,
    total_instruction_minutes: totalMinutes,
    total_instruction_hours: Math.round(totalMinutes / 60 * 10) / 10,
    days_required: daysRequired,
    progress_percentage: daysRequired ? Math.round((uniqueDays.size / daysRequired) * 100) : null,
    on_track: daysRequired ? uniqueDays.size >= (daysRequired * 0.9 * (new Date().getMonth() >= 7 ? (new Date().getMonth() - 7) / 10 : (new Date().getMonth() + 5) / 10)) : null,
  })
}

async function handleGetSubjectHours(
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const studentId = input.student_id as string
  if (!studentId) return JSON.stringify({ error: 'student_id is required' })

  // Verify ownership
  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, parent_id, grade_band')
    .eq('id', studentId)
    .single()

  if (!student || student.parent_id !== userId) {
    return JSON.stringify({ error: 'Student not found or does not belong to this parent' })
  }

  // Get completed lessons with subject info
  const { data: progress } = await supabase
    .from('student_lesson_progress')
    .select(`
      duration_actual,
      lesson:lessons(subject_id, duration_minutes, title)
    `)
    .eq('student_id', studentId)
    .eq('status', 'completed')

  // Get subject names
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, display_name')

  const subjectMap = new Map((subjects || []).map(s => [s.id, s]))

  // Tally hours per subject
  const hoursBySubject: Record<string, number> = {}
  for (const p of (progress || [])) {
    const lesson = p.lesson as unknown as { subject_id: string; duration_minutes: number } | null
    if (!lesson) continue
    const subject = subjectMap.get(lesson.subject_id)
    const name = subject?.display_name || subject?.name || 'Unknown'
    const minutes = p.duration_actual || lesson.duration_minutes || 30
    hoursBySubject[name] = (hoursBySubject[name] || 0) + minutes
  }

  // Convert to hours
  const breakdown = Object.entries(hoursBySubject)
    .map(([subject, minutes]) => ({
      subject,
      minutes,
      hours: Math.round(minutes / 60 * 10) / 10,
    }))
    .sort((a, b) => b.minutes - a.minutes)

  // Map to state subjects using subject mapping
  const stateMapping = (subjectMapping as { montessori_to_state?: Record<string, string[]> }).montessori_to_state || {}

  return JSON.stringify({
    student_name: student.first_name,
    breakdown,
    total_hours: Math.round(breakdown.reduce((s, b) => s + b.hours, 0) * 10) / 10,
    state_subject_mapping: stateMapping,
  })
}

async function handleGetLessonProgress(
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const studentId = input.student_id as string
  if (!studentId) return JSON.stringify({ error: 'student_id is required' })

  // Verify ownership
  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, parent_id, grade_band')
    .eq('id', studentId)
    .single()

  if (!student || student.parent_id !== userId) {
    return JSON.stringify({ error: 'Student not found or does not belong to this parent' })
  }

  // Count by status
  const statuses = ['completed', 'in_progress', 'not_started', 'skipped'] as const
  const counts: Record<string, number> = {}

  for (const status of statuses) {
    const { count } = await supabase
      .from('student_lesson_progress')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', status)
    counts[status] = count || 0
  }

  const total = Object.values(counts).reduce((s, c) => s + c, 0)

  return JSON.stringify({
    student_name: student.first_name,
    grade_band: student.grade_band,
    total_lessons: total || 900, // 900 per level
    completed: counts.completed || 0,
    in_progress: counts.in_progress || 0,
    not_started: counts.not_started || 0,
    skipped: counts.skipped || 0,
    completion_percentage: total > 0 ? Math.round((counts.completed / total) * 100) : 0,
  })
}

async function handleUpdateUserProfile(
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const updates: Record<string, unknown> = {}
  const errors: string[] = []

  // Validate and collect fields
  if (input.address_line1 !== undefined) updates.address_line1 = input.address_line1
  if (input.address_line2 !== undefined) updates.address_line2 = input.address_line2
  if (input.city !== undefined) updates.city = input.city

  if (input.state_address !== undefined) {
    const st = (input.state_address as string).toUpperCase()
    if (st.length !== 2) errors.push('State address must be a 2-letter code')
    else updates.state_address = st
  }

  if (input.zip_code !== undefined) {
    const zip = input.zip_code as string
    if (!/^\d{5}(-\d{4})?$/.test(zip)) errors.push('ZIP code must be 5 or 9 digits (e.g., 12345 or 12345-6789)')
    else updates.zip_code = zip
  }

  if (input.phone !== undefined) {
    const phone = (input.phone as string).replace(/[^\d+()-\s]/g, '')
    if (phone.length < 7) errors.push('Phone number seems too short')
    else updates.phone = phone
  }

  if (input.email_override !== undefined) {
    const email = input.email_override as string
    if (!email.includes('@')) errors.push('Invalid email format')
    else updates.email_override = email
  }

  if (input.state_code !== undefined) {
    const code = (input.state_code as string).toUpperCase()
    if (code.length !== 2) errors.push('State code must be 2 letters')
    else {
      updates.state_code = code
      if (input.state_name) updates.state_name = input.state_name
      else {
        // Look up state name
        const sd = (stateRequirements.states as unknown as Record<string, { name?: string }>)[code]
        if (sd?.name) updates.state_name = sd.name
      }
    }
  }

  if (errors.length > 0) {
    return JSON.stringify({ error: 'Validation failed', details: errors })
  }

  if (Object.keys(updates).length === 0) {
    return JSON.stringify({ error: 'No fields to update' })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) {
    return JSON.stringify({ error: `Database update failed: ${error.message}` })
  }

  return JSON.stringify({
    success: true,
    updated_fields: Object.keys(updates),
    message: `Successfully updated: ${Object.keys(updates).join(', ')}`,
  })
}

async function handleGenerateNotice(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, phone, state_code, state_name, address_line1, address_line2, city, state_address, zip_code, email_override')
    .eq('id', userId)
    .single()

  if (!profile) return JSON.stringify({ error: 'Could not fetch profile' })

  const { data: { user } } = await supabase.auth.getUser()

  // Get students
  const { data: students } = await supabase
    .from('students')
    .select('first_name, last_name, date_of_birth, grade_band')
    .eq('parent_id', userId)
    .eq('enrollment_status', 'active')

  if (!students || students.length === 0) {
    return JSON.stringify({ error: 'No active students found. Please add students to your account first.' })
  }

  // Get state data
  const stateData = profile.state_code
    ? (stateRequirements.states as unknown as Record<string, { requirements?: { notice_of_intent?: { submit_to?: string } } }>)[profile.state_code]
    : null
  const submitTo = stateData?.requirements?.notice_of_intent?.submit_to || '[School District Superintendent]'

  const now = new Date()
  const academicYear = now.getMonth() >= 7
    ? `${now.getFullYear()}–${now.getFullYear() + 1}`
    : `${now.getFullYear() - 1}–${now.getFullYear()}`

  const address = [
    profile.address_line1,
    profile.address_line2,
    [profile.city, profile.state_address, profile.zip_code].filter(Boolean).join(', '),
  ].filter(Boolean).join('\n')

  const email = profile.email_override || user?.email || '[Email Address]'

  const studentLines = students.map(s => {
    const dob = s.date_of_birth
      ? new Date(s.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A'
    return `  Student: ${s.first_name} ${s.last_name}\n  Date of Birth: ${dob}\n  Grade Level: ${GRADE_LABELS[s.grade_band] || s.grade_band}`
  }).join('\n\n')

  const missingFields: string[] = []
  if (!profile.address_line1) missingFields.push('address')
  if (!profile.phone) missingFields.push('phone number')

  const letter = `Dear ${submitTo},

I am writing to notify you of my intent to provide home instruction for the ${academicYear} academic year for the following student${students.length > 1 ? 's' : ''}:

${studentLines}

CURRICULUM & INSTRUCTIONAL APPROACH:
We will be using a Montessori-method curriculum provided through the Montessori Homeschool Platform. The Montessori approach is a child-centered educational method developed by Dr. Maria Montessori, emphasizing hands-on learning, self-directed activity, and collaborative exploration.

SUBJECTS TO BE COVERED:
${MONTESSORI_SUBJECTS.map(s => `  • ${s}`).join('\n')}

INSTRUCTIONAL MATERIALS:
The curriculum includes structured lesson plans with hands-on Montessori materials, printable resources, guided activities, and digital instructional content. Materials are age-appropriate and aligned with educational standards.

INSTRUCTOR QUALIFICATIONS:
As the parent/guardian, I will serve as the primary instructor, utilizing the comprehensive Montessori curriculum platform which provides detailed lesson plans, instructional guidance, and assessment tools.

ASSESSMENT PLAN:
Student progress will be monitored through:
  • Daily lesson completion tracking
  • Ongoing mastery assessments across curriculum areas
  • Regular observations documented in student portfolio
  • Periodic standardized assessment as required by ${profile.state_name || 'state'} law

I am prepared to maintain attendance records, provide quarterly progress reports, and submit annual assessments as required by ${profile.state_name || 'state'} homeschool regulations.

Please feel free to contact me if you have any questions or require additional information.

Respectfully,

${profile.display_name || '[Parent Name]'}
${address || '[Address]'}
${profile.phone || '[Phone Number]'}
${email}`

  return JSON.stringify({
    letter,
    missing_fields: missingFields,
    submit_to: submitTo,
    state: profile.state_name || 'Not selected',
    student_count: students.length,
    note: missingFields.length > 0
      ? `The letter is missing: ${missingFields.join(', ')}. Would you like to provide these now?`
      : 'Letter is complete and ready to print from the Reports page.',
  })
}

async function handleCheckCompliance(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, phone, state_code, state_name, address_line1, city, zip_code')
    .eq('id', userId)
    .single()

  if (!profile) return JSON.stringify({ error: 'Could not fetch profile' })

  // Get students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, grade_band')
    .eq('parent_id', userId)
    .eq('enrollment_status', 'active')

  const checklist: { item: string; status: 'complete' | 'missing' | 'in_progress' | 'not_required'; detail: string }[] = []

  // State selected
  checklist.push({
    item: 'State selected',
    status: profile.state_code ? 'complete' : 'missing',
    detail: profile.state_code ? `${profile.state_name} (${profile.state_code})` : 'Select your state in Reports → Compliance',
  })

  // Students enrolled
  checklist.push({
    item: 'Students enrolled',
    status: students && students.length > 0 ? 'complete' : 'missing',
    detail: students && students.length > 0
      ? `${students.length} student${students.length > 1 ? 's' : ''}: ${students.map(s => s.first_name).join(', ')}`
      : 'Add students from the dashboard',
  })

  // Address on file
  checklist.push({
    item: 'Address on file',
    status: profile.address_line1 && profile.city && profile.zip_code ? 'complete' : 'missing',
    detail: profile.address_line1 ? `${profile.address_line1}, ${profile.city}` : 'Needed for Notice of Intent and correspondence',
  })

  // Phone on file
  checklist.push({
    item: 'Phone number on file',
    status: profile.phone ? 'complete' : 'missing',
    detail: profile.phone || 'Needed for compliance forms',
  })

  // State-specific checks
  if (profile.state_code) {
    const stateData = (stateRequirements.states as unknown as Record<string, {
      tier?: string
      requirements?: {
        notice_of_intent?: { required?: boolean; due?: string }
        attendance_tracking?: { required?: boolean; days_required?: number | null }
        subjects_required?: string[]
        quarterly_reports?: { required?: boolean }
        annual_assessment?: { required?: boolean; type?: string }
        parent_qualification?: { required?: boolean; description?: string }
      }
    }>)[profile.state_code]

    if (stateData) {
      const req = stateData.requirements

      if (req?.parent_qualification?.required) {
        checklist.push({
          item: 'Parent qualification met',
          status: 'in_progress',
          detail: (req.parent_qualification.description || 'Parent education credential required') +
            '. Check your state guide for the fastest online path to compliance.',
        })
      }

      if (req?.notice_of_intent?.required) {
        checklist.push({
          item: 'Notice of Intent filed',
          status: 'in_progress',
          detail: `Required. ${req.notice_of_intent.due ? `Due: ${req.notice_of_intent.due}` : ''} Generate from Reports page.`,
        })
      }

      if (req?.attendance_tracking?.required && students && students.length > 0) {
        // Check first student's attendance
        const { data: completedDays } = await supabase
          .from('student_lesson_progress')
          .select('completed_at')
          .eq('student_id', students[0].id)
          .eq('status', 'completed')
          .not('completed_at', 'is', null)

        const uniqueDays = new Set(
          (completedDays || []).map(d => d.completed_at?.slice(0, 10)).filter(Boolean)
        )
        const daysReq = req.attendance_tracking.days_required || 180

        checklist.push({
          item: 'Attendance tracking',
          status: uniqueDays.size >= daysReq ? 'complete' : 'in_progress',
          detail: `${uniqueDays.size} of ${daysReq} days logged for ${students[0].first_name}`,
        })
      }

      if (req?.subjects_required && req.subjects_required.length > 0) {
        checklist.push({
          item: 'Required subjects covered',
          status: 'complete',
          detail: `Our Montessori curriculum covers all ${req.subjects_required.length} required subjects. View mapping in Reports.`,
        })
      }

      if (req?.quarterly_reports?.required) {
        checklist.push({
          item: 'Quarterly reports',
          status: 'in_progress',
          detail: 'Generate quarterly progress reports from the Reports page.',
        })
      }

      if (req?.annual_assessment?.required) {
        checklist.push({
          item: 'Annual assessment',
          status: 'in_progress',
          detail: `Type: ${req.annual_assessment.type || 'See state requirements'}`,
        })
      }
    }
  }

  const complete = checklist.filter(c => c.status === 'complete').length
  const total = checklist.length

  return JSON.stringify({
    checklist,
    summary: {
      complete,
      missing: checklist.filter(c => c.status === 'missing').length,
      in_progress: checklist.filter(c => c.status === 'in_progress').length,
      total,
      percentage: Math.round((complete / total) * 100),
    },
  })
}

// ============================================================================
// Customer Service Tool Handlers
// ============================================================================

async function handleGetSubscriptionDetails(
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const studentId = input.student_id as string | undefined

  let query = supabase
    .from('subscriptions')
    .select(`
      id, student_id, stripe_subscription_id, status,
      cancel_at_period_end, current_period_start, current_period_end,
      created_at,
      students!student_id (first_name, last_name, grade_band, enrollment_status)
    `)
    .eq('parent_id', userId)

  if (studentId) {
    query = query.eq('student_id', studentId)
  }

  const { data: subscriptions, error } = await query

  if (error) return JSON.stringify({ error: 'Could not fetch subscriptions' })
  if (!subscriptions || subscriptions.length === 0) {
    return JSON.stringify({ subscriptions: [], message: 'No subscriptions found.' })
  }

  // Get recent payment history
  const subIds = subscriptions.map(s => s.id)
  const { data: payments } = await supabase
    .from('payment_history')
    .select('subscription_id, stripe_invoice_id, amount_cents, status, paid_at')
    .in('subscription_id', subIds)
    .order('paid_at', { ascending: false })
    .limit(10)

  const now = new Date()

  return JSON.stringify({
    subscriptions: subscriptions.map(sub => {
      const student = sub.students as unknown as {
        first_name: string; last_name: string; grade_band: string; enrollment_status: string
      } | null

      const enrollmentDate = new Date(sub.created_at)
      const daysSinceEnrollment = Math.floor((now.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24))

      const periodStart = new Date(sub.current_period_start)
      const daysIntoBillingCycle = Math.floor((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))

      const subPayments = (payments || []).filter(p => p.subscription_id === sub.id)

      return {
        subscription_id: sub.id,
        student_id: sub.student_id,
        student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown',
        grade_band: student?.grade_band || 'unknown',
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        enrollment_date: sub.created_at,
        days_since_enrollment: daysSinceEnrollment,
        days_into_billing_cycle: daysIntoBillingCycle,
        recent_payments: subPayments.map(p => ({
          amount: `$${(p.amount_cents / 100).toFixed(2)}`,
          status: p.status,
          date: p.paid_at,
          invoice_id: p.stripe_invoice_id,
        })),
      }
    }),
  })
}

async function handleCancelSubscription(
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const studentId = input.student_id as string
  const reason = input.reason as string
  if (!studentId) return JSON.stringify({ error: 'student_id is required' })

  // Verify ownership
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, stripe_subscription_id, status, cancel_at_period_end, current_period_end, student_id')
    .eq('student_id', studentId)
    .eq('parent_id', userId)
    .single()

  if (!sub) return JSON.stringify({ error: 'No subscription found for this student' })
  if (sub.cancel_at_period_end) {
    return JSON.stringify({
      already_cancelling: true,
      message: `This subscription is already set to cancel on ${sub.current_period_end}.`,
      access_until: sub.current_period_end,
    })
  }
  if (sub.status === 'cancelled') {
    return JSON.stringify({ error: 'This subscription is already cancelled.' })
  }

  // Cancel at period end via Stripe
  const stripeResult = await stripeRequest('POST', `/subscriptions/${sub.stripe_subscription_id}`, {
    cancel_at_period_end: 'true',
    cancellation_details__comment: reason,
  })

  if (stripeResult.error) {
    return JSON.stringify({ error: `Stripe cancellation failed: ${(stripeResult.error as { message?: string }).message || 'Unknown error'}` })
  }

  // Update Supabase
  await supabase
    .from('subscriptions')
    .update({ cancel_at_period_end: true })
    .eq('id', sub.id)

  // Get student name
  const { data: student } = await supabase
    .from('students')
    .select('first_name')
    .eq('id', studentId)
    .single()

  return JSON.stringify({
    success: true,
    student_name: student?.first_name || 'Student',
    access_until: sub.current_period_end,
    message: `Subscription cancelled. Full access continues until ${sub.current_period_end}. No further charges will be made.`,
    reason,
  })
}

async function handleRequestRefund(
  input: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const studentId = input.student_id as string
  const refundType = input.refund_type as 'enrollment' | 'monthly'
  const reason = input.reason as string
  const overridePolicy = (input.override_policy as boolean) || false

  if (!studentId) return JSON.stringify({ error: 'student_id is required' })
  if (!refundType) return JSON.stringify({ error: 'refund_type is required' })

  // Verify ownership
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('id, stripe_subscription_id, stripe_customer_id, status, current_period_start, created_at')
    .eq('student_id', studentId)
    .eq('parent_id', userId)
    .single()

  if (!sub) return JSON.stringify({ error: 'No subscription found for this student' })

  const now = new Date()
  const enrollmentDate = new Date(sub.created_at)
  const daysSinceEnrollment = Math.floor((now.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24))
  const periodStart = new Date(sub.current_period_start)
  const daysIntoBillingCycle = Math.floor((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24))

  // Check policy eligibility
  let policyApproved = false
  let policyNote = ''

  if (refundType === 'enrollment') {
    if (daysSinceEnrollment <= 14) {
      policyApproved = true
      policyNote = `Within 14-day enrollment refund window (day ${daysSinceEnrollment}).`
    } else {
      policyNote = `Outside 14-day enrollment refund window (day ${daysSinceEnrollment}). The enrollment fee covers curriculum setup, materials access, and compliance tools.`
    }
  } else {
    // monthly
    if (daysIntoBillingCycle <= 5) {
      policyApproved = true
      policyNote = `Within 5-day billing cycle refund window (day ${daysIntoBillingCycle}).`
    } else {
      policyNote = `Outside 5-day billing cycle refund window (day ${daysIntoBillingCycle}). The subscription can be cancelled at period end with no further charges.`
    }
  }

  // If policy not met and no override, return info for agent to decide
  if (!policyApproved && !overridePolicy) {
    return JSON.stringify({
      approved: false,
      requires_override: true,
      policy_note: policyNote,
      refund_type: refundType,
      days_since_enrollment: daysSinceEnrollment,
      days_into_billing_cycle: daysIntoBillingCycle,
      message: 'Refund is outside the standard policy window. Set override_policy=true if you determine a refund should be granted anyway (e.g., to prevent a chargeback).',
    })
  }

  // Find the charge to refund
  const { data: payments } = await supabase
    .from('payment_history')
    .select('id, stripe_invoice_id, amount_cents, status')
    .eq('subscription_id', sub.id)
    .eq('status', 'paid')
    .order('paid_at', { ascending: false })
    .limit(5)

  if (!payments || payments.length === 0) {
    return JSON.stringify({ error: 'No paid charges found to refund.' })
  }

  // For enrollment: look for the highest amount (the $150 fee) or first charge
  // For monthly: use the most recent payment
  const targetPayment = refundType === 'enrollment'
    ? payments.reduce((max, p) => p.amount_cents > max.amount_cents ? p : max, payments[0])
    : payments[0]

  // Get the charge ID from the Stripe invoice
  let chargeId: string | null = null
  if (targetPayment.stripe_invoice_id) {
    const invoice = await stripeRequest('GET', `/invoices/${targetPayment.stripe_invoice_id}`)
    chargeId = invoice.charge as string | null
  }

  if (!chargeId) {
    // Try getting latest charge from customer
    const charges = await stripeRequest('GET', `/charges?customer=${sub.stripe_customer_id}&limit=5`)
    const chargeList = (charges.data as Array<{ id: string; amount: number; refunded: boolean }>) || []
    const unreturned = chargeList.find(c => !c.refunded)
    chargeId = unreturned?.id || null
  }

  if (!chargeId) {
    return JSON.stringify({ error: 'Could not locate the Stripe charge to refund. Please escalate to support.' })
  }

  // Process the refund via Stripe
  const refundResult = await stripeRequest('POST', '/refunds', {
    charge: chargeId,
    reason: 'requested_by_customer',
  })

  if (refundResult.error) {
    return JSON.stringify({
      error: `Stripe refund failed: ${(refundResult.error as { message?: string }).message || 'Unknown error'}. Please escalate to support.`,
    })
  }

  // Update payment_history status
  const adminClient = getAdminClient()
  await adminClient
    .from('payment_history')
    .update({ status: 'refunded' })
    .eq('id', targetPayment.id)

  const refundAmount = (refundResult.amount as number) || targetPayment.amount_cents
  const { data: student } = await supabase
    .from('students')
    .select('first_name')
    .eq('id', studentId)
    .single()

  return JSON.stringify({
    approved: true,
    success: true,
    refund_type: refundType,
    amount: `$${(refundAmount / 100).toFixed(2)}`,
    student_name: student?.first_name || 'Student',
    policy_note: overridePolicy ? `Policy override applied. Original policy: ${policyNote}` : policyNote,
    message: `Refund of $${(refundAmount / 100).toFixed(2)} processed successfully. It will appear on the original payment method within 5-10 business days.`,
    reason,
  })
}

async function handleEscalateToSupport(
  input: Record<string, unknown>,
  userId: string
): Promise<string> {
  const subject = input.subject as string
  const category = input.category as string
  const conversationSummary = input.conversation_summary as string

  if (!subject || !category) {
    return JSON.stringify({ error: 'subject and category are required' })
  }

  const adminClient = getAdminClient()

  const { data: ticket, error } = await adminClient
    .from('support_tickets')
    .insert({
      parent_id: userId,
      subject,
      category,
      conversation_transcript: [{ type: 'ai_summary', content: conversationSummary }],
      status: 'open',
    })
    .select('id')
    .single()

  if (error) {
    return JSON.stringify({ error: `Could not create support ticket: ${error.message}` })
  }

  return JSON.stringify({
    success: true,
    ticket_id: ticket.id,
    message: `Support ticket created (ID: ${ticket.id.slice(0, 8)}). Our team will review your case and respond within 2 business days at your email address.`,
  })
}
