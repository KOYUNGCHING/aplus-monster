import { mistakeDB } from '@/lib/db'
import type { Mistake } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─── Query keys ──────────────────────────────────────────────────────────────

const ALL_MISTAKES_KEY = ['mistakes'] as const

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useAllMistakes() {
  return useQuery({
    queryKey: ALL_MISTAKES_KEY,
    queryFn: () => mistakeDB.getAll(),
    select: (data: Mistake[]) =>
      [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useSetMistakeResolved() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      await mistakeDB.patch(id, {
        resolvedAt: resolved ? new Date().toISOString() : undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ALL_MISTAKES_KEY })
    },
  })
}
