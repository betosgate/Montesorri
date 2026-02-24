'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
}

export function PostForm({ categories }: { categories: Category[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
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

      const { error: insertError } = await supabase.from('forum_posts').insert({
        category_id: categoryId,
        author_id: user.id,
        title,
        content,
      })

      if (insertError) throw insertError

      setTitle('')
      setContent('')
      setCategoryId('')
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
      >
        New Post
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-4 space-y-3">
      <div>
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          <option value="">Select category...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        />
      </div>
      <div>
        <textarea
          required
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post'}
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
