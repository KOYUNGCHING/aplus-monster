import { semesterDB } from '@/lib/db'
import { uuid } from '@/lib/id'
import type { Semester } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SemesterFormValues } from '../schemas'

const QUERY_KEY = ['semesters'] as const

export function useSemesters() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => semesterDB.getAll(),
    select: (data) =>
      [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  })
}

export function useSemester(id: string) {
  return useQuery({
    queryKey: ['semesters', id],
    queryFn: () => semesterDB.get(id),
    enabled: !!id,
  })
}

export function useCreateSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: SemesterFormValues) => {
      const now = new Date().toISOString()
      const semester: Semester = {
        id: uuid(),
        userId: 'local-demo',
        name: values.name,
        startDate: values.startDate,
        endDate: values.endDate,
        timezone: values.timezone,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }
      await semesterDB.put(semester)
      return semester
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SemesterFormValues }) => {
      const existing = await semesterDB.get(id)
      if (!existing) throw new Error('學期不存在')
      const updated: Semester = {
        ...existing,
        name: values.name,
        startDate: values.startDate,
        endDate: values.endDate,
        timezone: values.timezone,
        updatedAt: new Date().toISOString(),
      }
      await semesterDB.put(updated)
      return updated
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['semesters', id] })
    },
  })
}

export function useArchiveSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const existing = await semesterDB.get(id)
      if (!existing) throw new Error('學期不存在')
      const updated: Semester = {
        ...existing,
        status: existing.status === 'active' ? 'archived' : 'active',
        updatedAt: new Date().toISOString(),
      }
      await semesterDB.put(updated)
      return updated
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await semesterDB.delete(id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
