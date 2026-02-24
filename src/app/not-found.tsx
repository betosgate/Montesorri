import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-semibold text-stone-800">Page Not Found</h2>
        <p className="mt-3 text-sm text-stone-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-md bg-green-700 px-6 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
