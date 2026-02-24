'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ObservationType, IndependenceLevel } from '@/lib/types/database'

interface Student {
  id: string
  first_name: string
  last_name: string
}

export function ObservationForm() {
  const [students, setStudents] = useState<Student[]>([])
  const [studentId, setStudentId] = useState('')
  const [observationType, setObservationType] = useState<ObservationType>('anecdotal')
  const [content, setContent] = useState('')
  const [curriculumArea, setCurriculumArea] = useState('')
  const [concentrationDuration, setConcentrationDuration] = useState<number | ''>('')
  const [independenceLevel, setIndependenceLevel] = useState<IndependenceLevel | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchStudents() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('parent_id', user.id)
        .eq('enrollment_status', 'active')

      if (data) {
        setStudents(data)
        if (data.length === 1) setStudentId(data[0].id)
      }
    }
    fetchStudents()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase.from('observations').insert({
        student_id: studentId,
        observer_id: user.id,
        observation_type: observationType,
        content,
        curriculum_area: curriculumArea || null,
        concentration_duration: concentrationDuration || null,
        independence_level: independenceLevel || null,
      })

      if (insertError) throw insertError

      setContent('')
      setCurriculumArea('')
      setConcentrationDuration('')
      setIndependenceLevel('')
      setSuccess(true)
      router.refresh()

      // Auto-hide success message
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save observation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-stone-200 bg-white p-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="student" className="block text-sm font-medium text-stone-700">
            Student
          </label>
          <select
            id="student"
            required
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          >
            <option value="">Select student...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-stone-700">
            Type
          </label>
          <select
            id="type"
            value={observationType}
            onChange={(e) => setObservationType(e.target.value as ObservationType)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          >
            <option value="anecdotal">Anecdotal</option>
            <option value="work_log">Work Log</option>
            <option value="concentration">Concentration</option>
            <option value="social_emotional">Social-Emotional</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-stone-700">
          Observation
        </label>
        <textarea
          id="content"
          required
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What did you observe?"
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="area" className="block text-sm font-medium text-stone-700">
            Subject Area
          </label>
          <input
            id="area"
            type="text"
            value={curriculumArea}
            onChange={(e) => setCurriculumArea(e.target.value)}
            placeholder="e.g., Math"
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          />
        </div>
        {observationType === 'concentration' && (
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-stone-700">
              Duration (min)
            </label>
            <input
              id="duration"
              type="number"
              min={1}
              value={concentrationDuration}
              onChange={(e) => setConcentrationDuration(e.target.value ? Number(e.target.value) : '')}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            />
          </div>
        )}
        <div>
          <label htmlFor="independence" className="block text-sm font-medium text-stone-700">
            Independence
          </label>
          <select
            id="independence"
            value={independenceLevel}
            onChange={(e) => setIndependenceLevel(e.target.value as IndependenceLevel | '')}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          >
            <option value="">N/A</option>
            <option value="needs_presentation">Needs Presentation</option>
            <option value="needs_prompt">Needs Prompt</option>
            <option value="independent">Independent</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Observation saved!</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Observation'}
      </button>
    </form>
  )
}
