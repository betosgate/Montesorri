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
      <h2 className="font-display mb-6 text-2xl font-bold" style={{ color: 'var(--slide-text)' }}>
        {slide.title}
      </h2>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex-1">
          {/* Content card with accent left border */}
          <div
            className="rounded-xl border-l-4 bg-white p-6 shadow-sm"
            style={{
              borderLeftColor: 'var(--slide-accent)',
              borderTop: '1px solid var(--slide-border)',
              borderRight: '1px solid var(--slide-border)',
              borderBottom: '1px solid var(--slide-border)',
            }}
          >
            <div className="flex items-start gap-4">
              {/* Step number badge */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: 'var(--slide-accent)' }}
              >
                {stepNumber}
              </div>
              <p className="mt-1 text-lg leading-relaxed" style={{ color: 'var(--slide-text)', lineHeight: '1.8' }}>
                {slide.content}
              </p>
            </div>
          </div>

          {/* Demonstration notes */}
          {slide.demonstration_notes && (
            <div
              className="mt-6 rounded-xl border px-5 py-4"
              style={{
                backgroundColor: 'var(--slide-bg-muted)',
                borderColor: 'var(--slide-border)',
              }}
            >
              <p className="mb-1 text-sm font-bold" style={{ color: 'var(--slide-text)' }}>
                Demonstration Notes
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--slide-text-light)' }}>
                {slide.demonstration_notes}
              </p>
            </div>
          )}
        </div>

        {slide.image_url && (
          <div className="shrink-0 sm:w-64">
            <div className="overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: 'var(--slide-border)' }}>
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
