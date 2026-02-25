'use client';

import { useEffect, useCallback } from 'react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  /** Optional product code shown below enlarged image (for materials) */
  productCode?: string;
  /** Optional product name shown below enlarged image (for materials) */
  productName?: string;
  onClose: () => void;
}

export default function ImageLightbox({
  src,
  alt,
  productCode,
  productName,
  onClose,
}: ImageLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll while lightbox is open
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/40"
        aria-label="Close lightbox"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>

      {/* Image container — stop click propagation so clicking the image doesn't close */}
      <div
        className="flex max-h-[90vh] max-w-[90vw] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
        />

        {/* Product info for materials */}
        {(productCode || productName) && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-white">
            {productCode && (
              <span className="rounded bg-white/25 px-2 py-0.5 text-xs font-bold tracking-wider">
                {productCode}
              </span>
            )}
            {productName && (
              <span className="text-sm font-medium">{productName}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
