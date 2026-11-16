import { courseDB } from '@/lib/db'
import { uuid } from '@/lib/id'
import type { Course } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CourseFormValues } from '../schemas'

const QUERY_KEY = ['courses'] as const
const semesterKey = (semesterId: string) => ['courses', 'semester', semesterId] as const

export function useCoursesBySemester(semesterId: string) {
  return useQuery({
    queryKey: semesterKey(semesterId),
    queryFn: () => courseDB.getBySemester(semesterId),
    enabled: !!semesterId,
    select: (data) =>
      [...data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
  })
}

export function useAllCourses() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => courseDB.getAll(),
    select: (data) =>
      [...data]
        .filter((c) => !c.archivedAt)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  })
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => courseDB.get(id),
    enabled: !!id,
  })
}

export function useCreateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      semesterId,
      values,
    }: {
      semesterId: string
      values: CourseFormValues
    }) => {
      const now = new Date().toISOString()
      const course: Course = {
        id: uuid(),
        userId: 'local-demo',
        semesterId,
        title: values.title,
        code: values.code ?? '',
        color: values.color,
        targetGrade: values.targetGrade ?? '',
        difficulty: values.difficulty,
        weeklyHours: values.weeklyHours,
        createdAt: now,
        updatedAt: now,
      }
      await courseDB.put(course)
      return course
    },
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: semesterKey(course.semesterId) })
    },
  })
}

export function useUpdateCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CourseFormValues }) => {
      const existing = await courseDB.get(id)
      if (!existing) throw new Error('課程不存在')
      const updated: Course = {
        ...existing,
        title: values.title,
        code: values.code ?? '',
        color: values.color,
        targetGrade: values.targetGrade ?? '',
        difficulty: values.difficulty,
        weeklyHours: values.weeklyHours,
        updatedAt: new Date().toISOString(),
      }
      await courseDB.put(updated)
      return updated
    },
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: semesterKey(course.semesterId) })
      qc.invalidateQueries({ queryKey: ['courses', course.id] })
    },
  })
}

export function useArchiveCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const existing = await courseDB.get(id)
      if (!existing) throw new Error('課程不存在')
      const updated: Course = {
        ...existing,
        archivedAt: existing.archivedAt ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await courseDB.put(updated)
      return updated
    },
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: semesterKey(course.semesterId) })
    },
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, semesterId }: { id: string; semesterId: string }) => {
      await courseDB.delete(id)
      return semesterId
    },
    onSuccess: (semesterId) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: semesterKey(semesterId) })
    },
  })
}
