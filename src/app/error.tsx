'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-semibold text-stone-800">Something went wrong</h2>
        <p className="mt-3 text-sm text-stone-500">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-md bg-green-700 px-6 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
