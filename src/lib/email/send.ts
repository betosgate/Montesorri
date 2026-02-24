// Email sending utility
// Configure with your email provider (Resend, SendGrid, etc.)
// For now, this is a stub that logs emails in development

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  // In development, just log
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Email] To: ${to}, Subject: ${subject}`)
    return { success: true }
  }

  // Production: use Resend, SendGrid, or another provider
  // Example with Resend:
  //
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // const { error } = await resend.emails.send({
  //   from: 'Montessori Home <noreply@yourdomain.com>',
  //   to,
  //   subject,
  //   html,
  // })
  // if (error) return { success: false, error: error.message }

  return { success: true }
}
