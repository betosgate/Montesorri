'use client';

import type { InstructionSlide as InstructionSlideType } from '@/lib/types/database';
import type { LightboxImage } from '../slide-player';

interface InstructionSlideProps {
  slide: InstructionSlideType;
  stepNumber: number;
  onImageClick?: (img: LightboxImage) => void;
}

export default function InstructionSlide({
  slide,
  stepNumber,
  onImageClick,
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
            <div
              className="cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-transform hover:scale-[1.02]"
              style={{ borderColor: 'var(--slide-border)' }}
              onClick={() =>
                onImageClick?.({
                  src: slide.image_url!,
                  alt: slide.title,
                })
              }
              role="button"
              tabIndex={0}
              aria-label={`Enlarge image: ${slide.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onImageClick?.({ src: slide.image_url!, alt: slide.title });
                }
              }}
            >
              <img
                src={slide.image_url}
                alt={slide.title}
                className="h-48 w-full object-cover sm:h-full"
              />
              {/* Expand icon overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-2 opacity-0 transition-opacity [div:hover>&]:opacity-100">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M13.28 7.78l3.22-3.22v2.69a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-4.5a.75.75 0 011.5 0v2.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
