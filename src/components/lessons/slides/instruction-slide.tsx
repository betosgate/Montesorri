'use client';

import type { InstructionSlide as InstructionSlideType } from '@/lib/types/database';

interface InstructionSlideProps {
  slide: InstructionSlideType;
  stepNumber: number;
}

export default function InstructionSlide({
  slide,
  stepNumber,
}: InstructionSlideProps) {
  return (
    <div className="px-8 py-10">
      <h2 className="mb-6 text-2xl font-bold text-stone-800">
        {slide.title}
      </h2>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex-1">
          <div className="mb-4 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700">
              {stepNumber}
            </div>
            <p className="mt-1.5 text-base leading-relaxed text-stone-700">
              {slide.content}
            </p>
          </div>

          {slide.demonstration_notes && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="mb-1 text-sm font-semibold text-amber-800">
                Demonstration Notes
              </p>
              <p className="text-sm leading-relaxed text-amber-700">
                {slide.demonstration_notes}
              </p>
            </div>
          )}
        </div>

        {slide.image_url && (
          <div className="shrink-0 sm:w-64">
            <div className="overflow-hidden rounded-xl shadow-sm">
              <img
                src={slide.image_url}
                alt={slide.title}
                className="h-48 w-full object-cover sm:h-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
