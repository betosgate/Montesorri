import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions governing the use of the Montessori Homeschool online homeschool platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-violet-800">Montessori Homeschool</Link>
          <Link href="/privacy" className="text-sm text-stone-500 hover:text-green-700">Privacy Policy</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold text-stone-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-stone-500">Effective Date: February 26, 2026 &middot; Last Updated: February 26, 2026</p>

        <div className="mt-8 space-y-10 text-stone-700 leading-relaxed">

          {/* 1. Agreement */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">1. Agreement to Terms</h2>
            <p className="mt-3">
              These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you and
              Montessori Homeschool (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) governing your use of our
              website at montessorihome.school, our curriculum materials, and all related services (collectively,
              the &ldquo;Platform&rdquo;).
            </p>
            <p className="mt-3">
              By creating an account, subscribing to our service, or otherwise using the Platform, you acknowledge that you
              have read, understood, and agree to be bound by these Terms and our{' '}
              <Link href="/privacy" className="text-green-700 underline">Privacy Policy</Link>. If you are using the Platform
              on behalf of a family or household, you represent that you have the authority to bind your household to these Terms.
            </p>
            <p className="mt-3">
              You must be at least 18 years of age to create an account and use the Platform. The Platform is designed for
              use by parents and guardians; children do not create accounts or agree to these Terms directly.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">2. Description of Service</h2>
            <p className="mt-3">
              Montessori Homeschool provides a subscription-based digital curriculum platform for homeschooling families. Our
              services include:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>2,700 structured lesson plans across three grade bands (Primary K, Lower Elementary 1&ndash;3, Upper Elementary 4&ndash;6)</li>
              <li>Interactive slide presentations with parent guides</li>
              <li>Printable educational materials (PDFs)</li>
              <li>Progress tracking, mastery records, and assessment tools</li>
              <li>State-specific compliance reporting for all 50 U.S. states</li>
              <li>AI-powered compliance assistant</li>
              <li>Mascot-narrated lesson content</li>
              <li>Supplemental activity logging</li>
              <li>Referral program</li>
            </ul>
          </section>

          {/* 3. Accounts */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">3. Accounts and Registration</h2>
            <p className="mt-3">
              To use the Platform, you must create an account with a valid email address and password. You are responsible for:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>Providing accurate and complete registration information</li>
              <li>Maintaining the confidentiality of your password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms or are used fraudulently.
            </p>
          </section>

          {/* 4. Subscriptions and Payment */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">4. Subscriptions and Payment</h2>

            <h3 className="mt-4 text-lg font-medium text-stone-800">4.1 Pricing</h3>
            <p className="mt-2">
              The Platform is offered on a subscription basis at <strong>$50 per month per enrolled student</strong>. Prices
              are in U.S. dollars. We may change our pricing with at least 30 days&rsquo; advance notice. Price changes will
              apply at the start of your next billing cycle.
            </p>

            <h3 className="mt-4 text-lg font-medium text-stone-800">4.2 Billing</h3>
            <p className="mt-2">
              Subscriptions are billed monthly through Stripe. By subscribing, you authorize us to charge your payment method
              on a recurring monthly basis. If a payment fails, your subscription will be marked as past-due and you will have
              a grace period to update your payment information before access is suspended.
            </p>

            <h3 className="mt-4 text-lg font-medium text-stone-800">4.3 Cancellation</h3>
            <p className="mt-2">
              You may cancel your subscription at any time through your Account Settings page. Upon cancellation:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>You retain access until the end of your current billing period.</li>
              <li>No further charges will be made.</li>
              <li>Your data (lesson progress, observations, reports) is retained for 12 months.</li>
              <li>You can reactivate your subscription at any time during the retention period without losing data.</li>
            </ul>

            <h3 className="mt-4 text-lg font-medium text-stone-800">4.4 Refunds</h3>

            <p className="mt-2 font-medium text-stone-800">Enrollment Fee ($150):</p>
            <ul className="mt-1 ml-6 list-disc space-y-1">
              <li>Full refund within 14 days of enrollment, no questions asked.</li>
              <li>After 14 days, the enrollment fee is generally non-refundable as it covers initial curriculum access, compliance tools setup, and materials preparation.</li>
              <li>Exceptions may be granted on a case-by-case basis through our Support Assistant.</li>
            </ul>

            <p className="mt-3 font-medium text-stone-800">Monthly Subscription ($50/month):</p>
            <ul className="mt-1 ml-6 list-disc space-y-1">
              <li>Full refund of the current month&rsquo;s charge if cancelled within 5 days of your billing cycle start date.</li>
              <li>After 5 days, no refund for the current month, but your subscription will be cancelled at the end of the billing period with full access until then.</li>
            </ul>

            <p className="mt-3 font-medium text-stone-800">How to Request:</p>
            <ul className="mt-1 ml-6 list-disc space-y-1">
              <li>Use the Support Assistant (chat icon) on your dashboard for immediate processing.</li>
              <li>Or email{' '}
                <a href="mailto:support@montessori-homeschool.com" className="text-green-700 underline">
                  support@montessori-homeschool.com
                </a>{' '}for assistance within 2 business days.
              </li>
            </ul>

            <p className="mt-3">
              We process all eligible refunds within 5&ndash;10 business days to your original payment method.
            </p>

            <h3 className="mt-4 text-lg font-medium text-stone-800">4.5 Referral Program</h3>
            <p className="mt-2">
              Participants in the referral program earn a $50 account credit for each referred household that signs up and
              makes their first payment. Credits are applied as Stripe customer balance credits and offset future subscription
              charges. Referral credits are:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>Limited to one $50 credit per referred household, regardless of how many children they enroll</li>
              <li>Non-transferable and have no cash value</li>
              <li>Subject to verification &mdash; we reserve the right to revoke credits obtained through self-referral, fraud, or abuse</li>
              <li>Not retroactive for users who signed up before the program launched</li>
            </ul>
          </section>

          {/* 5. Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">5. Intellectual Property</h2>

            <h3 className="mt-4 text-lg font-medium text-stone-800">5.1 Our Content</h3>
            <p className="mt-2">
              All curriculum content, lesson plans, slide presentations, printable materials, illustrations, mascot characters
              and narrations, software code, and Platform design are the intellectual property of Montessori Homeschool and are
              protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mt-2">
              Your subscription grants you a limited, non-exclusive, non-transferable license to access and use our curriculum
              materials for personal, non-commercial homeschool education of your enrolled children. You may print materials
              for personal use but may <strong>not</strong>:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>Copy, redistribute, sell, or sublicense our materials to others</li>
              <li>Use our materials in a commercial tutoring, teaching, or co-op setting without a separate license</li>
              <li>Remove copyright notices or attribution from materials</li>
              <li>Create derivative works based on our curriculum for distribution</li>
              <li>Scrape, download in bulk, or systematically reproduce our content</li>
            </ul>

            <h3 className="mt-4 text-lg font-medium text-stone-800">5.2 Your Content</h3>
            <p className="mt-2">
              You retain ownership of all content you create on the Platform, including observations, notes, portfolio items,
              and assessment narratives. By uploading content (such as photos of student work), you grant us a limited license
              to store and display that content to you within the Platform.
            </p>

            <h3 className="mt-4 text-lg font-medium text-stone-800">5.3 Stock Images</h3>
            <p className="mt-2">
              Some lesson illustrations use stock images from Pexels under their free license. These images are not owned by
              Montessori Homeschool and are subject to Pexels&rsquo; terms of use.
            </p>
          </section>

          {/* 6. Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">6. Acceptable Use</h2>
            <p className="mt-3">You agree not to use the Platform to:</p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>Violate any applicable law or regulation</li>
              <li>Impersonate any person or entity</li>
              <li>Share your account credentials with others outside your household</li>
              <li>Attempt to gain unauthorized access to other users&rsquo; data or our systems</li>
              <li>Use automated tools (bots, scrapers) to access the Platform</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Platform</li>
              <li>Upload malicious content, viruses, or harmful code</li>
              <li>Use the AI compliance assistant to generate false or fraudulent compliance documents</li>
              <li>Abuse the referral program through self-referral, fake accounts, or coordinated manipulation</li>
            </ul>
          </section>

          {/* 7. AI Compliance Assistant */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">7. AI Compliance Assistant Disclaimer</h2>
            <p className="mt-3">
              Our AI-powered compliance assistant provides general informational guidance about homeschool regulations. It is
              <strong> not</strong> a substitute for legal advice.
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>The AI may produce inaccurate, incomplete, or outdated information about state laws.</li>
              <li>You are solely responsible for verifying any legal requirements with your state&rsquo;s education department
                or a qualified attorney.</li>
              <li>Compliance reports, Notice of Intent letters, and other documents generated by the Platform are templates
                and tools &mdash; you must review and verify them before submission.</li>
              <li>We are not liable for any consequences resulting from reliance on AI-generated guidance, including failure
                to comply with state homeschool requirements.</li>
            </ul>
          </section>

          {/* 8. Educational Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">8. Educational Disclaimer</h2>
            <p className="mt-3">
              Our curriculum is inspired by the Montessori method and is designed to support homeschool families. However:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>We are not a school, and using our Platform does not constitute enrollment in a school.</li>
              <li>Our curriculum is a guide &mdash; you as the parent/educator are responsible for your child&rsquo;s education.</li>
              <li>We do not guarantee specific educational outcomes, test scores, or grade-level readiness.</li>
              <li>Our curriculum may not meet every specific requirement of every state. You are responsible for ensuring
                your homeschool program meets your state&rsquo;s legal requirements.</li>
              <li>Materials labeled &ldquo;Montessori&rdquo; are based on Montessori principles but are not certified by
                the Association Montessori Internationale (AMI) or the American Montessori Society (AMS).</li>
            </ul>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">9. Limitation of Liability</h2>
            <p className="mt-3">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, MONTESSORI HOMESCHOOL AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS
              SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
              LIMITED TO LOSS OF DATA, LOSS OF PROFITS, OR FAILURE TO MEET EDUCATIONAL REQUIREMENTS, ARISING OUT OF OR IN
              CONNECTION WITH YOUR USE OF THE PLATFORM.
            </p>
            <p className="mt-3">
              OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNT YOU HAVE PAID US IN THE TWELVE (12) MONTHS PRECEDING
              THE EVENT GIVING RISE TO THE CLAIM.
            </p>
            <p className="mt-3">
              THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
          </section>

          {/* 10. Indemnification */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">10. Indemnification</h2>
            <p className="mt-3">
              You agree to indemnify, defend, and hold harmless Montessori Homeschool and its officers, directors, employees,
              and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorney
              fees) arising out of or in any way connected with:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>Your use of the Platform</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any applicable law or regulation</li>
              <li>Your failure to comply with your state&rsquo;s homeschool requirements</li>
              <li>Content you upload to the Platform</li>
            </ul>
          </section>

          {/* 11. Dispute Resolution */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">11. Dispute Resolution</h2>
            <p className="mt-3">
              <strong>Informal resolution:</strong> Before filing any formal claim, you agree to contact us at{' '}
              <a href="mailto:legal@montessori-homeschool.com" className="text-green-700 underline">legal@montessori-homeschool.com</a>{' '}
              and attempt to resolve the dispute informally for at least 30 days.
            </p>
            <p className="mt-3">
              <strong>Governing law:</strong> These Terms are governed by and construed in accordance with the laws of the
              State of Texas, without regard to its conflict of law principles.
            </p>
            <p className="mt-3">
              <strong>Jurisdiction:</strong> Any legal action arising out of these Terms shall be brought exclusively in the
              state or federal courts located in Texas.
            </p>
          </section>

          {/* 12. Termination */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">12. Termination</h2>
            <p className="mt-3">
              We reserve the right to suspend or terminate your account at any time if:
            </p>
            <ul className="mt-2 ml-6 list-disc space-y-1">
              <li>You violate these Terms</li>
              <li>Your payment method fails and you do not remedy it within the grace period</li>
              <li>We reasonably believe your account is being used fraudulently</li>
              <li>We discontinue the Platform (with at least 60 days&rsquo; notice)</li>
            </ul>
            <p className="mt-3">
              Upon termination, you will retain access to your data for 30 days to export it. After that, data will be deleted
              per our data retention policy.
            </p>
          </section>

          {/* 13. Modifications */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">13. Modifications to Terms</h2>
            <p className="mt-3">
              We may update these Terms from time to time. We will notify you of material changes by posting the updated
              Terms with a new effective date and, for significant changes, by email at least 14 days before they take effect.
              Your continued use of the Platform after changes take effect constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* 14. Miscellaneous */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">14. Miscellaneous</h2>
            <ul className="mt-3 ml-6 list-disc space-y-1">
              <li><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy, constitute the entire
                agreement between you and Montessori Homeschool.</li>
              <li><strong>Severability:</strong> If any provision of these Terms is held to be unenforceable, the remaining
                provisions will remain in full force and effect.</li>
              <li><strong>Waiver:</strong> Our failure to enforce any provision of these Terms does not constitute a waiver
                of that provision.</li>
              <li><strong>Assignment:</strong> You may not assign your rights under these Terms. We may assign our rights
                to any successor entity.</li>
              <li><strong>Force Majeure:</strong> We are not liable for delays or failures in performance due to circumstances
                beyond our reasonable control, including natural disasters, pandemics, or internet outages.</li>
            </ul>
          </section>

          {/* 15. Contact */}
          <section>
            <h2 className="text-xl font-semibold text-stone-800">15. Contact Information</h2>
            <p className="mt-3">For questions about these Terms:</p>
            <div className="mt-3 rounded-lg border border-stone-200 bg-white p-5">
              <p className="font-medium text-stone-800">Montessori Homeschool</p>
              <p className="mt-1 text-sm">Email: <a href="mailto:legal@montessori-homeschool.com" className="text-green-700 underline">legal@montessori-homeschool.com</a></p>
              <p className="mt-1 text-sm">General Support: <a href="mailto:support@montessori-homeschool.com" className="text-green-700 underline">support@montessori-homeschool.com</a></p>
              <p className="mt-1 text-sm">Website: <a href="https://montessorihome.school" className="text-green-700 underline">montessorihome.school</a></p>
            </div>
          </section>

        </div>

        <div className="mt-12 border-t border-stone-200 pt-6 text-center text-sm text-stone-400">
          <Link href="/privacy" className="text-green-700 hover:text-green-800">Privacy Policy</Link>
          {' '}&middot;{' '}
          <Link href="/" className="text-green-700 hover:text-green-800">Home</Link>
        </div>
      </main>
    </div>
  )
}
