import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { noteDB } from '@/lib/db'
import type { Note } from '@/types'

// ─── Query keys ──────────────────────────────────────────────────────────────

function notesByCourseKey(courseId: string) {
  return ['notes', 'course', courseId] as const
}

function noteKey(id: string) {
  return ['notes', 'detail', id] as const
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useNotesByCourse(courseId: string) {
  return useQuery({
    queryKey: notesByCourseKey(courseId),
    queryFn: async () => {
      const notes = await noteDB.getByCourse(courseId)
      return notes.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
    },
    enabled: !!courseId,
  })
}

export function useNote(id: string) {
  return useQuery({
    queryKey: noteKey(id),
    queryFn: () => noteDB.get(id),
    enabled: !!id,
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

interface CreateNoteInput {
  courseId: string
  title: string
  bodyMd: string
  tags: string[]
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateNoteInput): Promise<Note> => {
      const now = new Date().toISOString()
      // Use crypto.randomUUID() — available in all modern browsers and Vite env
      const note: Note = {
        id: crypto.randomUUID(),
        courseId: input.courseId,
        title: input.title.trim(),
        bodyMd: input.bodyMd,
        tags: input.tags,
        sourceIds: [],
        authorType: 'user',
        sourceStatus: 'user_provided',
        createdAt: now,
        updatedAt: now,
      }
      await noteDB.put(note)
      return note
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: notesByCourseKey(variables.courseId) })
    },
  })
}

interface UpdateNoteInput {
  id: string
  courseId: string
  title: string
  bodyMd: string
  tags: string[]
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateNoteInput): Promise<Note> => {
      const existing = await noteDB.get(input.id)
      if (!existing) throw new Error('筆記不存在')

      const updated: Note = {
        ...existing,
        title: input.title.trim(),
        bodyMd: input.bodyMd,
        tags: input.tags,
        updatedAt: new Date().toISOString(),
      }
      await noteDB.put(updated)
      return updated
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: notesByCourseKey(variables.courseId) })
      queryClient.invalidateQueries({ queryKey: noteKey(variables.id) })
    },
  })
}

interface DeleteNoteInput {
  id: string
  courseId: string
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteNoteInput): Promise<void> => {
      await noteDB.delete(input.id)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: notesByCourseKey(variables.courseId) })
      queryClient.removeQueries({ queryKey: noteKey(variables.id) })
    },
  })
}
