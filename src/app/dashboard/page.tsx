import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types/database';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const typedProfile = profile as Profile | null;
  const displayName = typedProfile?.display_name ?? 'there';

  const cards = [
    {
      title: "Today's Lessons",
      description: 'Coming soon',
    },
    {
      title: 'Next Zoom Class',
      description: 'Coming soon',
    },
    {
      title: 'Progress',
      description: 'Coming soon',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800">
        Welcome back, {displayName}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Here is an overview of your day.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-stone-200 bg-white p-6"
          >
            <h2 className="text-sm font-medium text-stone-500">
              {card.title}
            </h2>
            <p className="mt-3 text-lg font-semibold text-stone-300">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
