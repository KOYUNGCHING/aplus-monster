import {
  attemptDB,
  courseDB,
  deadlineDB,
  mistakeDB,
  noteDB,
  questionDB,
  quizDB,
  semesterDB,
  studySessionDB,
} from '@/lib/db'

export interface ExportData {
  exportedAt: string
  version: string
  semesters: unknown[]
  courses: unknown[]
  deadlines: unknown[]
  notes: unknown[]
  quizzes: unknown[]
  quiz_questions: unknown[]
  quiz_attempts: unknown[]
  mistakes: unknown[]
  study_sessions: unknown[]
}

export async function exportAllData(): Promise<ExportData> {
  const [
    semesters,
    courses,
    deadlines,
    notes,
    quizzes,
    questions,
    attempts,
    mistakes,
    sessions,
  ] = await Promise.all([
    semesterDB.getAll(),
    courseDB.getAll(),
    deadlineDB.getAll(),
    noteDB.getAll(),
    quizDB.getAll(),
    questionDB.getAll(),
    attemptDB.getAll(),
    mistakeDB.getAll(),
    studySessionDB.getAll(),
  ])

  return {
    exportedAt: new Date().toISOString(),
    version: '0.5.0',
    semesters,
    courses,
    deadlines,
    notes,
    quizzes,
    quiz_questions: questions,
    quiz_attempts: attempts,
    mistakes,
    study_sessions: sessions,
  }
}

export function downloadJSON(data: ExportData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `aplus-monster-export-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}
