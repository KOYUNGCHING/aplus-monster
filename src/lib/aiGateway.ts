/**
 * Frontend AI gateway client.
 *
 * All calls go through the Supabase Edge Function /ai-gateway.
 * NVIDIA_API_KEY never touches the browser.
 *
 * In local demo mode (no Supabase), all calls return a "not configured" error
 * with a clear message so the UI can show a manual fallback.
 */

import { supabase, isSupabaseConfigured } from './supabase'
import type { StudyPlanDraft } from '@/types'

export class AINotConfiguredError extends Error {
  constructor() {
    super('AI 功能需要設定 Supabase 和 NVIDIA API，目前為本機示範模式。')
    this.name = 'AINotConfiguredError'
  }
}

type AIAction =
  | 'generate_plan'
  | 'generate_quiz'
  | 'summarize_notes'
  | 'tutor_reply'
  | 'suggest_replan'

async function callGateway<T>(action: AIAction, payload: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) throw new AINotConfiguredError()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('請先登入才能使用 AI 功能')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const url = `${supabaseUrl}/functions/v1/ai-gateway`

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, payload }),
    signal: AbortSignal.timeout(45_000),
  })

  const json = await resp.json() as { ok?: boolean; data?: T; error?: string }

  if (!resp.ok || !json.ok) {
    throw new Error(json.error ?? `AI 服務回應錯誤 (${resp.status})`)
  }

  return json.data as T
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface GeneratePlanInput {
  semesterId: string
  courses: { id: string; title: string; difficulty: string; weeklyHours: number }[]
  deadlines: { courseId: string; title: string; dueAt: string; type: string }[]
  availableHoursPerWeek: number
  semesterStart: string
  semesterEnd: string
}

export async function generatePlan(input: GeneratePlanInput): Promise<{ draft: StudyPlanDraft }> {
  return callGateway('generate_plan', input as unknown as Record<string, unknown>)
}

export interface GenerateQuizInput {
  courseId: string
  courseTitle: string
  topics: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
  noteContent?: string
}

export interface QuizDraft {
  questions: {
    type: 'mcq' | 'true_false' | 'short_answer'
    prompt: string
    options?: string[]
    answer: string
    explanation: string
    difficulty: 'easy' | 'medium' | 'hard'
    sourceStatus: 'ai_suggested'
  }[]
}

export async function generateQuiz(input: GenerateQuizInput): Promise<QuizDraft> {
  return callGateway('generate_quiz', input as unknown as Record<string, unknown>)
}

export interface SummarizeNotesInput {
  courseTitle: string
  noteContent: string
}

export interface NoteDraft {
  draft: { title: string; bodyMd: string; keyPoints: string[]; sourceStatus: 'ai_suggested' }
  authorType: 'ai'
  sourceStatus: 'ai_suggested'
}

export async function summarizeNotes(input: SummarizeNotesInput): Promise<NoteDraft> {
  return callGateway('summarize_notes', input as unknown as Record<string, unknown>)
}

export interface TutorInput {
  courseTitle: string
  question: string
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
  approvedSources?: string[]
}

export interface TutorResponse {
  reply: string
  sourceStatus: 'ai_suggested'
  disclaimer: string
}

export async function tutorReply(input: TutorInput): Promise<TutorResponse> {
  return callGateway('tutor_reply', input as unknown as Record<string, unknown>)
}

export interface ReplanInput {
  weakTopics: { courseId: string; topicName: string; weaknessScore: number }[]
  currentPlan: { courseId: string; date: string; title: string }[]
  remainingDays: number
}

export async function suggestReplan(input: ReplanInput): Promise<unknown> {
  return callGateway('suggest_replan', input as unknown as Record<string, unknown>)
}
