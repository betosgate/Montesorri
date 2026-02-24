'use client'

interface SubscriptionCardProps {
  studentName: string
  gradeBand: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-red-100 text-red-700',
  cancelled: 'bg-stone-100 text-stone-500',
  trialing: 'bg-blue-100 text-blue-700',
}

const GRADE_LABELS: Record<string, string> = {
  primary: 'Primary (K)',
  lower_elementary: 'Lower Elementary (1-3)',
  upper_elementary: 'Upper Elementary (4-6)',
}

export function SubscriptionCard({ studentName, gradeBand, status, currentPeriodEnd, cancelAtPeriodEnd }: SubscriptionCardProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-stone-800">{studentName}</p>
          <p className="text-xs text-stone-400">{GRADE_LABELS[gradeBand] || gradeBand}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || 'bg-stone-100 text-stone-500'}`}>
          {status}
        </span>
      </div>

      <div className="mt-3 text-xs text-stone-500">
        <p>$50/month per student</p>
        <p>
          {cancelAtPeriodEnd
            ? `Cancels on ${new Date(currentPeriodEnd).toLocaleDateString()}`
            : `Renews on ${new Date(currentPeriodEnd).toLocaleDateString()}`
          }
        </p>
      </div>

      {status === 'active' && !cancelAtPeriodEnd && (
        <button className="mt-3 text-xs text-red-500 hover:text-red-700 underline">
          Cancel Subscription
        </button>
      )}
    </div>
  )
}
