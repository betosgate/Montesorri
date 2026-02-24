import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortfolioUpload } from '@/components/portfolio/upload-form'

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get students
  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, grade_band')
    .eq('parent_id', user.id)
    .eq('enrollment_status', 'active')

  // Get portfolio items
  const studentIds = (students || []).map(s => s.id)
  const { data: portfolioItems } = studentIds.length > 0
    ? await supabase
        .from('portfolio_items')
        .select('*')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div>
      <div>
        <h2 className="text-xl font-semibold text-stone-800">Portfolio</h2>
        <p className="mt-1 text-sm text-stone-500">
          Showcase your student&apos;s best work, photos, and projects.
        </p>
      </div>

      {/* Upload form */}
      <div className="mt-6">
        <PortfolioUpload students={students || []} />
      </div>

      {/* Portfolio gallery */}
      <div className="mt-8">
        {(!portfolioItems || portfolioItems.length === 0) ? (
          <p className="text-center text-sm text-stone-500 py-8">
            No portfolio items yet. Upload work samples, photos, or projects above.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(portfolioItems || []).map((item) => {
              const student = students?.find(s => s.id === item.student_id)
              return (
                <div key={item.id} className="rounded-lg border border-stone-200 bg-white overflow-hidden">
                  {item.file_url && (
                    <div className="aspect-video bg-stone-100 flex items-center justify-center">
                      {item.item_type === 'photo' || item.item_type === 'art' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.file_url} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-stone-400 text-sm">{item.item_type}</div>
                      )}
                    </div>
                  )}
                  <div className="p-3">
                    <h4 className="font-medium text-stone-800">{item.title}</h4>
                    {item.description && (
                      <p className="mt-1 text-xs text-stone-500 line-clamp-2">{item.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-stone-400">
                      <span>{student?.first_name || 'Student'}</span>
                      <span>&middot;</span>
                      <span>{item.item_type}</span>
                      <span>&middot;</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      {item.is_featured && (
                        <span className="rounded bg-amber-100 px-1 text-amber-700 font-medium">Featured</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
