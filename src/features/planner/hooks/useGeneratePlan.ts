import { generatePlan, AINotConfiguredError, type GeneratePlanInput } from '@/lib/aiGateway'
import { studySessionDB } from '@/lib/db'
import { uuid } from '@/lib/id'
import type { StudyPlanDraft, StudySession } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface ApproveSessionsInput {
  draft: StudyPlanDraft
  courseIds: string[]   // validate ownership
}

/** Call AI gateway to generate a plan draft (never persists on its own). */
export function useGeneratePlan() {
  return useMutation({
    mutationFn: async (input: GeneratePlanInput) => {
      const result = await generatePlan(input)
      return result.draft
    },
  })
}

/** Persist an approved StudyPlanDraft to IndexedDB. */
export function useApprovePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (draft: StudyPlanDraft) => {
      const now = new Date().toISOString()
      const sessions: StudySession[] = draft.sessions.map((s) => ({
        id: uuid(),
        courseId: s.courseId,
        title: s.title,
        startsAt: `${s.date}T09:00:00`,
        durationMinutes: s.durationMinutes,
        status: 'planned',
        priority: s.priority,
        rationale: s.rationale,
        sourceStatus: 'ai_suggested',
        origin: 'ai',
        createdAt: now,
        updatedAt: now,
      }))
      await Promise.all(sessions.map((s) => studySessionDB.put(s)))
      return sessions.length
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export { AINotConfiguredError }
