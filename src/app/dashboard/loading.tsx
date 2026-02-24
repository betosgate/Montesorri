export default function DashboardLoading() {
  return (
    <div className="py-12 text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-green-600" />
      <p className="mt-3 text-sm text-stone-500">Loading...</p>
    </div>
  )
}
