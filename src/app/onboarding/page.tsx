'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GradeBand } from '@/lib/types/database'

type Step = 'welcome' | 'add_student' | 'select_class' | 'complete'

const GRADE_OPTIONS: { value: GradeBand; label: string; ages: string; description: string }[] = [
  { value: 'primary', label: 'Primary (Kindergarten)', ages: 'Ages 5-6', description: 'Focus on practical life, sensorial exploration, and foundational academics' },
  { value: 'lower_elementary', label: 'Lower Elementary (1st-3rd)', ages: 'Ages 6-9', description: 'Great Lessons, research projects, and growing independence' },
  { value: 'upper_elementary', label: 'Upper Elementary (4th-6th)', ages: 'Ages 9-12', description: 'Deep research, seminars, and cosmic education' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('welcome')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [gradeBand, setGradeBand] = useState<GradeBand>('primary')
  const [studentId, setStudentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: insertError } = await supabase
        .from('students')
        .insert({
          parent_id: user.id,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dob,
          grade_band: gradeBand,
          enrollment_status: 'active',
          academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          start_week: 1,
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      setStudentId(data.id)
      setStep('select_class')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8 flex gap-2">
          {['welcome', 'add_student', 'select_class', 'complete'].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= ['welcome', 'add_student', 'select_class', 'complete'].indexOf(step)
                  ? 'bg-green-600'
                  : 'bg-stone-200'
              }`}
            />
          ))}
        </div>

        {/* Welcome step */}
        {step === 'welcome' && (
          <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-semibold text-stone-800">Welcome to Montessori Home</h1>
            <p className="mt-3 text-stone-500">
              Let&apos;s set up your homeschool environment. We&apos;ll walk you through adding your first student and selecting a class.
            </p>
            <div className="mt-8 space-y-3 text-left text-sm text-stone-600">
              <div className="flex items-start gap-3 rounded-lg bg-stone-50 p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">1</span>
                <p>Add your student&apos;s information</p>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-stone-50 p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">2</span>
                <p>Browse and enroll in a live Zoom class</p>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-stone-50 p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">3</span>
                <p>Start your first day of lessons</p>
              </div>
            </div>
            <button
              onClick={() => setStep('add_student')}
              className="mt-8 w-full rounded-md bg-green-700 px-6 py-3 text-sm font-medium text-white hover:bg-green-800"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Add student step */}
        {step === 'add_student' && (
          <div className="rounded-xl border border-stone-200 bg-white p-8">
            <h2 className="text-xl font-semibold text-stone-800">Add Your Student</h2>
            <p className="mt-1 text-sm text-stone-500">Tell us about your child so we can personalize their curriculum.</p>

            <form onSubmit={handleAddStudent} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-stone-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Grade Level</label>
                <div className="space-y-2">
                  {GRADE_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        gradeBand === opt.value
                          ? 'border-green-600 bg-green-50'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="grade_band"
                        value={opt.value}
                        checked={gradeBand === opt.value}
                        onChange={() => setGradeBand(opt.value)}
                        className="mt-0.5 accent-green-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-stone-700">{opt.label}</p>
                        <p className="text-xs text-stone-400">{opt.ages} &middot; {opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-green-700 px-6 py-3 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Select class step */}
        {step === 'select_class' && (
          <div className="rounded-xl border border-stone-200 bg-white p-8">
            <h2 className="text-xl font-semibold text-stone-800">Choose a Class</h2>
            <p className="mt-1 text-sm text-stone-500">
              You can browse and enroll in classes from your dashboard at any time.
            </p>

            <div className="mt-6 rounded-lg bg-stone-50 p-6 text-center">
              <p className="text-sm text-stone-600">
                Student <span className="font-medium">{firstName}</span> has been added to{' '}
                <span className="font-medium">{GRADE_OPTIONS.find(g => g.value === gradeBand)?.label}</span>.
              </p>
              <p className="mt-2 text-xs text-stone-400">
                Class enrollment is available in your dashboard under &ldquo;Classes&rdquo;.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push('/dashboard/classes')}
                className="flex-1 rounded-md border border-green-600 px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-50"
              >
                Browse Classes Now
              </button>
              <button
                onClick={() => setStep('complete')}
                className="flex-1 rounded-md bg-green-700 px-4 py-3 text-sm font-medium text-white hover:bg-green-800"
              >
                Skip for Now
              </button>
            </div>
          </div>
        )}

        {/* Complete step */}
        {step === 'complete' && (
          <div className="rounded-xl border border-stone-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-green-600">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-stone-800">You&apos;re All Set!</h2>
            <p className="mt-2 text-sm text-stone-500">
              Your Montessori homeschool is ready. Start with today&apos;s lessons or explore your dashboard.
            </p>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="mt-8 w-full rounded-md bg-green-700 px-6 py-3 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Go to Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
