// Email templates for Montessori Homeschool Platform
// These are HTML email templates that can be sent via any email provider
// (Resend, SendGrid, AWS SES, etc.)

interface WeeklySummaryData {
  parentName: string
  studentName: string
  weekNumber: number
  lessonsCompleted: number
  totalLessons: number
  observationCount: number
  upcomingClassName: string | null
  upcomingClassDay: string | null
}

interface ClassReminderData {
  parentName: string
  studentName: string
  className: string
  teacherName: string
  date: string
  time: string
  zoomLink: string
}

interface PaymentFailedData {
  parentName: string
  studentName: string
  amount: string
  retryDate: string
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #fafaf9; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
  .header { background: #15803d; padding: 24px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 20px; }
  .content { padding: 24px; }
  .stat { display: inline-block; text-align: center; padding: 12px 20px; background: #f5f5f4; border-radius: 8px; margin: 4px; }
  .stat-value { font-size: 24px; font-weight: 700; color: #1c1917; }
  .stat-label { font-size: 12px; color: #78716c; }
  .btn { display: inline-block; background: #15803d; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; }
  .footer { padding: 16px 24px; text-align: center; font-size: 12px; color: #a8a29e; border-top: 1px solid #e7e5e4; }
`

export function weeklySummaryEmail(data: WeeklySummaryData): string {
  const pct = data.totalLessons > 0 ? Math.round((data.lessonsCompleted / data.totalLessons) * 100) : 0

  return `<!DOCTYPE html>
<html><head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Montessori Home</h1>
    </div>
    <div class="content">
      <p>Hi ${data.parentName},</p>
      <p>Here's ${data.studentName}'s weekly summary for Week ${data.weekNumber}:</p>

      <div style="text-align:center; margin: 20px 0;">
        <div class="stat">
          <div class="stat-value">${data.lessonsCompleted}/${data.totalLessons}</div>
          <div class="stat-label">Lessons Completed (${pct}%)</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.observationCount}</div>
          <div class="stat-label">Observations Logged</div>
        </div>
      </div>

      ${data.upcomingClassName ? `
      <p><strong>Next Zoom Class:</strong> ${data.upcomingClassName} on ${data.upcomingClassDay}</p>
      ` : ''}

      <p style="text-align:center; margin-top: 24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard" class="btn">View Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>Montessori Homeschool Platform &middot; You're doing great work!</p>
    </div>
  </div>
</body></html>`
}

export function classReminderEmail(data: ClassReminderData): string {
  return `<!DOCTYPE html>
<html><head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Montessori Home</h1>
    </div>
    <div class="content">
      <p>Hi ${data.parentName},</p>
      <p>${data.studentName} has a Zoom class coming up!</p>

      <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin:0; font-weight:600; color:#1e40af;">${data.className}</p>
        <p style="margin:4px 0 0; color:#3b82f6; font-size:14px;">
          ${data.date} at ${data.time} &middot; with ${data.teacherName}
        </p>
      </div>

      <p style="text-align:center; margin-top: 24px;">
        <a href="${data.zoomLink}" class="btn" style="background:#2563eb;">Join Zoom Class</a>
      </p>
    </div>
    <div class="footer">
      <p>Montessori Homeschool Platform</p>
    </div>
  </div>
</body></html>`
}

export function paymentFailedEmail(data: PaymentFailedData): string {
  return `<!DOCTYPE html>
<html><head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header" style="background:#dc2626;">
      <h1>Montessori Home</h1>
    </div>
    <div class="content">
      <p>Hi ${data.parentName},</p>
      <p>We weren't able to process your payment of <strong>${data.amount}</strong> for ${data.studentName}'s subscription.</p>

      <p>We'll automatically retry on <strong>${data.retryDate}</strong>. Please ensure your payment method is up to date.</p>

      <p style="text-align:center; margin-top: 24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard/account" class="btn">Update Payment Method</a>
      </p>
    </div>
    <div class="footer">
      <p>Montessori Homeschool Platform &middot; Questions? Reply to this email.</p>
    </div>
  </div>
</body></html>`
}
