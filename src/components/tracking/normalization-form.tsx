'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  first_name: string
}

const INDICATORS = [
  { key: 'love_of_order', label: 'Love of Order', description: 'Chooses to organize workspace and materials' },
  { key: 'love_of_work', label: 'Love of Work', description: 'Engages deeply in purposeful activities' },
  { key: 'concentration', label: 'Concentration', description: 'Sustained focus during work periods' },
  { key: 'self_discipline', label: 'Self-Discipline', description: 'Follows routines without external prompts' },
  { key: 'sociability', label: 'Sociability', description: 'Positive, respectful interactions with others' },
  { key: 'joy', label: 'Joy', description: 'Shows satisfaction and contentment in learning' },
  { key: 'independence', label: 'Independence', description: 'Initiates and completes work independently' },
]

export function NormalizationForm({ students }: { students: Student[] }) {
  const [studentId, setStudentId] = useState(students[0]?.id || '')
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(INDICATORS.map(i => [i.key, 3]))
  )
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function setScore(key: string, value: number) {
    setScores(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('normalization_snapshots').insert({
      student_id: studentId,
      observer_id: user.id,
      indicators: scores,
      notes: notes || null,
      snapshot_date: new Date().toISOString().slice(0, 10),
    })

    if (!error) {
      setSaved(true)
      setNotes('')
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-stone-800">Normalization Snapshot</h3>
        {students.length > 1 && (
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="rounded-md border border-stone-300 px-2 py-1 text-sm focus:border-green-600 focus:outline-none"
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.first_name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-3">
        {INDICATORS.map(indicator => (
          <div key={indicator.key}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-700">{indicator.label}</p>
                <p className="text-xs text-stone-400">{indicator.description}</p>
              </div>
              <span className="text-sm font-medium text-stone-600 w-6 text-center">
                {scores[indicator.key]}
              </span>
            </div>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setScore(indicator.key, val)}
                  className={`flex-1 rounded py-1.5 text-xs font-medium transition-colors ${
                    scores[indicator.key] >= val
                      ? val <= 2 ? 'bg-red-100 text-red-700'
                        : val <= 3 ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                      : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <textarea
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Additional observations..."
        className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
      />

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Snapshot'}
        </button>
        {saved && <span className="text-sm text-green-600">Saved successfully</span>}
      </div>
    </form>
  )
}
