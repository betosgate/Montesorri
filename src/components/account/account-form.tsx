'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AccountFormProps {
  profile: {
    display_name: string
    phone: string
    timezone: string
  }
  email: string
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
]

export function AccountForm({ profile, email }: AccountFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [phone, setPhone] = useState(profile.phone)
  const [timezone, setTimezone] = useState(profile.timezone)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({
        display_name: displayName || null,
        phone: phone || null,
        timezone,
      })
      .eq('id', user.id)

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700">Email</label>
        <p className="mt-1 text-sm text-stone-500">{email}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && <span className="text-sm text-green-600">Saved</span>}
      </div>
    </form>
  )
}
