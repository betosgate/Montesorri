import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ReplyForm } from '@/components/forum/reply-form'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: post } = await supabase
    .from('forum_posts')
    .select(`
      *,
      profiles!author_id (
        display_name
      ),
      forum_categories!category_id (
        name
      )
    `)
    .eq('id', postId)
    .single()

  if (!post) notFound()

  const { data: replies } = await supabase
    .from('forum_replies')
    .select(`
      *,
      profiles!author_id (
        display_name
      )
    `)
    .eq('post_id', postId)
    .order('created_at')

  const author = post.profiles as unknown as { display_name: string } | null
  const category = post.forum_categories as unknown as { name: string } | null

  return (
    <div>
      <Link
        href="/dashboard/community"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
        </svg>
        Back to Community
      </Link>

      {/* Post */}
      <div className="mt-4 rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-2 text-xs text-stone-400">
          {category && <span>{category.name}</span>}
          <span>&middot;</span>
          <span>{author?.display_name || 'Anonymous'}</span>
          <span>&middot;</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <h2 className="mt-2 text-xl font-semibold text-stone-800">{post.title}</h2>
        <div className="mt-4 whitespace-pre-wrap text-stone-600">{post.content}</div>
      </div>

      {/* Replies */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-stone-500">
          {(replies || []).length} {(replies || []).length === 1 ? 'Reply' : 'Replies'}
        </h3>
        <div className="mt-3 space-y-3">
          {(replies || []).map((reply) => {
            const replyAuthor = reply.profiles as unknown as { display_name: string } | null

            return (
              <div key={reply.id} className="rounded-lg border border-stone-100 bg-white p-4">
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <span className="font-medium text-stone-600">
                    {replyAuthor?.display_name || 'Anonymous'}
                  </span>
                  <span>&middot;</span>
                  <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm text-stone-600 whitespace-pre-wrap">{reply.content}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reply form */}
      {!post.locked && (
        <div className="mt-6">
          <ReplyForm postId={postId} />
        </div>
      )}
    </div>
  )
}
