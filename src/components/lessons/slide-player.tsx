'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import type { Slide } from '@/lib/types/database';
import TitleSlide from './slides/title-slide';
import MaterialsSlide from './slides/materials-slide';
import InstructionSlide from './slides/instruction-slide';
import ActivitySlide from './slides/activity-slide';
import CheckUnderstandingSlide from './slides/check-understanding-slide';
import WrapUpSlide from './slides/wrap-up-slide';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SlidePlayerProps {
  slides: Slide[];
  audioUrl?: string;
  lessonTitle: string;
  onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Count instruction slides up to (and including) the given index so we can
 *  show a sequential step number for each instruction slide. */
function getInstructionStepNumber(slides: Slide[], index: number): number {
  let step = 0;
  for (let i = 0; i <= index; i++) {
    if (slides[i].type === 'instruction') {
      step++;
    }
  }
  return step;
}

/** Return the initial timer value for an activity slide. */
function getActivityDuration(slide: Slide): number {
  if (slide.type === 'activity') {
    return (slide.duration_minutes ?? 5) * 60;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SlidePlayer({
  slides,
  audioUrl,
  lessonTitle,
  onComplete,
}: SlidePlayerProps) {
  // ---- Navigation state ---------------------------------------------------
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // ---- Audio state --------------------------------------------------------
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // ---- Materials checklist state ------------------------------------------
  const [materialsChecked, setMaterialsChecked] = useState<Set<string>>(
    () => new Set()
  );

  // ---- Activity timer state -----------------------------------------------
  const [activityTimerSeconds, setActivityTimerSeconds] = useState(() => {
    const firstActivity = slides.find((s) => s.type === 'activity');
    return firstActivity ? getActivityDuration(firstActivity) : 0;
  });

  // ---- Check-understanding responses --------------------------------------
  const [responses, setResponses] = useState<Map<number, string>>(
    () => new Map()
  );

  // ---- Fullscreen state ---------------------------------------------------
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Derived values
  const totalSlides = slides.length;
  const currentSlide = slides[currentSlideIndex];
  const isLastSlide = currentSlideIndex === totalSlides - 1;
  const progressPercent = ((currentSlideIndex + 1) / totalSlides) * 100;

  // ---- Navigation handlers ------------------------------------------------

  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSlides) return;

      // When navigating to an activity slide, initialise its timer
      const target = slides[index];
      if (target.type === 'activity') {
        setActivityTimerSeconds(getActivityDuration(target));
      }

      // Reset check-understanding responses when navigating away
      if (currentSlide.type === 'check_understanding' && index !== currentSlideIndex) {
        // keep responses — user may navigate back
      }

      setCurrentSlideIndex(index);
    },
    [totalSlides, slides, currentSlide, currentSlideIndex]
  );

  const goNext = useCallback(() => {
    goToSlide(currentSlideIndex + 1);
  }, [goToSlide, currentSlideIndex]);

  const goPrev = useCallback(() => {
    goToSlide(currentSlideIndex - 1);
  }, [goToSlide, currentSlideIndex]);

  // ---- Keyboard navigation ------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // ---- Audio controls -----------------------------------------------------

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // ---- Materials toggle ---------------------------------------------------

  const toggleMaterial = useCallback((item: string) => {
    setMaterialsChecked((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  }, []);

  // ---- Check-understanding response handler -------------------------------

  const setResponse = useCallback((questionIndex: number, value: string) => {
    setResponses((prev) => {
      const next = new Map(prev);
      next.set(questionIndex, value);
      return next;
    });
  }, []);

  // ---- Timer change handler (for activity slide) --------------------------

  const handleTimerChange = useCallback((value: number) => {
    setActivityTimerSeconds(value);
  }, []);

  // ---- Fullscreen ---------------------------------------------------------

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        // Fullscreen not supported or denied
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ---- Render the current slide -------------------------------------------

  function renderSlide() {
    switch (currentSlide.type) {
      case 'title':
        return <TitleSlide slide={currentSlide} />;

      case 'materials':
        return (
          <MaterialsSlide
            slide={currentSlide}
            checkedItems={materialsChecked}
            onToggleItem={toggleMaterial}
          />
        );

      case 'instruction':
        return (
          <InstructionSlide
            slide={currentSlide}
            stepNumber={getInstructionStepNumber(slides, currentSlideIndex)}
          />
        );

      case 'activity':
        return (
          <ActivitySlide
            slide={currentSlide}
            timerSeconds={activityTimerSeconds}
            onTimerChange={handleTimerChange}
          />
        );

      case 'check_understanding':
        return (
          <CheckUnderstandingSlide
            slide={currentSlide}
            responses={responses}
            onSetResponse={setResponse}
          />
        );

      case 'wrap_up':
        return (
          <WrapUpSlide
            slide={currentSlide}
            onComplete={onComplete}
          />
        );

      default:
        return null;
    }
  }

  // =========================================================================
  // JSX
  // =========================================================================

  return (
    <div
      ref={containerRef}
      className={clsx(
        'mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-lg',
        isFullscreen && 'max-w-none rounded-none'
      )}
    >
      {/* ---- Hidden audio element ---------------------------------------- */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}

      {/* ---- Progress bar ------------------------------------------------ */}
      <div className="h-1.5 w-full bg-stone-100">
        <div
          className="h-full rounded-r-full bg-green-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ---- Top toolbar ------------------------------------------------- */}
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-3">
        <h3 className="truncate text-sm font-semibold text-stone-600">
          {lessonTitle}
        </h3>

        <div className="flex items-center gap-2">
          {/* Audio play/pause button */}
          {audioUrl && (
            <button
              type="button"
              onClick={toggleAudio}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isPlaying ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              )}
            </button>
          )}

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M3.28 2.22a.75.75 0 00-1.06 1.06L5.44 6.5H2.75a.75.75 0 000 1.5h4.5A.75.75 0 008 7.25v-4.5a.75.75 0 00-1.5 0v2.69L3.28 2.22zM13.5 2.75a.75.75 0 00-1.5 0v4.5c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-2.69l3.22-3.22a.75.75 0 00-1.06-1.06L13.5 5.44V2.75zM3.28 17.78a.75.75 0 01-1.06-1.06l3.22-3.22H2.75a.75.75 0 010-1.5h4.5c.414 0 .75.336.75.75v4.5a.75.75 0 01-1.5 0v-2.69l-3.22 3.22zM13.5 14.56l3.22 3.22a.75.75 0 001.06-1.06l-3.22-3.22h2.69a.75.75 0 000-1.5h-4.5a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-2.69z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M13.28 7.78l3.22-3.22v2.69a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-4.5a.75.75 0 011.5 0v2.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zM12.22 13.28l3.22 3.22h-2.69a.75.75 0 000 1.5h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-1.5 0v2.69l-3.22-3.22a.75.75 0 00-1.06 1.06zM3.5 4.56l3.22 3.22a.75.75 0 001.06-1.06L4.56 3.5h2.69a.75.75 0 000-1.5h-4.5a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0V4.56z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ---- Slide content ----------------------------------------------- */}
      <div
        className={clsx(
          'flex-1 overflow-y-auto',
          isFullscreen ? 'min-h-0' : 'min-h-[400px]'
        )}
      >
        {renderSlide()}
      </div>

      {/* ---- Bottom navigation bar --------------------------------------- */}
      <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4">
        {/* Previous button */}
        <button
          type="button"
          onClick={goPrev}
          disabled={currentSlideIndex === 0}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            currentSlideIndex === 0
              ? 'cursor-not-allowed text-stone-300'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
          Previous
        </button>

        {/* Slide counter */}
        <span className="text-sm font-medium text-stone-500">
          {currentSlideIndex + 1} of {totalSlides}
        </span>

        {/* Next / Mark Complete button */}
        {isLastSlide ? (
          onComplete ? (
            <button
              type="button"
              onClick={onComplete}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
            >
              Mark Complete
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
            </button>
          ) : (
            <span className="px-4 py-2 text-sm text-stone-300">End</span>
          )
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-stone-900"
          >
            Next
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
