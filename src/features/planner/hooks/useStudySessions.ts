/**
 * Study session hooks for the weekly planner.
 * Uses the shared IndexedDB adapter so schema upgrades have a single owner.
 */

import { studySessionDB } from '@/lib/db'
import { toLocalDateISO } from '@/lib/date'
import { uuid } from '@/lib/id'
import type { StudySession } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Returns all sessions that fall within the Mon–Sun week starting at weekStart.
 * weekStart: YYYY-MM-DD (must be a Monday).
 */
export function useWeekSessions(weekStart: string) {
  return useQuery({
    queryKey: ['sessions', 'week', weekStart],
    queryFn: async (): Promise<StudySession[]> => {
      const all = await studySessionDB.getAll()
      // Build the 7 date strings for this week
      const startDate = new Date(weekStart + 'T00:00:00')
      const endDate = new Date(weekStart + 'T00:00:00')
      endDate.setDate(endDate.getDate() + 7) // exclusive upper bound

      return all.filter((s) => {
        const localDate = toLocalDateISO(s.startsAt)
        return localDate >= toLocalDateISO(startDate) && localDate < toLocalDateISO(endDate)
      })
    },
  })
}

// Input type for creating a session
export interface CreateSessionInput {
  courseId: string
  title: string
  startsAt: string   // full ISO timestamp (date + time)
  durationMinutes: number
  priority: 'low' | 'medium' | 'high'
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateSessionInput): Promise<StudySession> => {
      const now = new Date().toISOString()
      const session: StudySession = {
        id: uuid(),
        courseId: input.courseId,
        title: input.title,
        startsAt: input.startsAt,
        durationMinutes: input.durationMinutes,
        priority: input.priority,
        status: 'planned',
        rationale: '',
        sourceStatus: 'user_provided',
        origin: 'user',
        createdAt: now,
        updatedAt: now,
      }
      await studySessionDB.put(session)
      return session
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export interface UpdateSessionStatusInput {
  id: string
  status: StudySession['status']
}

export function useUpdateSessionStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: UpdateSessionStatusInput): Promise<void> => {
      await studySessionDB.patch(id, { status })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await studySessionDB.delete(id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
