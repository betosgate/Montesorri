'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GradeBand } from '@/lib/types/database'

export function AddStudentForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gradeBand, setGradeBand] = useState<GradeBand>('primary')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase.from('students').insert({
        parent_id: user.id,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        grade_band: gradeBand,
      })

      if (insertError) throw insertError

      // Reset form
      setFirstName('')
      setLastName('')
      setDateOfBirth('')
      setGradeBand('primary')

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 max-w-lg space-y-4 rounded-lg border border-stone-200 bg-white p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-stone-700">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-stone-700">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        </div>
      </div>

      <div>
        <label htmlFor="dob" className="block text-sm font-medium text-stone-700">
          Date of Birth
        </label>
        <input
          id="dob"
          type="date"
          required
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        />
      </div>

      <div>
        <label htmlFor="gradeBand" className="block text-sm font-medium text-stone-700">
          Grade Level
        </label>
        <select
          id="gradeBand"
          value={gradeBand}
          onChange={(e) => setGradeBand(e.target.value as GradeBand)}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          <option value="primary">Primary (Kindergarten, ages 5-6)</option>
          <option value="lower_elementary">Lower Elementary (Grades 1-3, ages 6-9)</option>
          <option value="upper_elementary">Upper Elementary (Grades 4-6, ages 9-12)</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Student'}
      </button>
    </form>
  )
}
