'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  first_name: string
  grade_band: string
}

interface Subject {
  id: string
  name: string
  display_name: string
  color: string | null
}

interface Level {
  id: string
  name: string
}

interface LessonRow {
  id: string
  title: string
  week_number: number
  day_of_week: number
  duration_minutes: number
  level_id: string
  subject_id: string
  lesson_type: string
  subjects: unknown
}

interface WorkPlanRow {
  id: string
  student_id: string
  week_number: number
  planned_activities: string[]
  must_do: string[]
  may_do: string[]
  reflection_notes: string | null
}

interface BuilderProps {
  students: Student[]
  subjects: Subject[]
  levels: Level[]
  lessons: LessonRow[]
  workPlans: WorkPlanRow[]
  currentWeek: number
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export function WorkPlanBuilder({ students, subjects, levels, lessons, workPlans, currentWeek }: BuilderProps) {
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id || '')
  const [mustDo, setMustDo] = useState<string[]>([])
  const [mayDo, setMayDo] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const student = students.find(s => s.id === selectedStudent)
  const levelId = levels.find(l => l.name === student?.grade_band)?.id
  const existingPlan = workPlans.find(w => w.student_id === selectedStudent)

  // Filter lessons for this student's level
  const studentLessons = useMemo(() => {
    if (!levelId) return []
    return lessons.filter(l => l.level_id === levelId)
  }, [lessons, levelId])

  // Group by day
  const lessonsByDay = useMemo(() => {
    const map: Record<number, LessonRow[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] }
    for (const l of studentLessons) {
      if (map[l.day_of_week]) map[l.day_of_week].push(l)
    }
    return map
  }, [studentLessons])

  // Initialize from existing plan
  useState(() => {
    if (existingPlan) {
      setMustDo(existingPlan.must_do || [])
      setMayDo(existingPlan.may_do || [])
    } else {
      // Auto-populate must-do with all guided/great_lesson types
      const required = studentLessons
        .filter(l => l.lesson_type === 'guided' || l.lesson_type === 'great_lesson')
        .map(l => l.id)
      setMustDo(required)
    }
  })

  function toggleMustDo(lessonId: string) {
    setMustDo(prev => {
      if (prev.includes(lessonId)) {
        return prev.filter(id => id !== lessonId)
      }
      // Remove from may-do if present
      setMayDo(m => m.filter(id => id !== lessonId))
      return [...prev, lessonId]
    })
  }

  function toggleMayDo(lessonId: string) {
    setMayDo(prev => {
      if (prev.includes(lessonId)) {
        return prev.filter(id => id !== lessonId)
      }
      // Remove from must-do if present
      setMustDo(m => m.filter(id => id !== lessonId))
      return [...prev, lessonId]
    })
  }

  async function handleSave() {
    if (!selectedStudent) return
    setSaving(true)
    setSaved(false)

    const allActivities = [...mustDo, ...mayDo]
    const payload = {
      student_id: selectedStudent,
      week_number: currentWeek,
      academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      planned_activities: allActivities,
      must_do: mustDo,
      may_do: mayDo,
    }

    if (existingPlan) {
      await supabase.from('work_plans').update(payload).eq('id', existingPlan.id)
    } else {
      await supabase.from('work_plans').insert(payload)
    }

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Student selector */}
      {students.length > 1 && (
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
        >
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.first_name}</option>
          ))}
        </select>
      )}

      {/* Week grid */}
      <div className="grid gap-4 lg:grid-cols-5">
        {DAY_NAMES.map((dayName, i) => {
          const dayNum = i + 1
          const dayLessons = lessonsByDay[dayNum] || []

          return (
            <div key={dayNum} className="rounded-lg border border-stone-200 bg-white overflow-hidden">
              <div className="border-b border-stone-200 bg-stone-50 px-3 py-2">
                <h4 className="text-sm font-medium text-stone-700">{dayName}</h4>
                <p className="text-[10px] text-stone-400">
                  {dayLessons.length} activities &middot;{' '}
                  {dayLessons.reduce((sum, l) => sum + l.duration_minutes, 0)} min
                </p>
              </div>

              <div className="divide-y divide-stone-50 p-1">
                {dayLessons.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-stone-400">No lessons</p>
                ) : (
                  dayLessons.map(lesson => {
                    const subj = lesson.subjects as unknown as { display_name: string; color: string | null } | null
                    const isMust = mustDo.includes(lesson.id)
                    const isMay = mayDo.includes(lesson.id)

                    return (
                      <div
                        key={lesson.id}
                        className={`rounded p-2 text-xs ${
                          isMust ? 'bg-green-50 border border-green-200' :
                          isMay ? 'bg-amber-50 border border-amber-200' :
                          'bg-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <span
                            className="mt-0.5 h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: subj?.color || '#999' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-700 truncate">{lesson.title}</p>
                            <p className="text-stone-400">{subj?.display_name} &middot; {lesson.duration_minutes}m</p>
                          </div>
                        </div>
                        <div className="mt-1 flex gap-1">
                          <button
                            onClick={() => toggleMustDo(lesson.id)}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              isMust ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-green-100'
                            }`}
                          >
                            Must Do
                          </button>
                          <button
                            onClick={() => toggleMayDo(lesson.id)}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              isMay ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-500 hover:bg-amber-100'
                            }`}
                          >
                            May Do
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary and save */}
      <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
        <div className="text-sm text-stone-600">
          <span className="font-medium text-green-700">{mustDo.length}</span> must-do &middot;{' '}
          <span className="font-medium text-amber-600">{mayDo.length}</span> may-do &middot;{' '}
          <span className="text-stone-400">
            {studentLessons.length - mustDo.length - mayDo.length} unassigned
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Saved</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Work Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
