'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SlidePlayer from '@/components/lessons/slide-player'
import type { Lesson, SlideContent } from '@/lib/types/database'
import type { MaterialInventoryItem } from '@/components/lessons/slide-player'
import Link from 'next/link'

interface LessonWithSubject extends Lesson {
  subjects: {
    name: string
    display_name: string
    color: string | null
  }
  curriculum_levels: {
    name: string
  } | null
}

export default function LessonDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lessonId = params.lessonId as string
  const studentId = searchParams.get('studentId')

  const [lesson, setLesson] = useState<LessonWithSubject | null>(null)
  const [materialsInventory, setMaterialsInventory] = useState<MaterialInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function fetchLesson() {
      const { data } = await supabase
        .from('lessons')
        .select(`
          *,
          subjects (
            name,
            display_name,
            color
          ),
          curriculum_levels!level_id (
            name
          )
        `)
        .eq('id', lessonId)
        .single()

      // Supabase FK joins may return arrays; normalize to single object
      const raw = data as unknown as (LessonWithSubject & { curriculum_levels: { name: string } | { name: string }[] | null }) | null
      if (raw && Array.isArray(raw.curriculum_levels)) {
        raw.curriculum_levels = raw.curriculum_levels[0] ?? null
      }
      const lessonData = raw as LessonWithSubject | null
      setLesson(lessonData)

      // Fetch matching materials inventory items
      if (lessonData?.materials_needed && (lessonData.materials_needed as string[]).length > 0) {
        const materialNames = lessonData.materials_needed as string[]
        const { data: inventoryData } = await supabase
          .from('materials_inventory')
          .select('name, code, image_url, what_it_teaches, diy_alternative')

        if (inventoryData) {
          // Fuzzy match: inventory item name includes material name or vice versa
          const matched = inventoryData.filter((inv) =>
            materialNames.some(
              (m) =>
                inv.name.toLowerCase().includes(m.toLowerCase()) ||
                m.toLowerCase().includes(inv.name.toLowerCase())
            )
          ) as MaterialInventoryItem[]
          setMaterialsInventory(matched)
        }
      }

      setLoading(false)
    }

    fetchLesson()
  }, [lessonId, supabase])

  const handleComplete = useCallback(async () => {
    if (!studentId || completing) return
    setCompleting(true)

    const { error } = await supabase
      .from('student_lesson_progress')
      .upsert(
        {
          student_id: studentId,
          lesson_id: lessonId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,lesson_id' }
      )

    if (error) {
      console.error('Failed to mark complete:', error)
      setCompleting(false)
      return
    }

    router.push('/dashboard/lessons')
  }, [studentId, lessonId, completing, supabase, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-green-600" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="py-10 text-center">
        <h2 className="text-lg font-semibold text-stone-800">Lesson not found</h2>
        <Link
          href="/dashboard/lessons"
          className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-800"
        >
          Back to Today&apos;s Lessons
        </Link>
      </div>
    )
  }

  const slideContent = lesson.slide_content as SlideContent | null
  const hasSlides = slideContent?.slides && slideContent.slides.length > 0

  return (
    <div>
      {/* Back link */}
      <Link
        href="/dashboard/lessons"
        className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
        </svg>
        Back to Today&apos;s Lessons
      </Link>

      <div className="mt-4">
        {hasSlides ? (
          <SlidePlayer
            slides={slideContent!.slides}
            audioUrl={lesson.audio_url || undefined}
            lessonTitle={lesson.title}
            subjectName={lesson.subjects?.name}
            gradeBand={lesson.curriculum_levels?.name}
            parentNotes={lesson.parent_notes}
            materialsNeeded={lesson.materials_needed as string[]}
            materialsInventory={materialsInventory}
            conversionType={slideContent?.conversion_type}
            printablePdfs={slideContent?.printable_pdfs}
            householdSubstitutes={slideContent?.household_substitutes}
            preparationSteps={slideContent?.preparation_steps}
            controlOfError={slideContent?.control_of_error}
            extensionIdeas={slideContent?.extension_ideas}
            onComplete={studentId ? handleComplete : undefined}
          />
        ) : (
          /* Fallback: text-based lesson view */
          <div className="mx-auto max-w-2xl rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: lesson.subjects?.color ? `${lesson.subjects.color}20` : '#f5f5f4',
                  color: lesson.subjects?.color || '#57534e',
                }}
              >
                {lesson.subjects?.display_name}
              </span>
              <span className="ml-2 text-xs text-stone-400 capitalize">
                {lesson.lesson_type} &middot; {lesson.duration_minutes} min
              </span>
            </div>

            <h2 className="text-2xl font-semibold text-stone-800">{lesson.title}</h2>

            {lesson.description && (
              <p className="mt-3 text-stone-600">{lesson.description}</p>
            )}

            {lesson.instructions && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                  Instructions
                </h3>
                <div className="mt-2 whitespace-pre-wrap text-stone-700">
                  {lesson.instructions}
                </div>
              </div>
            )}

            {lesson.materials_needed && (lesson.materials_needed as string[]).length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                  Materials Needed
                </h3>
                <ul className="mt-2 space-y-1">
                  {(lesson.materials_needed as string[]).map((m, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-stone-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lesson.parent_notes && (
              <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
                <h3 className="text-sm font-semibold text-amber-800">Parent Notes</h3>
                <p className="mt-1 text-sm text-amber-700">{lesson.parent_notes}</p>
              </div>
            )}

            {studentId && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="mt-8 w-full rounded-lg bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
              >
                {completing ? 'Marking Complete...' : 'Mark as Complete'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
