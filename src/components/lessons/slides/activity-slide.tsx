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

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

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
      <h2 className="font-display mb-2 text-2xl font-bold" style={{ color: 'var(--slide-text)' }}>
        {slide.title}
      </h2>

      <p className="mb-8 text-lg leading-relaxed" style={{ color: 'var(--slide-text-light)' }}>
        {slide.instructions}
      </p>

      {slide.image_url && (
        <div className="mb-8 overflow-hidden rounded-xl border" style={{ borderColor: 'var(--slide-border)' }}>
          <img
            src={slide.image_url}
            alt={slide.title}
            className="h-48 w-full object-cover"
          />
        </div>
      )}

      <div
        className={clsx(
          'mx-auto max-w-sm rounded-2xl border-2 p-6 text-center transition-all',
          isComplete && 'celebrate-bounce'
        )}
        style={{
          borderColor: isComplete ? '#22c55e' : 'var(--slide-border)',
          backgroundColor: isComplete ? '#f0fdf4' : 'white',
        }}
      >
        <p className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--slide-text-light)' }}>
          {isComplete ? 'Time is up!' : 'Time Remaining'}
        </p>

        <p
          className={clsx(
            'mb-4 font-mono text-5xl font-bold',
            isComplete ? 'text-green-600' : ''
          )}
          style={!isComplete ? { color: 'var(--slide-text)' } : undefined}
        >
          {display}
        </p>

        {/* Progress bar */}
        <div className="mb-5 h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--slide-bg-muted)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(progressPercent, 100)}%`,
              backgroundColor: isComplete ? '#22c55e' : 'var(--slide-accent)',
            }}
          />
        </div>

        <div className="flex items-center justify-center gap-3">
          {!isComplete && !isRunning && (
            <button
              type="button"
              onClick={handleStart}
              className="rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-md transition-colors"
              style={{ backgroundColor: 'var(--slide-accent)' }}
            >
              Start
            </button>
          )}

          {!isComplete && isRunning && (
            <button
              type="button"
              onClick={handlePause}
              className="rounded-lg border-2 px-6 py-2.5 text-sm font-bold transition-colors"
              style={{
                borderColor: 'var(--slide-accent)',
                color: 'var(--slide-accent)',
                backgroundColor: 'white',
              }}
            >
              Pause
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
            style={{
              borderColor: 'var(--slide-border)',
              color: 'var(--slide-text-light)',
              backgroundColor: 'white',
            }}
          >
            Reset
          </button>
        </div>

        {isComplete && (
          <p className="mt-4 font-display text-lg font-bold text-green-600">
            Great job!
          </p>
        )}
      </div>
    </div>
  );
}
