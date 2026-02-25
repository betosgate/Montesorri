'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import clsx from 'clsx';
import type { Slide } from '@/lib/types/database';
import { getSubjectTheme, themeToStyle, getSubjectDisplayName } from '@/lib/theme/subject-colors';
import TitleSlide from './slides/title-slide';
import MaterialsSlide from './slides/materials-slide';
import InstructionSlide from './slides/instruction-slide';
import ActivitySlide from './slides/activity-slide';
import CheckUnderstandingSlide from './slides/check-understanding-slide';
import WrapUpSlide from './slides/wrap-up-slide';
import ParentGuide from './parent-guide';
import MascotGuide from './mascot-guide';
import ImageLightbox from './image-lightbox';
import { getMascot } from '@/lib/mascot/config';

// ---------------------------------------------------------------------------
// Lightbox state type
// ---------------------------------------------------------------------------

export interface LightboxImage {
  src: string;
  alt: string;
  productCode?: string;
  productName?: string;
}

// ---------------------------------------------------------------------------
// Exported types for parent-guide and lesson page
// ---------------------------------------------------------------------------

export interface MaterialInventoryItem {
  name: string;
  code: string;
  image_url: string | null;
  what_it_teaches: string | null;
  diy_alternative: string | null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SlidePlayerProps {
  slides: Slide[];
  audioUrl?: string;
  lessonTitle: string;
  subjectName?: string;
  gradeBand?: string;
  parentNotes?: string | null;
  materialsNeeded?: string[];
  materialsInventory?: MaterialInventoryItem[];
  onComplete?: () => void;
}

// ---------------------------------------------------------------------------
// Normalize raw JSON slides to match TypeScript Slide types
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSlide(raw: any): Slide {
  switch (raw.type) {
    case 'title':
      return {
        type: 'title',
        title: raw.title || raw.heading || '',
        subtitle: raw.subtitle || raw.subheading || null,
        image_url: raw.image_url || null,
        mascot_explanation: raw.mascot_explanation || null,
        mascot_audio_url: raw.mascot_audio_url || null,
      };
    case 'materials':
      return {
        type: 'materials',
        title: raw.title || 'Materials Needed',
        materials: raw.materials || raw.items || [],
        image_url: raw.image_url || null,
        mascot_explanation: raw.mascot_explanation || null,
        mascot_audio_url: raw.mascot_audio_url || null,
      };
    case 'instruction':
      return {
        type: 'instruction',
        title: raw.title || (raw.step ? `Step ${raw.step}` : ''),
        content: raw.content || raw.text || '',
        image_url: raw.image_url || null,
        demonstration_notes: raw.demonstration_notes || null,
        mascot_explanation: raw.mascot_explanation || null,
        mascot_audio_url: raw.mascot_audio_url || null,
      };
    case 'activity':
      return {
        type: 'activity',
        title: raw.title || 'Activity Time',
        instructions: raw.instructions || raw.prompt || '',
        duration_minutes: raw.duration_minutes ?? null,
        image_url: raw.image_url || null,
        mascot_explanation: raw.mascot_explanation || null,
        mascot_audio_url: raw.mascot_audio_url || null,
      };
    case 'check_understanding':
      return {
        type: 'check_understanding',
        title: raw.title || 'Check Understanding',
        questions: raw.questions || [],
        expected_responses: raw.expected_responses || [],
        mascot_explanation: raw.mascot_explanation || null,
        mascot_audio_url: raw.mascot_audio_url || null,
      };
    case 'wrap_up':
      return {
        type: 'wrap_up',
        title: raw.title || 'Wrap Up',
        summary: raw.summary || raw.text || '',
        next_steps: raw.next_steps || raw.mastery_check || null,
        extension_activities: raw.extension_activities || [],
        mascot_explanation: raw.mascot_explanation || null,
        mascot_audio_url: raw.mascot_audio_url || null,
      };
    default:
      return raw as Slide;
  }
}

function normalizeSlides(raw: Slide[]): Slide[] {
  return raw.map(normalizeSlide);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInstructionStepNumber(slides: Slide[], index: number): number {
  let step = 0;
  for (let i = 0; i <= index; i++) {
    if (slides[i].type === 'instruction') {
      step++;
    }
  }
  return step;
}

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
  slides: rawSlides,
  audioUrl,
  lessonTitle,
  subjectName,
  gradeBand,
  parentNotes,
  materialsInventory,
  onComplete,
}: SlidePlayerProps) {
  const slides = useMemo(() => normalizeSlides(rawSlides), [rawSlides]);

  // Mascot
  const mascot = useMemo(() => getMascot(gradeBand), [gradeBand]);

  // Theme
  const theme = useMemo(() => getSubjectTheme(subjectName), [subjectName]);
  const themeStyle = useMemo(() => themeToStyle(theme), [theme]);
  const subjectDisplayName = useMemo(
    () => getSubjectDisplayName(subjectName),
    [subjectName]
  );

  // ---- Lightbox state -----------------------------------------------------
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null);
  const openLightbox = useCallback((img: LightboxImage) => setLightboxImage(img), []);
  const closeLightbox = useCallback(() => setLightboxImage(null), []);

  // ---- Navigation state ---------------------------------------------------
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');

  // ---- Parent guide state -------------------------------------------------
  const [showParentGuide, setShowParentGuide] = useState(false);

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

      setSlideDirection(index > currentSlideIndex ? 'right' : 'left');

      const target = slides[index];
      if (target.type === 'activity') {
        setActivityTimerSeconds(getActivityDuration(target));
      }

      setCurrentSlideIndex(index);
    },
    [totalSlides, slides, currentSlideIndex]
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
      }).catch(() => {});
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
        return (
          <TitleSlide
            slide={currentSlide}
            subjectDisplayName={subjectDisplayName}
            onImageClick={openLightbox}
          />
        );

      case 'materials':
        return (
          <MaterialsSlide
            slide={currentSlide}
            checkedItems={materialsChecked}
            onToggleItem={toggleMaterial}
            materialsInventory={materialsInventory}
            onImageClick={openLightbox}
          />
        );

      case 'instruction':
        return (
          <InstructionSlide
            slide={currentSlide}
            stepNumber={getInstructionStepNumber(slides, currentSlideIndex)}
            onImageClick={openLightbox}
          />
        );

      case 'activity':
        return (
          <ActivitySlide
            slide={currentSlide}
            timerSeconds={activityTimerSeconds}
            onTimerChange={handleTimerChange}
            onImageClick={openLightbox}
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
      style={themeStyle}
      className={clsx(
        'mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-lg',
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
      <div className="h-2 w-full" style={{ backgroundColor: 'var(--slide-bg-muted)' }}>
        <div
          className="h-full rounded-r-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: 'var(--slide-accent)',
          }}
        />
      </div>

      {/* ---- Top toolbar ------------------------------------------------- */}
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{
          backgroundColor: 'var(--slide-bg)',
          borderBottom: '1px solid var(--slide-border)',
        }}
      >
        <h3
          className="font-display truncate text-sm font-bold"
          style={{ color: 'var(--slide-text)' }}
        >
          {lessonTitle}
        </h3>

        <div className="flex items-center gap-1.5">
          {/* Parent's Guide button */}
          {(parentNotes || (materialsInventory && materialsInventory.length > 0)) && (
            <button
              type="button"
              onClick={() => setShowParentGuide(!showParentGuide)}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                showParentGuide
                  ? 'text-white'
                  : 'hover:opacity-80'
              )}
              style={{
                backgroundColor: showParentGuide ? 'var(--slide-accent)' : 'var(--slide-bg-muted)',
                color: showParentGuide ? '#fff' : 'var(--slide-text)',
              }}
              aria-label="Toggle parent guide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.999 8.999 0 00-4.25 1.065V16.82zM9.25 4.065A8.999 8.999 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
              </svg>
              <span className="hidden sm:inline">Parent&apos;s Guide</span>
            </button>
          )}

          {/* Audio play/pause button */}
          {audioUrl && (
            <button
              type="button"
              onClick={toggleAudio}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-70"
              style={{ color: 'var(--slide-text-light)' }}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              )}
            </button>
          )}

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--slide-text-light)' }}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06L5.44 6.5H2.75a.75.75 0 000 1.5h4.5A.75.75 0 008 7.25v-4.5a.75.75 0 00-1.5 0v2.69L3.28 2.22zM13.5 2.75a.75.75 0 00-1.5 0v4.5c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-2.69l3.22-3.22a.75.75 0 00-1.06-1.06L13.5 5.44V2.75zM3.28 17.78a.75.75 0 01-1.06-1.06l3.22-3.22H2.75a.75.75 0 010-1.5h4.5c.414 0 .75.336.75.75v4.5a.75.75 0 01-1.5 0v-2.69l-3.22 3.22zM13.5 14.56l3.22 3.22a.75.75 0 001.06-1.06l-3.22-3.22h2.69a.75.75 0 000-1.5h-4.5a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-2.69z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M13.28 7.78l3.22-3.22v2.69a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.69l-3.22 3.22a.75.75 0 001.06 1.06zM2 17.25v-4.5a.75.75 0 011.5 0v2.69l3.22-3.22a.75.75 0 011.06 1.06L4.56 16.5h2.69a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zM12.22 13.28l3.22 3.22h-2.69a.75.75 0 000 1.5h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-1.5 0v2.69l-3.22-3.22a.75.75 0 00-1.06 1.06zM3.5 4.56l3.22 3.22a.75.75 0 001.06-1.06L4.56 3.5h2.69a.75.75 0 000-1.5h-4.5a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0V4.56z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ---- Parent Guide panel ------------------------------------------ */}
      <ParentGuide
        parentNotes={parentNotes}
        materialsInventory={materialsInventory}
        isOpen={showParentGuide}
        onClose={() => setShowParentGuide(false)}
        lessonTitle={lessonTitle}
        subjectName={subjectDisplayName}
        slides={slides}
      />

      {/* ---- Slide content ----------------------------------------------- */}
      <div
        className={clsx(
          'relative flex-1 overflow-y-auto',
          isFullscreen ? 'min-h-0' : 'min-h-[420px]'
        )}
        style={{ backgroundColor: 'var(--slide-bg)' }}
      >
        <div
          key={currentSlideIndex}
          className={slideDirection === 'right' ? 'slide-enter' : 'slide-enter-left'}
        >
          {renderSlide()}
        </div>

        {/* Mascot guide overlay */}
        {mascot && (
          <MascotGuide
            mascot={mascot}
            explanation={currentSlide.mascot_explanation}
            audioUrl={currentSlide.mascot_audio_url}
          />
        )}
      </div>

      {/* ---- Lightbox overlay --------------------------------------------- */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          productCode={lightboxImage.productCode}
          productName={lightboxImage.productName}
          onClose={closeLightbox}
        />
      )}

      {/* ---- Bottom navigation bar --------------------------------------- */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{
          backgroundColor: 'var(--slide-bg)',
          borderTop: '1px solid var(--slide-border)',
        }}
      >
        {/* Previous button */}
        <button
          type="button"
          onClick={goPrev}
          disabled={currentSlideIndex === 0}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            currentSlideIndex === 0 && 'cursor-not-allowed opacity-30'
          )}
          style={{
            color: currentSlideIndex === 0 ? 'var(--slide-text-light)' : 'var(--slide-text)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
          Previous
        </button>

        {/* Slide counter */}
        <span className="text-sm font-medium" style={{ color: 'var(--slide-text-light)' }}>
          {currentSlideIndex + 1} of {totalSlides}
        </span>

        {/* Next / Mark Complete button */}
        {isLastSlide ? (
          onComplete ? (
            <button
              type="button"
              onClick={onComplete}
              className="celebrate-bounce inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-green-800"
            >
              Mark Complete
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <span className="px-4 py-2 text-sm" style={{ color: 'var(--slide-text-light)' }}>
              End
            </span>
          )
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors"
            style={{
              backgroundColor: 'var(--slide-accent)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.accentHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.accent;
            }}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
