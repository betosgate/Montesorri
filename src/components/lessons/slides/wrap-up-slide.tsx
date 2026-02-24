'use client';

import type { WrapUpSlide as WrapUpSlideType } from '@/lib/types/database';

interface WrapUpSlideProps {
  slide: WrapUpSlideType;
  onComplete?: () => void;
}

// Confetti colors — warm, celebratory palette
const confettiColors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ec4899', '#06b6d4'];

export default function WrapUpSlide({ slide, onComplete }: WrapUpSlideProps) {
  return (
    <div className="relative overflow-hidden px-8 py-10">
      {/* Confetti particles */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center gap-4">
        {confettiColors.map((color, i) => (
          <div
            key={i}
            className="confetti-piece h-3 w-3 rounded-full"
            style={{
              backgroundColor: color,
              animationDelay: `${i * 0.15}s`,
              marginLeft: `${(i - 4) * 30}px`,
            }}
          />
        ))}
      </div>

      {/* Animated checkmark */}
      <div className="mb-6 text-center">
        <div className="scale-enter mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--slide-bg-muted)' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="var(--slide-accent)" strokeWidth="3" opacity="0.3" />
            <path
              className="check-draw"
              d="M12 20l6 6 10-12"
              stroke="var(--slide-accent)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <h2
          className="font-display text-3xl font-extrabold"
          style={{ color: 'var(--slide-accent)' }}
        >
          Great Work!
        </h2>
      </div>

      <p className="mx-auto mb-6 max-w-prose text-center text-base leading-relaxed" style={{ color: 'var(--slide-text-light)' }}>
        {slide.summary}
      </p>

      {slide.next_steps && (
        <div
          className="mx-auto mb-6 max-w-prose rounded-xl border px-5 py-4"
          style={{
            borderColor: 'var(--slide-border)',
            backgroundColor: 'var(--slide-bg-muted)',
          }}
        >
          <p className="mb-1 text-sm font-bold" style={{ color: 'var(--slide-text)' }}>
            Next Steps
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--slide-text-light)' }}>
            {slide.next_steps}
          </p>
        </div>
      )}

      {slide.extension_activities.length > 0 && (
        <div
          className="mx-auto mb-6 max-w-prose rounded-xl border px-5 py-4"
          style={{
            borderColor: 'var(--slide-border)',
            backgroundColor: 'white',
          }}
        >
          <p className="mb-2 text-sm font-bold" style={{ color: 'var(--slide-text)' }}>
            Extension Activities
          </p>
          <ul className="space-y-1.5">
            {slide.extension_activities.map((activity, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--slide-text-light)' }}>
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--slide-accent)' }}
                />
                {activity}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onComplete && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onComplete}
            className="celebrate-bounce inline-flex items-center gap-2 rounded-xl bg-green-700 px-8 py-3 text-base font-bold text-white shadow-lg transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            Mark Lesson Complete
          </button>
        </div>
      )}
    </div>
  );
}
