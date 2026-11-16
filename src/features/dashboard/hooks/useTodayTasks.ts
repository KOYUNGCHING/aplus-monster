import { studySessionDB } from '@/lib/db'
import { useQuery } from '@tanstack/react-query'

export function useTodayTasks(date: string) {
  return useQuery({
    queryKey: ['sessions', 'today', date],
    queryFn: () => studySessionDB.getByDate(date),
    select: (sessions) =>
      [...sessions].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
  })
}
