'use client';

import type { TitleSlide as TitleSlideType } from '@/lib/types/database';

interface TitleSlideProps {
  slide: TitleSlideType;
}

export default function TitleSlide({ slide }: TitleSlideProps) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      {slide.image_url && (
        <div className="mb-8 overflow-hidden rounded-2xl shadow-md">
          <img
            src={slide.image_url}
            alt={slide.title}
            className="h-56 w-full max-w-lg object-cover"
          />
        </div>
      )}

      <h1 className="text-4xl font-bold tracking-tight text-stone-800 sm:text-5xl">
        {slide.title}
      </h1>

      {slide.subtitle && (
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-stone-500">
          {slide.subtitle}
        </p>
      )}
    </div>
  );
}
