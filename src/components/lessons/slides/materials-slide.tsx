'use client';

import clsx from 'clsx';
import type { MaterialsSlide as MaterialsSlideType } from '@/lib/types/database';

interface MaterialsSlideProps {
  slide: MaterialsSlideType;
  checkedItems: Set<string>;
  onToggleItem: (item: string) => void;
}

export default function MaterialsSlide({
  slide,
  checkedItems,
  onToggleItem,
}: MaterialsSlideProps) {
  const allChecked =
    slide.materials.length > 0 &&
    slide.materials.every((item) => checkedItems.has(item));

  return (
    <div className="px-8 py-10">
      <div className="mb-2 flex items-center gap-3">
        <h2 className="text-2xl font-bold text-stone-800">
          {slide.title}
        </h2>
        {allChecked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            All ready
          </span>
        )}
      </div>

      <p className="mb-6 text-stone-500">
        You&apos;ll need:
      </p>

      <ul className="space-y-3">
        {slide.materials.map((item) => {
          const isChecked = checkedItems.has(item);
          return (
            <li key={item}>
              <label
                className={clsx(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
                  isChecked
                    ? 'border-green-200 bg-green-50'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleItem(item)}
                  className="h-5 w-5 rounded border-stone-300 text-green-600 focus:ring-green-500"
                />
                <span
                  className={clsx(
                    'text-base',
                    isChecked ? 'text-stone-400 line-through' : 'text-stone-700'
                  )}
                >
                  {item}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {slide.image_url && (
        <div className="mt-6 overflow-hidden rounded-xl">
          <img
            src={slide.image_url}
            alt="Materials reference"
            className="h-48 w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
