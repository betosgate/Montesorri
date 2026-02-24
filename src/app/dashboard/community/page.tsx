import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PostForm } from '@/components/forum/post-form'

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get categories
  const { data: categories } = await supabase
    .from('forum_categories')
    .select('*')
    .order('sort_order')

  // Get recent posts
  const { data: posts } = await supabase
    .from('forum_posts')
    .select(`
      id,
      title,
      content,
      pinned,
      locked,
      created_at,
      profiles!author_id (
        display_name
      ),
      forum_categories!category_id (
        name
      )
    `)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-800">Community</h2>
          <p className="mt-1 text-sm text-stone-500">
            Connect with other Montessori families.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(categories || []).map((cat) => (
          <span
            key={cat.id}
            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600"
          >
            {cat.name}
          </span>
        ))}
      </div>

      {/* New post form */}
      <div className="mt-6">
        <PostForm categories={categories || []} />
      </div>

      {/* Posts list */}
      <div className="mt-8 space-y-3">
        {(posts || []).map((post) => {
          const author = post.profiles as unknown as { display_name: string } | null
          const category = post.forum_categories as unknown as { name: string } | null

          return (
            <Link
              key={post.id}
              href={`/dashboard/community/${post.id}`}
              className="block rounded-lg border border-stone-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {post.pinned && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        Pinned
                      </span>
                    )}
                    {post.locked && (
                      <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs font-medium text-stone-500">
                        Locked
                      </span>
                    )}
                    {category && (
                      <span className="text-xs text-stone-400">{category.name}</span>
                    )}
                  </div>
                  <h3 className="mt-1 font-medium text-stone-800">{post.title}</h3>
                  <p className="mt-1 text-sm text-stone-500 line-clamp-2">{post.content}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-stone-400">
                <span>{author?.display_name || 'Anonymous'}</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          )
        })}
        {(!posts || posts.length === 0) && (
          <p className="text-center text-sm text-stone-500 py-8">
            No posts yet. Be the first to start a discussion!
          </p>
        )}
      </div>
    </div>
  )
}
