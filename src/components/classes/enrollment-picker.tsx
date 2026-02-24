'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  first_name: string
  grade_band: string
}

interface ClassRow {
  id: string
  title: string
  grade_band: string
  day_of_week: number
  start_time: string
  duration_minutes: number
  max_students: number
  zoom_link: string | null
  teachers: unknown
}

interface EnrollmentRow {
  id: string
  student_id: string
  class_id: string
  status: string
}

interface EnrollmentPickerProps {
  students: Student[]
  classes: ClassRow[]
  enrollments: EnrollmentRow[]
}

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const GRADE_LABELS: Record<string, string> = {
  primary: 'Primary (K)',
  lower_elementary: 'Lower Elementary (1-3)',
  upper_elementary: 'Upper Elementary (4-6)',
}

export function EnrollmentPicker({ students, classes, enrollments }: EnrollmentPickerProps) {
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id || '')
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const student = students.find(s => s.id === selectedStudent)
  const studentEnrollments = enrollments.filter(e => e.student_id === selectedStudent)
  const enrolledClassIds = new Set(studentEnrollments.map(e => e.class_id))

  // Filter classes matching student's grade band
  const matchingClasses = classes.filter(c => c.grade_band === student?.grade_band)
  const otherClasses = classes.filter(c => c.grade_band !== student?.grade_band)

  async function handleEnroll(classId: string) {
    if (!selectedStudent) return
    setEnrolling(classId)

    await supabase.from('enrollments').insert({
      student_id: selectedStudent,
      class_id: classId,
      status: 'active',
    })

    setEnrolling(null)
    router.refresh()
  }

  async function handleUnenroll(classId: string) {
    const enrollment = studentEnrollments.find(e => e.class_id === classId)
    if (!enrollment) return
    setEnrolling(classId)

    await supabase.from('enrollments').update({ status: 'withdrawn' }).eq('id', enrollment.id)

    setEnrolling(null)
    router.refresh()
  }

  function renderClassCard(cls: ClassRow) {
    const teacher = cls.teachers as unknown as {
      user_id: string
      bio: string | null
      profiles: { display_name: string } | null
    } | null
    const teacherName = teacher?.profiles?.display_name || 'TBA'
    const isEnrolled = enrolledClassIds.has(cls.id)

    return (
      <div key={cls.id} className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-stone-800">{cls.title}</h4>
            <p className="mt-1 text-xs text-stone-400">
              {DAY_NAMES[cls.day_of_week]}s at {cls.start_time} &middot; {cls.duration_minutes} min
            </p>
            <p className="text-xs text-stone-400">
              Teacher: {teacherName} &middot; Max {cls.max_students} students
            </p>
            <span className="mt-1 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">
              {GRADE_LABELS[cls.grade_band] || cls.grade_band}
            </span>
          </div>
          <div>
            {isEnrolled ? (
              <button
                onClick={() => handleUnenroll(cls.id)}
                disabled={enrolling === cls.id}
                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {enrolling === cls.id ? '...' : 'Unenroll'}
              </button>
            ) : (
              <button
                onClick={() => handleEnroll(cls.id)}
                disabled={enrolling === cls.id}
                className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800 disabled:opacity-50"
              >
                {enrolling === cls.id ? '...' : 'Enroll'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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

      {/* Matching classes */}
      <div>
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">
          Classes for {GRADE_LABELS[student?.grade_band || ''] || 'your student'}
        </h3>
        <div className="mt-2 space-y-2">
          {matchingClasses.length === 0 ? (
            <p className="text-sm text-stone-400 py-4">No classes available for this grade band yet.</p>
          ) : (
            matchingClasses.map(renderClassCard)
          )}
        </div>
      </div>

      {/* Other classes */}
      {otherClasses.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-wide mt-6">
            Other Grade Levels
          </h3>
          <div className="mt-2 space-y-2 opacity-75">
            {otherClasses.map(renderClassCard)}
          </div>
        </div>
      )}
    </div>
  )
}
