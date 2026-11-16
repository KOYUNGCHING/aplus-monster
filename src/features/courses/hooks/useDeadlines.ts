import { deadlineDB } from '@/lib/db'
import { uuid } from '@/lib/id'
import type { Deadline, DeadlineType } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface DeadlineFormValues {
  title: string
  dueAt: string
  type: DeadlineType
  confirmed: boolean
}

const key = (courseId: string) => ['deadlines', courseId] as const

export function useDeadlines(courseId: string) {
  return useQuery({
    queryKey: key(courseId),
    queryFn: () => deadlineDB.getByCourse(courseId),
    enabled: !!courseId,
  })
}

export function useAllDeadlines() {
  return useQuery({
    queryKey: ['deadlines'],
    queryFn: () => deadlineDB.getAll(),
  })
}

export function useCreateDeadline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ courseId, values }: { courseId: string; values: DeadlineFormValues }) => {
      const now = new Date().toISOString()
      const deadline: Deadline = {
        id: uuid(),
        courseId,
        title: values.title,
        dueAt: values.dueAt,
        type: values.type,
        confirmed: values.confirmed,
        sourceStatus: values.confirmed ? 'user_provided' : 'ai_suggested',
        createdAt: now,
        updatedAt: now,
      }
      await deadlineDB.put(deadline)
      return deadline
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: key(d.courseId) })
      qc.invalidateQueries({ queryKey: ['deadlines'] })
    },
  })
}

export function useDeleteDeadline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const all = await deadlineDB.getAll()
      const deadline = all.find((d) => d.id === id)
      await deadlineDB.delete(id)
      return deadline?.courseId
    },
    onSuccess: (courseId) => {
      if (courseId) qc.invalidateQueries({ queryKey: key(courseId) })
      qc.invalidateQueries({ queryKey: ['deadlines'] })
    },
  })
}
