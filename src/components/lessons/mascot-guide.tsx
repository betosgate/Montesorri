'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MascotCharacter } from '@/lib/mascot/config';

interface MascotGuideProps {
  mascot: MascotCharacter;
  explanation: string | null | undefined;
  audioUrl: string | null | undefined;
}

export default function MascotGuide({ mascot, explanation, audioUrl }: MascotGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset when slide changes (explanation prop changes)
  useEffect(() => {
    setIsOpen(false);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [explanation]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleListen = useCallback(() => {
    if (!audioUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      audioRef.current = null;
    });
    audio.addEventListener('error', () => {
      setIsPlaying(false);
      audioRef.current = null;
    });

    audio.play().catch(() => {
      setIsPlaying(false);
      audioRef.current = null;
    });
  }, [audioUrl, isPlaying]);

  // Graceful degradation: no explanation = no mascot
  if (!explanation) return null;

  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
      {/* Speech bubble */}
      {isOpen && (
        <div className="mascot-bubble-in w-64 rounded-2xl border bg-white p-4 shadow-xl sm:w-72"
          style={{ borderColor: 'var(--slide-accent, #e5e7eb)' }}
        >
          {/* Header */}
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">{mascot.emoji}</span>
            <span className="font-display text-sm font-bold" style={{ color: 'var(--slide-accent, #374151)' }}>
              {mascot.name}
            </span>
          </div>

          {/* Explanation text */}
          <p className="text-sm leading-relaxed text-gray-700">
            {explanation}
          </p>

          {/* Listen button */}
          {audioUrl && (
            <button
              type="button"
              onClick={handleListen}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: 'var(--slide-accent, #6b7280)' }}
            >
              {isPlaying ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.061 5.5 5.5 0 010 7.778.75.75 0 001.06 1.06 7 7 0 000-9.899z" />
                    <path d="M13.829 7.172a.75.75 0 00-1.061 1.06 2.5 2.5 0 010 3.536.75.75 0 001.06 1.06 4 4 0 000-5.656z" />
                  </svg>
                  Listen
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Floating mascot button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 ${
          isPlaying ? 'mascot-talking' : 'mascot-idle'
        }`}
        style={{
          backgroundColor: 'var(--slide-bg-muted, #f3f4f6)',
          border: '3px solid var(--slide-accent, #d1d5db)',
          fontSize: '1.75rem',
        }}
        aria-label={`${isOpen ? 'Close' : 'Ask'} ${mascot.name}`}
      >
        {mascot.emoji}
      </button>
    </div>
  );
}
