'use client';

import clsx from 'clsx';
import type { CheckUnderstandingSlide as CheckUnderstandingSlideType } from '@/lib/types/database';

interface CheckUnderstandingSlideProps {
  slide: CheckUnderstandingSlideType;
  responses: Map<number, string>;
  onSetResponse: (questionIndex: number, value: string) => void;
}

export default function CheckUnderstandingSlide({
  slide,
  responses,
  onSetResponse,
}: CheckUnderstandingSlideProps) {
  return (
    <div className="px-8 py-10">
      <h2 className="font-display mb-2 text-2xl font-bold" style={{ color: 'var(--slide-text)' }}>
        {slide.title}
      </h2>
      <p className="mb-8" style={{ color: 'var(--slide-text-light)' }}>
        Answer the questions below to check your understanding.
      </p>

      <div className="space-y-6">
        {slide.questions.map((question, idx) => {
          const currentResponse = responses.get(idx) ?? '';
          const hasExpected =
            slide.expected_responses.length > idx &&
            slide.expected_responses[idx] !== '';

          return (
            <div
              key={idx}
              className="rounded-xl border bg-white p-5"
              style={{ borderColor: 'var(--slide-border)' }}
            >
              <p className="mb-3 text-base font-medium" style={{ color: 'var(--slide-text)' }}>
                <span
                  className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: 'var(--slide-accent)' }}
                >
                  {idx + 1}
                </span>
                {question}
              </p>

              <textarea
                value={currentResponse}
                onChange={(e) => onSetResponse(idx, e.target.value)}
                placeholder="Type your answer..."
                rows={3}
                className={clsx(
                  'w-full rounded-lg border px-4 py-2.5 text-stone-900 placeholder:text-stone-400',
                  'focus:outline-none focus:ring-2'
                )}
                style={{
                  borderColor: 'var(--slide-border)',
                  backgroundColor: 'var(--slide-bg)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--slide-accent)';
                  e.currentTarget.style.boxShadow = `0 0 0 3px color-mix(in srgb, var(--slide-accent) 20%, transparent)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--slide-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />

              {hasExpected && currentResponse.trim().length > 0 && (
                <div
                  className="mt-3 rounded-lg border px-4 py-3 text-sm"
                  style={{
                    borderColor: 'var(--slide-border)',
                    backgroundColor: 'var(--slide-bg-muted)',
                    color: 'var(--slide-text)',
                  }}
                >
                  <span className="font-bold">Expected:</span>{' '}
                  {slide.expected_responses[idx]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
