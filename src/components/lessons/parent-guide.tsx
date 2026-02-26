'use client';

import { useCallback } from 'react';
import type { Slide } from '@/lib/types/database';
import type { MaterialInventoryItem } from './slide-player';

interface ParentGuideProps {
  parentNotes?: string | null;
  materialsInventory?: MaterialInventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  lessonTitle?: string;
  subjectName?: string;
  slides?: Slide[];
  conversionType?: 'PRINTABLE' | 'DIRECT' | 'NONE';
  householdSubstitutes?: string[];
  preparationSteps?: string;
  controlOfError?: string;
  extensionIdeas?: string[];
  printablePdfs?: string[];
}

/** Extract key text from slides into a compact lesson summary */
function buildLessonText(slides: Slide[], lessonTitle: string, subjectName?: string): string {
  const parts: string[] = [];

  parts.push(`${lessonTitle}${subjectName ? ` (${subjectName})` : ''}`);

  for (const slide of slides) {
    switch (slide.type) {
      case 'materials':
        parts.push(`Materials: ${slide.materials.join(', ')}`);
        break;
      case 'instruction':
        parts.push(`Step: ${slide.title} - ${slide.content}`);
        break;
      case 'activity':
        parts.push(`Activity: ${slide.title} - ${slide.instructions}`);
        break;
      case 'check_understanding':
        for (let i = 0; i < slide.questions.length; i++) {
          parts.push(`Q: ${slide.questions[i]}${slide.expected_responses[i] ? ` A: ${slide.expected_responses[i]}` : ''}`);
        }
        break;
      case 'wrap_up':
        parts.push(`Summary: ${slide.summary}`);
        break;
    }
  }

  return parts.join('\n');
}

export default function ParentGuide({
  parentNotes,
  materialsInventory,
  isOpen,
  onClose,
  lessonTitle,
  subjectName,
  slides,
  conversionType,
  householdSubstitutes,
  preparationSteps,
  controlOfError,
  extensionIdeas,
  printablePdfs,
}: ParentGuideProps) {
  const handleAskClaude = useCallback(() => {
    if (!slides || !lessonTitle) return;

    const lessonText = buildLessonText(slides, lessonTitle, subjectName);

    const prompt = `Please respond with plain text only — no documents, artifacts, or code. Use **bold** for section titles. Keep it concise and practical. I'm a homeschool parent (not a trained teacher) preparing to teach this Montessori lesson to my child.

Lesson: ${lessonText}

Please give me a short, helpful guide with these sections:

**Why This Matters** — What is my child learning and why? One paragraph.

**Setup** — How to prepare the workspace and materials. Quick bullet list.

**Teaching Script** — Walk me through it step by step. What should I say and do? Where should I pause and let my child try? Keep it brief and natural.

**If My Child Struggles** — 2-3 common issues and what to say. Montessori style — guide, don't correct.

**Signs of Mastery** — How do I know they got it vs need to repeat?

Keep it warm and encouraging, like a mentor helping a friend.`;

    // Open Claude.ai with the prompt pre-filled
    const url = `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [slides, lessonTitle, subjectName, parentNotes]);

  if (!isOpen) return null;

  const diyItems = materialsInventory?.filter((m) => m.diy_alternative) ?? [];

  return (
    <div className="panel-slide-down border-b" style={{ borderColor: 'var(--slide-border)' }}>
      <div className="px-6 py-5" style={{ backgroundColor: '#fdfaf5' }}>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold" style={{ color: 'var(--slide-text)' }}>
            Parent&apos;s Guide
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            aria-label="Close parent guide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-stone-500">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* About This Lesson */}
          {parentNotes && (
            <div className="rounded-lg border border-amber-100 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-700">
                    <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.999 8.999 0 00-4.25 1.065V16.82zM9.25 4.065A8.999 8.999 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
                  </svg>
                </span>
                <span className="text-sm font-bold text-amber-800">About This Lesson</span>
              </div>
              <p className="text-sm leading-relaxed text-stone-600">{parentNotes}</p>
            </div>
          )}

          {/* What to Observe */}
          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-blue-700">
                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-sm font-bold text-blue-800">What to Observe</span>
            </div>
            <ul className="space-y-1.5 text-sm text-stone-600">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                Watch for concentration and engagement levels
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                Note which materials draw the most attention
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                Observe if the child self-corrects mistakes
              </li>
            </ul>
          </div>

          {/* Materials Tips */}
          {diyItems.length > 0 && (
            <div className="rounded-lg border border-green-100 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-green-700">
                    <path fillRule="evenodd" d="M14.5 10a4.5 4.5 0 004.284-5.882c-.105-.324-.51-.391-.752-.15L15.34 6.66a.454.454 0 01-.493.101 3.046 3.046 0 01-1.6-1.6.454.454 0 01.1-.493l2.69-2.69c.243-.244.175-.648-.148-.753A4.5 4.5 0 0010.5 5.5c0 .206.014.41.04.61-2.42 2.142-4.496 4.57-6.166 7.27a5.527 5.527 0 00-.907-.076A3.468 3.468 0 000 16.77 3.468 3.468 0 003.468 20c1.79 0 3.28-1.36 3.462-3.104 2.637-1.654 5.01-3.69 7.1-6.063.2.026.4.04.607.04l-.138.127zm-5.348 6.725a.75.75 0 01.112 1.055 3.47 3.47 0 01-.925.81.75.75 0 11-.766-1.29c.2-.119.38-.265.524-.433a.75.75 0 011.055-.142zM4 18a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-sm font-bold text-green-800">DIY Alternatives</span>
              </div>
              <ul className="space-y-2 text-sm text-stone-600">
                {diyItems.map((item) => (
                  <li key={item.code} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                    <span>
                      <span className="font-medium text-stone-700">{item.name}:</span>{' '}
                      {item.diy_alternative}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Conversion-specific guidance */}
        {(controlOfError || extensionIdeas || preparationSteps) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Preparation Steps */}
            {preparationSteps && (
              <div className="rounded-lg border border-orange-100 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-orange-700">
                      <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
                      <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686A41.454 41.454 0 0110 18c-1.572 0-3.118-.12-4.637-.26C3.985 17.586 3 16.402 3 15.056z" />
                    </svg>
                  </span>
                  <span className="text-sm font-bold text-orange-800">Before You Start</span>
                </div>
                <p className="text-sm leading-relaxed text-stone-600">{preparationSteps}</p>
              </div>
            )}

            {/* Control of Error */}
            {controlOfError && (
              <div className="rounded-lg border border-purple-100 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-purple-700">
                      <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-sm font-bold text-purple-800">Self-Check</span>
                </div>
                <p className="text-sm leading-relaxed text-stone-600">{controlOfError}</p>
              </div>
            )}

            {/* Extension Ideas */}
            {extensionIdeas && extensionIdeas.length > 0 && (
              <div className="rounded-lg border border-teal-100 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-teal-700">
                      <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06a.75.75 0 11-1.06 1.061L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.061a.75.75 0 01-1.062-1.06l1.061-1.06a.75.75 0 011.06 0zM10 7a3 3 0 100 6 3 3 0 000-6zm-6.25 3a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5H3a.75.75 0 01.75.75zm14.5 0a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5H17a.75.75 0 01.75.75zm-12.14 4.89a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm8.28 0a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15z" />
                    </svg>
                  </span>
                  <span className="text-sm font-bold text-teal-800">Extension Ideas</span>
                </div>
                <ul className="space-y-1.5 text-sm text-stone-600">
                  {extensionIdeas.map((idea) => (
                    <li key={idea} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Printable PDFs in parent guide */}
        {printablePdfs && printablePdfs.length > 0 && (
          <div className="mt-4 rounded-lg border border-indigo-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-indigo-700">
                  <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 9.5a.75.75 0 00-1.5 0v2.19l-.72-.72a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l2-2a.75.75 0 10-1.06-1.06l-.72.72V11.5z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-sm font-bold text-indigo-800">Printable Materials</span>
            </div>
            <p className="mb-2 text-xs text-stone-500">Print on cardstock for durability. Cut along dashed lines.</p>
            <div className="flex flex-wrap gap-2">
              {printablePdfs.map((pdf) => {
                const filename = pdf.split('/').pop() || pdf;
                return (
                  <a
                    key={pdf}
                    href={pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-indigo-700"
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

        {/* Ask Claude for Help button */}
        {slides && slides.length > 0 && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleAskClaude}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-[#D97706] bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-2.5 text-sm font-bold text-amber-900 shadow-sm transition-all hover:from-amber-100 hover:to-orange-100 hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-amber-700">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              Need extra help? Ask Claude AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
