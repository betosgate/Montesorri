'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { MaterialsSlide as MaterialsSlideType } from '@/lib/types/database';
import type { MaterialInventoryItem } from '../slide-player';

interface MaterialsSlideProps {
  slide: MaterialsSlideType;
  checkedItems: Set<string>;
  onToggleItem: (item: string) => void;
  materialsInventory?: MaterialInventoryItem[];
}

/** Fuzzy match: check if material name roughly matches an inventory item */
function findInventoryMatch(
  materialName: string,
  inventory?: MaterialInventoryItem[]
): MaterialInventoryItem | undefined {
  if (!inventory) return undefined;
  const lower = materialName.toLowerCase();
  return inventory.find(
    (inv) =>
      inv.name.toLowerCase().includes(lower) ||
      lower.includes(inv.name.toLowerCase())
  );
}

export default function MaterialsSlide({
  slide,
  checkedItems,
  onToggleItem,
  materialsInventory,
}: MaterialsSlideProps) {
  const allChecked =
    slide.materials.length > 0 &&
    slide.materials.every((item) => checkedItems.has(item));

  const [diyTooltip, setDiyTooltip] = useState<string | null>(null);

  return (
    <div className="px-8 py-10">
      <div className="mb-2 flex items-center gap-3">
        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--slide-text)' }}>
          {slide.title}
        </h2>
        {allChecked && (
          <span
            className="badge-pop inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--slide-accent)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
            All ready!
          </span>
        )}
      </div>

      <p className="mb-6" style={{ color: 'var(--slide-text-light)' }}>
        Gather these materials before starting:
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {slide.materials.map((item) => {
          const isChecked = checkedItems.has(item);
          const inventoryMatch = findInventoryMatch(item, materialsInventory);

          return (
            <label
              key={item}
              className={clsx(
                'relative flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all',
                isChecked && 'scale-[0.98]'
              )}
              style={{
                borderColor: isChecked ? 'var(--slide-accent)' : 'var(--slide-border)',
                backgroundColor: isChecked ? 'var(--slide-bg-muted)' : 'white',
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleItem(item)}
                className="sr-only"
              />

              {/* Custom checkbox */}
              <div
                className={clsx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                  isChecked ? 'border-transparent text-white' : ''
                )}
                style={{
                  backgroundColor: isChecked ? 'var(--slide-accent)' : 'white',
                  borderColor: isChecked ? 'var(--slide-accent)' : 'var(--slide-border)',
                }}
              >
                {isChecked && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Inventory image thumbnail */}
              {inventoryMatch?.image_url && (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border" style={{ borderColor: 'var(--slide-border)' }}>
                  <img
                    src={inventoryMatch.image_url}
                    alt={inventoryMatch.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <span
                  className={clsx(
                    'text-base font-medium transition-colors',
                    isChecked && 'line-through opacity-60'
                  )}
                  style={{ color: 'var(--slide-text)' }}
                >
                  {item}
                </span>
              </div>

              {/* DIY badge */}
              {inventoryMatch?.diy_alternative && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDiyTooltip(diyTooltip === item ? null : item);
                    }}
                    className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: 'var(--slide-accent)' }}
                  >
                    DIY
                  </button>
                  {diyTooltip === item && (
                    <div
                      className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border bg-white p-3 text-xs shadow-lg"
                      style={{ borderColor: 'var(--slide-border)' }}
                    >
                      <p className="font-bold" style={{ color: 'var(--slide-text)' }}>
                        DIY Alternative:
                      </p>
                      <p className="mt-1 text-stone-600">{inventoryMatch.diy_alternative}</p>
                    </div>
                  )}
                </div>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
