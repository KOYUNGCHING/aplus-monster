import { todayISO } from '@/lib/date'
import { openDB } from 'idb'

const DB_NAME = 'aplus-monster'

const EXPORT_STORES = {
  semesters: 'semesters',
  courses: 'courses',
  topics: 'topics',
  deadlines: 'deadlines',
  studySessions: 'study_sessions',
  notes: 'notes',
  quizzes: 'quizzes',
  quizQuestions: 'quiz_questions',
  quizAttempts: 'quiz_attempts',
  mistakes: 'mistakes',
} as const

interface LocalDemoExport {
  format: 'aplus-monster-local-demo'
  schemaVersion: 1
  exportedAt: string
  data: Record<keyof typeof EXPORT_STORES, unknown[]>
}

async function exportLocalDemoData(): Promise<LocalDemoExport> {
  const db = await openDB(DB_NAME)
  try {
    const entries = await Promise.all(
      Object.entries(EXPORT_STORES).map(async ([exportKey, storeName]) => {
        const records = db.objectStoreNames.contains(storeName)
          ? await db.getAll(storeName)
          : []
        return [exportKey, records] as const
      }),
    )

    return {
      format: 'aplus-monster-local-demo',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: Object.fromEntries(entries) as LocalDemoExport['data'],
    }
  } finally {
    db.close()
  }
}

export async function downloadLocalDemoData() {
  const snapshot = await exportLocalDemoData()
  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = `aplus-monster-backup-${todayISO()}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
