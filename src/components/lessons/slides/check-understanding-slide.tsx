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
      <h2 className="mb-2 text-2xl font-bold text-stone-800">
        {slide.title}
      </h2>
      <p className="mb-8 text-stone-500">
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
              className="rounded-lg border border-stone-200 bg-white p-5"
            >
              <p className="mb-3 text-base font-medium text-stone-700">
                <span className="mr-2 text-amber-600">{idx + 1}.</span>
                {question}
              </p>

              <textarea
                value={currentResponse}
                onChange={(e) => onSetResponse(idx, e.target.value)}
                placeholder="Type your answer..."
                rows={3}
                className="w-full rounded-lg border border-stone-300 bg-stone-50 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
              />

              {hasExpected && currentResponse.trim().length > 0 && (
                <div
                  className={clsx(
                    'mt-3 rounded-lg px-4 py-3 text-sm',
                    'border border-blue-200 bg-blue-50 text-blue-700'
                  )}
                >
                  <span className="font-semibold">Expected:</span>{' '}
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
