/**
 * IndexedDB schema and client — Local Demo Mode only.
 * Data is device/browser-bound. Not synced to cloud.
 * Phase 3 will replace this with Supabase.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { toLocalDateISO } from '@/lib/date'
import type {
  Course,
  Deadline,
  Mistake,
  Note,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  Semester,
  StudySession,
  Topic,
} from '@/types'

const DB_NAME = 'aplus-monster'
const DB_VERSION = 3

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
  notes: {
    key: string
    value: Note
    indexes: { 'by-course': string }
  }
  quizzes: {
    key: string
    value: Quiz
    indexes: { 'by-course': string }
  }
  quiz_questions: {
    key: string
    value: QuizQuestion
    indexes: { 'by-quiz': string }
  }
  quiz_attempts: {
    key: string
    value: QuizAttempt
    indexes: { 'by-quiz': string }
  }
  mistakes: {
    key: string
    value: Mistake
    indexes: { 'by-question': string }
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
      // Notes (added in DB_VERSION 2)
      if (!db.objectStoreNames.contains('notes')) {
        const n = db.createObjectStore('notes', { keyPath: 'id' })
        n.createIndex('by-course', 'courseId')
      }
      // Quizzes (added in DB_VERSION 3)
      if (!db.objectStoreNames.contains('quizzes')) {
        const q = db.createObjectStore('quizzes', { keyPath: 'id' })
        q.createIndex('by-course', 'courseId')
      }
      // Quiz questions
      if (!db.objectStoreNames.contains('quiz_questions')) {
        const qq = db.createObjectStore('quiz_questions', { keyPath: 'id' })
        qq.createIndex('by-quiz', 'quizId')
      }
      // Quiz attempts
      if (!db.objectStoreNames.contains('quiz_attempts')) {
        const qa = db.createObjectStore('quiz_attempts', { keyPath: 'id' })
        qa.createIndex('by-quiz', 'quizId')
      }
      // Mistakes
      if (!db.objectStoreNames.contains('mistakes')) {
        const m = db.createObjectStore('mistakes', { keyPath: 'id' })
        m.createIndex('by-question', 'questionId')
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
  async getAll(): Promise<StudySession[]> {
    const db = await getDB()
    return db.getAll('study_sessions')
  },
  async getByDate(dateISO: string): Promise<StudySession[]> {
    const db = await getDB()
    const all = await db.getAll('study_sessions')
    return all.filter((session) => toLocalDateISO(session.startsAt) === dateISO)
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
  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('study_sessions', id)
  },
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export const noteDB = {
  async getAll(): Promise<Note[]> {
    const db = await getDB()
    return db.getAll('notes')
  },
  async getByCourse(courseId: string): Promise<Note[]> {
    const db = await getDB()
    return db.getAllFromIndex('notes', 'by-course', courseId)
  },
  async get(id: string): Promise<Note | undefined> {
    const db = await getDB()
    return db.get('notes', id)
  },
  async put(note: Note): Promise<void> {
    const db = await getDB()
    await db.put('notes', note)
  },
  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('notes', id)
  },
}

// ─── Quizzes ─────────────────────────────────────────────────────────────────

export const quizDB = {
  async getAll(): Promise<Quiz[]> {
    const db = await getDB()
    return db.getAll('quizzes')
  },
  async getByCourse(courseId: string): Promise<Quiz[]> {
    const db = await getDB()
    return db.getAllFromIndex('quizzes', 'by-course', courseId)
  },
  async get(id: string): Promise<Quiz | undefined> {
    const db = await getDB()
    return db.get('quizzes', id)
  },
  async put(quiz: Quiz): Promise<void> {
    const db = await getDB()
    await db.put('quizzes', quiz)
  },
  async createWithQuestions(quiz: Quiz, questions: QuizQuestion[]): Promise<void> {
    const db = await getDB()
    const tx = db.transaction(['quizzes', 'quiz_questions'], 'readwrite')
    await tx.objectStore('quizzes').add(quiz)
    for (const question of questions) {
      await tx.objectStore('quiz_questions').add(question)
    }
    await tx.done
  },
  async deleteWithQuestions(quizId: string): Promise<void> {
    const db = await getDB()
    const tx = db.transaction(['quizzes', 'quiz_questions'], 'readwrite')
    const questionStore = tx.objectStore('quiz_questions')
    const questions = await questionStore.index('by-quiz').getAll(quizId)
    for (const question of questions) {
      await questionStore.delete(question.id)
    }
    await tx.objectStore('quizzes').delete(quizId)
    await tx.done
  },
  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('quizzes', id)
  },
}

// ─── Quiz Questions ──────────────────────────────────────────────────────────

export const questionDB = {
  async getAll(): Promise<QuizQuestion[]> {
    const db = await getDB()
    return db.getAll('quiz_questions')
  },
  async getByQuiz(quizId: string): Promise<QuizQuestion[]> {
    const db = await getDB()
    return db.getAllFromIndex('quiz_questions', 'by-quiz', quizId)
  },
  async put(question: QuizQuestion): Promise<void> {
    const db = await getDB()
    await db.put('quiz_questions', question)
  },
  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('quiz_questions', id)
  },
  async deleteByQuiz(quizId: string): Promise<void> {
    const db = await getDB()
    const questions = await db.getAllFromIndex('quiz_questions', 'by-quiz', quizId)
    await Promise.all(questions.map((q) => db.delete('quiz_questions', q.id)))
  },
}

// ─── Quiz Attempts ───────────────────────────────────────────────────────────

export const attemptDB = {
  async getAll(): Promise<QuizAttempt[]> {
    const db = await getDB()
    return db.getAll('quiz_attempts')
  },
  async getByQuiz(quizId: string): Promise<QuizAttempt[]> {
    const db = await getDB()
    return db.getAllFromIndex('quiz_attempts', 'by-quiz', quizId)
  },
  async get(id: string): Promise<QuizAttempt | undefined> {
    const db = await getDB()
    return db.get('quiz_attempts', id)
  },
  async put(attempt: QuizAttempt): Promise<void> {
    const db = await getDB()
    await db.put('quiz_attempts', attempt)
  },
  async addWithMistakes(attempt: QuizAttempt, mistakes: Mistake[]): Promise<void> {
    const db = await getDB()
    const tx = db.transaction(['quiz_attempts', 'mistakes'], 'readwrite')
    await tx.objectStore('quiz_attempts').add(attempt)
    for (const mistake of mistakes) {
      await tx.objectStore('mistakes').add(mistake)
    }
    await tx.done
  },
}

// ─── Mistakes ────────────────────────────────────────────────────────────────

export const mistakeDB = {
  async getAll(): Promise<Mistake[]> {
    const db = await getDB()
    return db.getAll('mistakes')
  },
  async getByCourse(_courseId: string, courseQuestionIds: string[]): Promise<Mistake[]> {
    const db = await getDB()
    const all = await db.getAll('mistakes')
    const idSet = new Set(courseQuestionIds)
    return all.filter((m) => idSet.has(m.questionId))
  },
  async put(mistake: Mistake): Promise<void> {
    const db = await getDB()
    await db.put('mistakes', mistake)
  },
  async patch(id: string, update: Partial<Mistake>): Promise<void> {
    const db = await getDB()
    const existing = await db.get('mistakes', id)
    if (!existing) return
    await db.put('mistakes', { ...existing, ...update })
  },
}
