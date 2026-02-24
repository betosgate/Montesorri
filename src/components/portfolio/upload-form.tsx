'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PortfolioItemType } from '@/lib/types/database'

interface Student {
  id: string
  first_name: string
}

const ITEM_TYPES: { value: PortfolioItemType; label: string }[] = [
  { value: 'work_sample', label: 'Work Sample' },
  { value: 'photo', label: 'Photo' },
  { value: 'art', label: 'Art' },
  { value: 'writing', label: 'Writing' },
  { value: 'project', label: 'Project' },
  { value: 'video', label: 'Video' },
]

export function PortfolioUpload({ students }: { students: Student[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [studentId, setStudentId] = useState(students[0]?.id || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [itemType, setItemType] = useState<PortfolioItemType>('work_sample')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let fileUrl: string | null = null

      // Upload file if provided
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `portfolio/${studentId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(path, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('portfolio').getPublicUrl(path)
        fileUrl = urlData.publicUrl
      }

      const { error: insertError } = await supabase.from('portfolio_items').insert({
        student_id: studentId,
        title,
        description: description || null,
        item_type: itemType,
        file_url: fileUrl,
        is_featured: false,
      })

      if (insertError) throw insertError

      setTitle('')
      setDescription('')
      setFile(null)
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
      >
        Add to Portfolio
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          required
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.first_name}</option>
          ))}
        </select>

        <select
          value={itemType}
          onChange={(e) => setItemType(e.target.value as PortfolioItemType)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          {ITEM_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <input
        type="text"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g., 'Bead Chain Work', 'Leaf Drawing')"
        className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
      />

      <textarea
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional description..."
        className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
      />

      <input
        type="file"
        accept="image/*,video/*,.pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-stone-500 file:mr-4 file:rounded-md file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-100"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={uploading}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-md px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
