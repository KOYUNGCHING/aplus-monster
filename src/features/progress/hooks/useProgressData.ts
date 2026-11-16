import { attemptDB, courseDB, mistakeDB, questionDB, quizDB, studySessionDB } from '@/lib/db'
import { useQuery } from '@tanstack/react-query'

export function useProgressData() {
  return useQuery({
    queryKey: ['progress-data'],
    queryFn: async () => {
      const [courses, sessions, quizzes, questions, attempts, mistakes] = await Promise.all([
        courseDB.getAll(),
        studySessionDB.getAll(),
        quizDB.getAll(),
        questionDB.getAll(),
        attemptDB.getAll(),
        mistakeDB.getAll(),
      ])

      return { courses, sessions, quizzes, questions, attempts, mistakes }
    },
  })
}
