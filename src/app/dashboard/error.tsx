'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="py-12 text-center">
      <h2 className="text-xl font-semibold text-stone-800">Something went wrong</h2>
      <p className="mt-2 text-sm text-stone-500">
        {error.message || 'Failed to load this page. Please try again.'}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
      >
        Try Again
      </button>
    </div>
  )
}
