'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/lib/hooks/use-profile';

export function Header() {
  const router = useRouter();
  const { profile } = useProfile();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="flex h-14 items-center justify-end border-b border-stone-200 bg-white px-6">
      <div className="flex items-center gap-4">
        {profile?.display_name && (
          <span className="text-sm text-stone-600">
            {profile.display_name}
          </span>
        )}
        <button
          onClick={handleSignOut}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
