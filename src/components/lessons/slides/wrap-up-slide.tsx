'use client';

import type { WrapUpSlide as WrapUpSlideType } from '@/lib/types/database';

interface WrapUpSlideProps {
  slide: WrapUpSlideType;
  onComplete?: () => void;
}

export default function WrapUpSlide({ slide, onComplete }: WrapUpSlideProps) {
  return (
    <div className="px-8 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-8 w-8 text-green-600"
          >
            <path
              fillRule="evenodd"
              d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-stone-800">Great Work!</h2>
      </div>

      <p className="mx-auto mb-6 max-w-prose text-center text-base leading-relaxed text-stone-600">
        {slide.summary}
      </p>

      {slide.next_steps && (
        <div className="mx-auto mb-6 max-w-prose rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="mb-1 text-sm font-semibold text-amber-800">
            Next Steps
          </p>
          <p className="text-sm leading-relaxed text-amber-700">
            {slide.next_steps}
          </p>
        </div>
      )}

      {slide.extension_activities.length > 0 && (
        <div className="mx-auto mb-6 max-w-prose rounded-lg border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-blue-800">
            Extension Activities
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-blue-700">
            {slide.extension_activities.map((activity, idx) => (
              <li key={idx}>{activity}</li>
            ))}
          </ul>
        </div>
      )}

      {onComplete && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600/20 focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            Mark Lesson Complete
          </button>
        </div>
      )}
    </div>
  );
}
