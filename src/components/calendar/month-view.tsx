'use client'

import { useState, useMemo } from 'react'

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
  subjects: unknown
}

interface SessionRow {
  id: string
  session_date: string
  start_time: string
  duration_minutes: number
  zoom_link: string | null
  classes: unknown
}

interface MonthViewProps {
  students: Student[]
  subjects: Subject[]
  levels: Level[]
  lessons: LessonRow[]
  sessions: SessionRow[]
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getAcademicWeek(date: Date): number {
  const startMonth = 8 // September (0-indexed)
  const startYear = date.getMonth() >= startMonth ? date.getFullYear() : date.getFullYear() - 1
  const academicStart = new Date(startYear, startMonth, 1)
  // Find the first Monday of the academic year
  while (academicStart.getDay() !== 1) {
    academicStart.setDate(academicStart.getDate() + 1)
  }
  const diff = date.getTime() - academicStart.getTime()
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(36, week))
}

function getDayOfWeek(date: Date): number {
  const day = date.getDay()
  // Convert to 1=Monday ... 5=Friday
  return day === 0 ? 0 : day // 0 = Sunday (not a school day)
}

export function MonthView({ students, subjects, levels, lessons, sessions }: MonthViewProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string>(students[0]?.id || '')

  const studentGradeBand = students.find(s => s.id === selectedStudent)?.grade_band
  const levelId = levels.find(l => l.name === studentGradeBand)?.id

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const startPad = firstDay.getDay()
    const days: (Date | null)[] = []

    for (let i = 0; i < startPad; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(currentYear, currentMonth, d))
    }
    return days
  }, [currentMonth, currentYear])

  // Map lessons to dates
  const lessonsByDate = useMemo(() => {
    const map: Record<string, LessonRow[]> = {}
    if (!levelId) return map

    const filtered = lessons.filter(l => l.level_id === levelId)
    for (const day of calendarDays) {
      if (!day) continue
      const dow = getDayOfWeek(day)
      if (dow === 0 || dow === 6) continue // weekend
      const week = getAcademicWeek(day)
      const key = day.toISOString().slice(0, 10)
      map[key] = filtered.filter(l => l.week_number === week && l.day_of_week === dow)
    }
    return map
  }, [lessons, levelId, calendarDays])

  // Map sessions to dates
  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionRow[]> = {}
    for (const s of sessions) {
      const key = s.session_date
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    return map
  }, [sessions])

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
    setSelectedDate(null)
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
    setSelectedDate(null)
  }

  const selectedDateKey = selectedDate?.toISOString().slice(0, 10)
  const selectedLessons = selectedDateKey ? (lessonsByDate[selectedDateKey] || []) : []
  const selectedSessions = selectedDateKey ? (sessionsByDate[selectedDateKey] || []) : []

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

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4">
        <button onClick={prevMonth} className="rounded p-1 hover:bg-stone-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-stone-600">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-stone-800">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <button onClick={nextMonth} className="rounded p-1 hover:bg-stone-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-stone-600">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-stone-200">
          {WEEKDAYS.map(day => (
            <div key={day} className="px-2 py-2 text-center text-xs font-medium text-stone-500">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            if (!day) {
              return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-stone-100 bg-stone-50" />
            }

            const key = day.toISOString().slice(0, 10)
            const dayLessons = lessonsByDate[key] || []
            const daySessions = sessionsByDate[key] || []
            const isToday = key === today.toISOString().slice(0, 10)
            const isSelected = selectedDateKey === key
            const isWeekend = day.getDay() === 0 || day.getDay() === 6

            // Collect unique subject colors for dots
            const subjectColors: string[] = []
            for (const l of dayLessons) {
              const subj = l.subjects as unknown as { color: string | null } | null
              const color = subj?.color || '#999'
              if (!subjectColors.includes(color)) subjectColors.push(color)
            }

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(day)}
                className={`min-h-[80px] border-b border-r border-stone-100 p-1 text-left transition-colors ${
                  isSelected ? 'bg-green-50 ring-2 ring-inset ring-green-600' :
                  isWeekend ? 'bg-stone-50' : 'hover:bg-stone-50'
                }`}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday ? 'bg-green-700 font-bold text-white' : 'text-stone-700'
                }`}>
                  {day.getDate()}
                </span>

                {/* Subject color dots */}
                {subjectColors.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {subjectColors.slice(0, 6).map((color, ci) => (
                      <span
                        key={ci}
                        className="block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    {subjectColors.length > 6 && (
                      <span className="text-[9px] text-stone-400">+{subjectColors.length - 6}</span>
                    )}
                  </div>
                )}

                {/* Zoom indicator */}
                {daySessions.length > 0 && (
                  <div className="mt-0.5">
                    <span className="inline-block rounded bg-blue-100 px-1 text-[9px] font-medium text-blue-700">
                      Zoom
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <h4 className="font-medium text-stone-800">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h4>

          {selectedSessions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Zoom Classes</p>
              {selectedSessions.map(s => {
                const cls = s.classes as unknown as { title: string } | null
                return (
                  <div key={s.id} className="mt-1 flex items-center gap-2 rounded bg-blue-50 px-3 py-2">
                    <span className="text-sm font-medium text-blue-800">{cls?.title || 'Class'}</span>
                    <span className="text-xs text-blue-600">{s.start_time}</span>
                    {s.zoom_link && (
                      <a href={s.zoom_link} target="_blank" rel="noopener noreferrer"
                        className="ml-auto rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700">
                        Join
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {selectedLessons.length > 0 ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                {selectedLessons.length} Lessons
              </p>
              {selectedLessons.map(l => {
                const subj = l.subjects as unknown as { display_name: string; color: string | null } | null
                return (
                  <div key={l.id} className="flex items-center gap-3 rounded border border-stone-100 px-3 py-2">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subj?.color || '#999' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700 truncate">{l.title}</p>
                      <p className="text-xs text-stone-400">{subj?.display_name} &middot; {l.duration_minutes} min</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone-400">
              {selectedDate.getDay() === 0 || selectedDate.getDay() === 6
                ? 'Weekend — no lessons scheduled'
                : 'No lessons found for this day'}
            </p>
          )}
        </div>
      )}

      {/* Subject legend */}
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Subject Colors</p>
        <div className="flex flex-wrap gap-3">
          {subjects.map(s => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color || '#999' }} />
              <span className="text-xs text-stone-600">{s.display_name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
