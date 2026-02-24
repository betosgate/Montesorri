'use client'

import type { MasteryStatus } from '@/lib/types/database'

interface MasteryItem {
  id: string
  name: string
  sub_area: string | null
  status: MasteryStatus
  sort_order: number
}

interface MasteryMapProps {
  items: MasteryItem[]
  subjectName: string
  subjectColor: string
}

const STATUS_COLORS: Record<MasteryStatus, string> = {
  not_introduced: 'bg-stone-200',
  presented: 'bg-purple-300',
  practicing: 'bg-amber-300',
  developing: 'bg-blue-400',
  mastered: 'bg-green-500',
  applied: 'bg-emerald-600',
}

const STATUS_LABELS: Record<MasteryStatus, string> = {
  not_introduced: 'Not Introduced',
  presented: 'Presented',
  practicing: 'Practicing',
  developing: 'Developing',
  mastered: 'Mastered',
  applied: 'Applied',
}

export function MasteryMap({ items, subjectName, subjectColor }: MasteryMapProps) {
  // Group items by sub_area
  const grouped: Record<string, MasteryItem[]> = {}
  for (const item of items) {
    const area = item.sub_area || 'General'
    if (!grouped[area]) grouped[area] = []
    grouped[area].push(item)
  }

  // Sort each group
  for (const area of Object.keys(grouped)) {
    grouped[area].sort((a, b) => a.sort_order - b.sort_order)
  }

  // Calculate stats
  const total = items.length
  const mastered = items.filter(i => i.status === 'mastered' || i.status === 'applied').length
  const inProgress = items.filter(i => i.status === 'practicing' || i.status === 'developing').length
  const presented = items.filter(i => i.status === 'presented').length
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: subjectColor }} />
          <h4 className="font-medium text-stone-800">{subjectName}</h4>
        </div>
        <span className="text-sm text-stone-500">{pct}% mastered</span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-2 rounded-full bg-stone-100 overflow-hidden">
        <div className="flex h-full">
          <div className="bg-emerald-600 transition-all" style={{ width: `${total > 0 ? (mastered / total) * 100 : 0}%` }} />
          <div className="bg-blue-400 transition-all" style={{ width: `${total > 0 ? (inProgress / total) * 100 : 0}%` }} />
          <div className="bg-purple-300 transition-all" style={{ width: `${total > 0 ? (presented / total) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="mt-1 flex gap-4 text-[10px] text-stone-400">
        <span>{mastered} mastered</span>
        <span>{inProgress} in progress</span>
        <span>{presented} presented</span>
      </div>

      {/* Skill grid by sub-area */}
      <div className="mt-4 space-y-3">
        {Object.entries(grouped).map(([area, areaItems]) => (
          <div key={area}>
            <p className="text-xs font-medium text-stone-500 mb-1">{area}</p>
            <div className="flex flex-wrap gap-1">
              {areaItems.map(item => (
                <div
                  key={item.id}
                  title={`${item.name}: ${STATUS_LABELS[item.status]}`}
                  className={`h-4 w-4 rounded-sm ${STATUS_COLORS[item.status]} cursor-help transition-transform hover:scale-150`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-sm ${STATUS_COLORS[status as MasteryStatus]}`} />
            <span className="text-[10px] text-stone-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
