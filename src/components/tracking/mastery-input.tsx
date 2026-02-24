'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MasteryStatus } from '@/lib/types/database'

const MASTERY_STAGES: { value: MasteryStatus; label: string; color: string; description: string }[] = [
  { value: 'not_introduced', label: 'Not Introduced', color: 'bg-stone-200 text-stone-600', description: 'Skill has not been presented yet' },
  { value: 'presented', label: 'Presented', color: 'bg-purple-100 text-purple-700', description: 'Initial presentation given' },
  { value: 'practicing', label: 'Practicing', color: 'bg-amber-100 text-amber-700', description: 'Actively working on this skill' },
  { value: 'developing', label: 'Developing', color: 'bg-blue-100 text-blue-700', description: 'Showing growing competence' },
  { value: 'mastered', label: 'Mastered', color: 'bg-green-100 text-green-700', description: 'Demonstrates consistent mastery' },
  { value: 'applied', label: 'Applied', color: 'bg-emerald-100 text-emerald-800', description: 'Applies knowledge independently in new contexts' },
]

interface MasteryInputProps {
  studentId: string
  scopeItemId: string
  scopeItemName: string
  currentStatus?: MasteryStatus
  onUpdate?: () => void
}

export function MasteryInput({ studentId, scopeItemId, scopeItemName, currentStatus, onUpdate }: MasteryInputProps) {
  const [status, setStatus] = useState<MasteryStatus>(currentStatus || 'not_introduced')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    setSaved(false)

    const now = new Date().toISOString()
    const updates: Record<string, unknown> = {
      student_id: studentId,
      scope_item_id: scopeItemId,
      status,
      notes: notes || null,
      updated_at: now,
    }

    if (status === 'presented' && currentStatus === 'not_introduced') {
      updates.date_presented = now
    }
    if (status === 'mastered' || status === 'applied') {
      updates.date_mastered = now
    }

    const { error } = await supabase
      .from('student_mastery')
      .upsert(updates, { onConflict: 'student_id,scope_item_id' })

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
      onUpdate?.()
    }

    setSaving(false)
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
      <p className="text-sm font-medium text-stone-700">{scopeItemName}</p>

      {/* Stage selector */}
      <div className="flex flex-wrap gap-1.5">
        {MASTERY_STAGES.map(stage => (
          <button
            key={stage.value}
            onClick={() => setStatus(stage.value)}
            title={stage.description}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              status === stage.value
                ? `${stage.color} ring-2 ring-offset-1 ring-current`
                : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
            }`}
          >
            {stage.label}
          </button>
        ))}
      </div>

      {/* Notes */}
      <textarea
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes..."
        className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
      />

      {/* Save */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving || status === currentStatus}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Update Mastery'}
        </button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
      </div>
    </div>
  )
}
