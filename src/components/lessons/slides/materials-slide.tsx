'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { MaterialsSlide as MaterialsSlideType } from '@/lib/types/database';
import type { MaterialInventoryItem, LightboxImage } from '../slide-player';

interface MaterialsSlideProps {
  slide: MaterialsSlideType;
  checkedItems: Set<string>;
  onToggleItem: (item: string) => void;
  materialsInventory?: MaterialInventoryItem[];
  onImageClick?: (img: LightboxImage) => void;
  conversionType?: 'PRINTABLE' | 'DIRECT' | 'NONE';
  printablePdfs?: string[];
  householdSubstitutes?: string[];
  preparationSteps?: string;
}

/** Fuzzy match: check if material name roughly matches an inventory item */
function findInventoryMatch(
  materialName: string,
  inventory?: MaterialInventoryItem[]
): MaterialInventoryItem | undefined {
  if (!inventory) return undefined;
  const lower = materialName.toLowerCase();

  // Exact match first
  const exact = inventory.find(
    (inv) => inv.name.toLowerCase() === lower
  );
  if (exact) return exact;

  // Substring match (either direction)
  const substring = inventory.find(
    (inv) =>
      inv.name.toLowerCase().includes(lower) ||
      lower.includes(inv.name.toLowerCase())
  );
  if (substring) return substring;

  // Word overlap match — if ≥2 significant words match
  const materialWords = lower.split(/\s+/).filter((w) => w.length > 2);
  let bestMatch: MaterialInventoryItem | undefined;
  let bestScore = 0;

  for (const inv of inventory) {
    const invWords = inv.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const overlap = materialWords.filter((w) =>
      invWords.some((iw) => iw.includes(w) || w.includes(iw))
    ).length;
    if (overlap >= 2 && overlap > bestScore) {
      bestScore = overlap;
      bestMatch = inv;
    }
  }

  return bestMatch;
}

export default function MaterialsSlide({
  slide,
  checkedItems,
  onToggleItem,
  materialsInventory,
  onImageClick,
  conversionType,
  printablePdfs,
  householdSubstitutes,
  preparationSteps,
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

              {/* Inventory image thumbnail — clickable for lightbox */}
              {inventoryMatch?.image_url && (
                <div
                  className="h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border transition-transform hover:scale-105"
                  style={{ borderColor: 'var(--slide-border)' }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onImageClick?.({
                      src: inventoryMatch.image_url!,
                      alt: inventoryMatch.name,
                      productCode: inventoryMatch.code,
                      productName: inventoryMatch.name,
                    });
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Enlarge image: ${inventoryMatch.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onImageClick?.({
                        src: inventoryMatch.image_url!,
                        alt: inventoryMatch.name,
                        productCode: inventoryMatch.code,
                        productName: inventoryMatch.name,
                      });
                    }
                  }}
                >
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
                {/* Product code badge */}
                {inventoryMatch?.code && (
                  <span
                    className="ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider"
                    style={{
                      backgroundColor: 'var(--slide-bg-muted)',
                      color: 'var(--slide-text-light)',
                    }}
                  >
                    {inventoryMatch.code}
                  </span>
                )}
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

      {/* Print Materials / Household Substitutes section */}
      {conversionType === 'PRINTABLE' && printablePdfs && printablePdfs.length > 0 && (
        <div className="mt-6 rounded-xl border-2 border-dashed p-4" style={{ borderColor: 'var(--slide-accent)', backgroundColor: 'var(--slide-bg-muted)' }}>
          <div className="mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" style={{ color: 'var(--slide-accent)' }}>
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 9.5a.75.75 0 00-1.5 0v2.19l-.72-.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l2-2a.75.75 0 10-1.06-1.06l-.72.72V11.5z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-bold" style={{ color: 'var(--slide-text)' }}>
              Printable Materials Available
            </span>
          </div>
          <p className="mb-3 text-xs" style={{ color: 'var(--slide-text-light)' }}>
            Print these on cardstock for best results. Cut along dashed lines.
          </p>
          <div className="flex flex-wrap gap-2">
            {printablePdfs.map((pdf) => {
              const filename = pdf.split('/').pop() || pdf;
              return (
                <a
                  key={pdf}
                  href={pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: 'var(--slide-accent)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M8.75 2.75a.75.75 0 00-1.5 0v5.69L5.03 6.22a.75.75 0 00-1.06 1.06l3.5 3.5a.75.75 0 001.06 0l3.5-3.5a.75.75 0 00-1.06-1.06L8.75 8.44V2.75z" />
                    <path d="M3.5 9.75a.75.75 0 00-1.5 0v1.5A2.75 2.75 0 004.75 14h6.5A2.75 2.75 0 0014 11.25v-1.5a.75.75 0 00-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5z" />
                  </svg>
                  {filename.replace('.pdf', '').replace(/-/g, ' ')}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {conversionType === 'DIRECT' && householdSubstitutes && householdSubstitutes.length > 0 && (
        <div className="mt-6 rounded-xl border-2 p-4" style={{ borderColor: 'var(--slide-accent)', backgroundColor: 'var(--slide-bg-muted)' }}>
          <div className="mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" style={{ color: 'var(--slide-accent)' }}>
              <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-bold" style={{ color: 'var(--slide-text)' }}>
              Household Substitutes
            </span>
          </div>
          <ul className="mb-3 space-y-1.5">
            {householdSubstitutes.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm" style={{ color: 'var(--slide-text)' }}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--slide-accent)' }} />
                {item}
              </li>
            ))}
          </ul>
          {preparationSteps && (
            <div className="rounded-lg border bg-white p-3" style={{ borderColor: 'var(--slide-border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--slide-accent)' }}>
                Setup
              </span>
              <p className="mt-1 text-sm" style={{ color: 'var(--slide-text-light)' }}>
                {preparationSteps}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
