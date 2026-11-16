/**
 * IndexedDB schema and client — Local Demo Mode only.
 * Data is device/browser-bound. Not synced to cloud.
 * Phase 3 will replace this with Supabase.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Course, Deadline, Semester, StudySession, Topic } from '@/types'

const DB_NAME = 'aplus-monster'
const DB_VERSION = 1

interface AplusDB extends DBSchema {
  semesters: {
    key: string
    value: Semester
    indexes: { 'by-status': string }
  }
  courses: {
    key: string
    value: Course
    indexes: { 'by-semester': string; 'by-status': string }
  }
  topics: {
    key: string
    value: Topic
    indexes: { 'by-course': string }
  }
  deadlines: {
    key: string
    value: Deadline
    indexes: { 'by-course': string; 'by-due': string }
  }
  study_sessions: {
    key: string
    value: StudySession
    indexes: { 'by-course': string; 'by-date': string }
  }
}

let _db: IDBPDatabase<AplusDB> | null = null

async function getDB(): Promise<IDBPDatabase<AplusDB>> {
  if (_db) return _db
  _db = await openDB<AplusDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Semesters
      if (!db.objectStoreNames.contains('semesters')) {
        const s = db.createObjectStore('semesters', { keyPath: 'id' })
        s.createIndex('by-status', 'status')
      }
      // Courses
      if (!db.objectStoreNames.contains('courses')) {
        const c = db.createObjectStore('courses', { keyPath: 'id' })
        c.createIndex('by-semester', 'semesterId')
        c.createIndex('by-status', 'archivedAt')
      }
      // Topics
      if (!db.objectStoreNames.contains('topics')) {
        const t = db.createObjectStore('topics', { keyPath: 'id' })
        t.createIndex('by-course', 'courseId')
      }
      // Deadlines
      if (!db.objectStoreNames.contains('deadlines')) {
        const d = db.createObjectStore('deadlines', { keyPath: 'id' })
        d.createIndex('by-course', 'courseId')
        d.createIndex('by-due', 'dueAt')
      }
      // Study sessions
      if (!db.objectStoreNames.contains('study_sessions')) {
        const ss = db.createObjectStore('study_sessions', { keyPath: 'id' })
        ss.createIndex('by-course', 'courseId')
        ss.createIndex('by-date', 'startsAt')
      }
    },
  })
  return _db
}

// ─── Semesters ───────────────────────────────────────────────────────────────

export const semesterDB = {
  async getAll(): Promise<Semester[]> {
    const db = await getDB()
    return db.getAll('semesters')
  },
  async get(id: string): Promise<Semester | undefined> {
    const db = await getDB()
    return db.get('semesters', id)
  },
  async put(semester: Semester): Promise<void> {
    const db = await getDB()
    await db.put('semesters', semester)
  },
  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('semesters', id)
  },
}

// ─── Courses ─────────────────────────────────────────────────────────────────

export const courseDB = {
  async getAll(): Promise<Course[]> {
    const db = await getDB()
    return db.getAll('courses')
  },
  async getBySemester(semesterId: string): Promise<Course[]> {
    const db = await getDB()
    return db.getAllFromIndex('courses', 'by-semester', semesterId)
  },
  async get(id: string): Promise<Course | undefined> {
    const db = await getDB()
    return db.get('courses', id)
  },
  async put(course: Course): Promise<void> {
    const db = await getDB()
    await db.put('courses', course)
  },
  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('courses', id)
  },
}

// ─── Topics ──────────────────────────────────────────────────────────────────

export const topicDB = {
  async getByCourse(courseId: string): Promise<Topic[]> {
    const db = await getDB()
    const topics = await db.getAllFromIndex('topics', 'by-course', courseId)
    return topics.sort((a, b) => a.orderIndex - b.orderIndex)
  },
  async put(topic: Topic): Promise<void> {
    const db = await getDB()
    await db.put('topics', topic)
  },
  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('topics', id)
  },
}

// ─── Deadlines ───────────────────────────────────────────────────────────────

export const deadlineDB = {
  async getAll(): Promise<Deadline[]> {
    const db = await getDB()
    return db.getAll('deadlines')
  },
  async getByCourse(courseId: string): Promise<Deadline[]> {
    const db = await getDB()
    return db.getAllFromIndex('deadlines', 'by-course', courseId)
  },
  async put(deadline: Deadline): Promise<void> {
    const db = await getDB()
    await db.put('deadlines', deadline)
  },
  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('deadlines', id)
  },
}

// ─── Study Sessions ──────────────────────────────────────────────────────────

export const studySessionDB = {
  async getByDate(dateISO: string): Promise<StudySession[]> {
    const db = await getDB()
    const all = await db.getAll('study_sessions')
    return all.filter((s) => s.startsAt.startsWith(dateISO))
  },
  async put(session: StudySession): Promise<void> {
    const db = await getDB()
    await db.put('study_sessions', session)
  },
  async patch(id: string, update: Partial<StudySession>): Promise<void> {
    const db = await getDB()
    const existing = await db.get('study_sessions', id)
    if (!existing) return
    await db.put('study_sessions', { ...existing, ...update, updatedAt: new Date().toISOString() })
  },
}
