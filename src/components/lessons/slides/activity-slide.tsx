'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import type { ActivitySlide as ActivitySlideType } from '@/lib/types/database';

interface ActivitySlideProps {
  slide: ActivitySlideType;
  timerSeconds: number;
  onTimerChange: (seconds: number) => void;
}

export default function ActivitySlide({
  slide,
  timerSeconds,
  onTimerChange,
}: ActivitySlideProps) {
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef(timerSeconds);

  const totalSeconds = (slide.duration_minutes ?? 5) * 60;
  const isComplete = timerSeconds <= 0;

  const minutes = Math.floor(Math.abs(timerSeconds) / 60);
  const seconds = Math.abs(timerSeconds) % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Keep ref in sync
  timerRef.current = timerSeconds;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleStart = useCallback(() => {
    if (isComplete) return;
    clearTimer();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      const next = timerRef.current - 1;
      onTimerChange(next);
      if (next <= 0) {
        clearTimer();
        setIsRunning(false);
      }
    }, 1000);
  }, [isComplete, clearTimer, onTimerChange]);

  const handlePause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const handleReset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    onTimerChange(totalSeconds);
  }, [clearTimer, onTimerChange, totalSeconds]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Stop running when timer hits zero externally
  useEffect(() => {
    if (timerSeconds <= 0 && isRunning) {
      clearTimer();
      setIsRunning(false);
    }
  }, [timerSeconds, isRunning, clearTimer]);

  const progressPercent =
    totalSeconds > 0
      ? ((totalSeconds - timerSeconds) / totalSeconds) * 100
      : 100;

  return (
    <div className="px-8 py-10">
      <h2 className="mb-2 text-2xl font-bold text-stone-800">
        {slide.title}
      </h2>

      <p className="mb-8 text-base leading-relaxed text-stone-600">
        {slide.instructions}
      </p>

      {slide.image_url && (
        <div className="mb-8 overflow-hidden rounded-xl">
          <img
            src={slide.image_url}
            alt={slide.title}
            className="h-48 w-full object-cover"
          />
        </div>
      )}

      <div
        className={clsx(
          'mx-auto max-w-sm rounded-2xl border-2 p-6 text-center transition-colors',
          isComplete
            ? 'animate-pulse border-green-400 bg-green-50'
            : 'border-stone-200 bg-stone-50'
        )}
      >
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-stone-500">
          {isComplete ? 'Time is up!' : 'Time Remaining'}
        </p>

        <p
          className={clsx(
            'mb-4 font-mono text-5xl font-bold',
            isComplete ? 'text-green-600' : 'text-stone-800'
          )}
        >
          {display}
        </p>

        {/* Progress bar */}
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-stone-200">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-1000',
              isComplete ? 'bg-green-500' : 'bg-amber-500'
            )}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-3">
          {!isComplete && !isRunning && (
            <button
              type="button"
              onClick={handleStart}
              className="rounded-lg bg-green-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
            >
              Start
            </button>
          )}

          {!isComplete && isRunning && (
            <button
              type="button"
              onClick={handlePause}
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
            >
              Pause
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-stone-300 bg-white px-5 py-2 text-sm font-semibold text-stone-600 shadow-sm transition-colors hover:bg-stone-50"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
