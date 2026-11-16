// ─── Shared types ────────────────────────────────────────────────────────────

export type SourceStatus = 'verified' | 'user_provided' | 'ai_suggested'
export type PlanStatus = 'draft' | 'approved' | 'superseded'
export type AuthorType = 'user' | 'ai'

// ─── Semester ────────────────────────────────────────────────────────────────

export type SemesterStatus = 'active' | 'archived'

export interface Semester {
  id: string
  userId: string
  name: string
  startDate: string   // YYYY-MM-DD
  endDate: string     // YYYY-MM-DD
  status: SemesterStatus
  timezone: string
  createdAt: string
  updatedAt: string
}

// ─── Course ───────────────────────────────────────────────────────────────────

export type CourseColor =
  | 'lavender' | 'mint' | 'peach' | 'yellow' | 'sky' | 'rose'

export type CourseDifficulty = 'easy' | 'medium' | 'hard'

export interface Course {
  id: string
  userId: string
  semesterId: string
  title: string
  code: string
  color: CourseColor
  targetGrade: string
  difficulty: CourseDifficulty
  weeklyHours: number
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Topic ────────────────────────────────────────────────────────────────────

export interface Topic {
  id: string
  courseId: string
  parentTopicId?: string
  title: string
  orderIndex: number
  sourceStatus: SourceStatus
  createdAt: string
  updatedAt: string
}

// ─── Deadline ─────────────────────────────────────────────────────────────────

export type DeadlineType = 'exam' | 'assignment' | 'project' | 'quiz' | 'other'

export interface Deadline {
  id: string
  courseId: string
  title: string
  dueAt: string         // ISO timestamp
  type: DeadlineType
  confirmed: boolean
  sourceStatus: SourceStatus
  createdAt: string
  updatedAt: string
}

// ─── Study Plan ───────────────────────────────────────────────────────────────

export interface StudySessionDraft {
  clientId: string
  courseId: string
  topicId?: string
  title: string
  date: string              // YYYY-MM-DD in user's timezone
  durationMinutes: number   // > 0
  priority: 'low' | 'medium' | 'high'
  rationale: string
  sourceStatus: SourceStatus
}

export interface StudyPlanDraft {
  semesterId: string
  assumptions: string[]
  warnings: string[]
  sessions: StudySessionDraft[]
}

export interface StudyPlan {
  id: string
  userId: string
  semesterId: string
  version: number
  status: PlanStatus
  generatedBy: 'user' | 'ai'
  rationaleJson: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface StudySession {
  id: string
  planId?: string
  courseId: string
  topicId?: string
  title: string
  startsAt: string
  durationMinutes: number
  status: 'planned' | 'completed' | 'skipped'
  priority: 'low' | 'medium' | 'high'
  rationale: string
  sourceStatus: SourceStatus
  origin: 'user' | 'ai'
  createdAt: string
  updatedAt: string
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export interface Note {
  id: string
  courseId: string
  topicId?: string
  title: string
  bodyMd: string
  sourceIds: string[]
  tags: string[]
  authorType: AuthorType
  sourceStatus: SourceStatus
  createdAt: string
  updatedAt: string
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export type QuestionType = 'mcq' | 'true_false' | 'short_answer'

export interface QuizQuestion {
  id: string
  quizId: string
  type: QuestionType
  prompt: string
  options?: string[]        // MCQ only
  answer: string | string[]
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  topicIds: string[]
  sourceStatus: SourceStatus
  createdAt: string
}

export interface Quiz {
  id: string
  courseId: string
  topicIds: string[]
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  origin: 'user' | 'ai'
  createdAt: string
  updatedAt: string
}

export interface QuizAttempt {
  id: string
  quizId: string
  startedAt: string
  submittedAt?: string
  score?: number
  answersJson: Record<string, string>
  createdAt: string
}

// ─── Mistake ──────────────────────────────────────────────────────────────────

export interface Mistake {
  id: string
  questionId: string
  attemptId: string
  topicId?: string
  errorType?: string
  reviewDueAt?: string
  resolvedAt?: string
  createdAt: string
}

// ─── Mascot ───────────────────────────────────────────────────────────────────

export type MochiMood = 'happy' | 'studying' | 'thinking' | 'celebrating' | 'resting' | 'default'

export interface MascotProgress {
  xp: number
  level: number
  unlockedItems: string[]
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  icon: string
}
