'use client';

import type { TitleSlide as TitleSlideType } from '@/lib/types/database';
import type { LightboxImage } from '../slide-player';

interface TitleSlideProps {
  slide: TitleSlideType;
  subjectDisplayName?: string;
  onImageClick?: (img: LightboxImage) => void;
}

export default function TitleSlide({ slide, subjectDisplayName, onImageClick }: TitleSlideProps) {
  return (
    <div className="relative overflow-hidden">
      {slide.image_url ? (
        /* Hero image with gradient overlay */
        <div
          className="relative min-h-[380px] cursor-pointer"
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
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

          {/* Expand hint */}
          <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 [div:hover>&]:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M13.28 7.78l3.22-3.22v2.69a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-4.5a.75.75 0 011.5 0v2.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zM12.22 13.28l3.22 3.22h-2.69a.75.75 0 000 1.5h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-1.5 0v2.69l-3.22-3.22a.75.75 0 00-1.06 1.06zM3.5 4.56l3.22 3.22a.75.75 0 001.06-1.06L4.56 3.5h2.69a.75.75 0 000-1.5h-4.5a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0V4.56z" />
            </svg>
          </div>

          {/* Subject badge */}
          {subjectDisplayName && (
            <div className="absolute left-6 top-6">
              <span
                className="badge-pop inline-block rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-lg"
                style={{ backgroundColor: 'var(--slide-accent)' }}
              >
                {subjectDisplayName}
              </span>
            </div>
          )}

          {/* Title overlaid on gradient */}
          <div className="absolute inset-x-0 bottom-0 px-8 pb-10 pt-20">
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="mt-3 max-w-xl text-lg leading-relaxed text-white/85 drop-shadow">
                {slide.subtitle}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* No image: warm gradient background */
        <div
          className="flex min-h-[380px] flex-col items-center justify-center px-8 py-16 text-center"
          style={{
            background: `linear-gradient(135deg, var(--slide-bg) 0%, var(--slide-bg-muted) 100%)`,
          }}
        >
          {/* Subject badge */}
          {subjectDisplayName && (
            <span
              className="badge-pop mb-6 inline-block rounded-full px-4 py-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--slide-accent)' }}
            >
              {subjectDisplayName}
            </span>
          )}

          {/* Decorative circles */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-[0.08]" style={{ backgroundColor: 'var(--slide-accent)' }} />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-[0.06]" style={{ backgroundColor: 'var(--slide-accent)' }} />

          <h1
            className="font-display relative text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl"
            style={{ color: 'var(--slide-text)' }}
          >
            {slide.title}
          </h1>

          {slide.subtitle && (
            <p
              className="relative mt-4 max-w-xl text-lg leading-relaxed"
              style={{ color: 'var(--slide-text-light)' }}
            >
              {slide.subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
