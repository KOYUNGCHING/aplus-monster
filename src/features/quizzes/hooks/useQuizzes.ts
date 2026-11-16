import { attemptDB, questionDB, quizDB } from '@/lib/db'
import { uuid } from '@/lib/id'
import type { Quiz, QuizQuestion } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─── Query keys ──────────────────────────────────────────────────────────────

const quizzesByCourseKey = (courseId: string) => ['quizzes', 'course', courseId] as const
const quizKey = (id: string) => ['quizzes', id] as const
const questionsByQuizKey = (quizId: string) => ['quiz_questions', quizId] as const

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useQuizzesByCourse(courseId: string) {
  return useQuery({
    queryKey: quizzesByCourseKey(courseId),
    queryFn: () => quizDB.getByCourse(courseId),
    enabled: !!courseId,
    select: (data) =>
      [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  })
}

export function useQuiz(id: string) {
  return useQuery({
    queryKey: quizKey(id),
    queryFn: () => quizDB.get(id),
    enabled: !!id,
  })
}

export function useQuizQuestions(quizId: string) {
  return useQuery({
    queryKey: questionsByQuizKey(quizId),
    queryFn: () => questionDB.getByQuiz(quizId),
    enabled: !!quizId,
    select: (questions) =>
      [...questions].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)),
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

interface CreateQuizInput {
  courseId: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  questions: Omit<QuizQuestion, 'id' | 'quizId' | 'createdAt'>[]
}

export function useCreateQuiz() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ courseId, title, difficulty, questions }: CreateQuizInput) => {
      const now = new Date().toISOString()
      const quizId = uuid()
      const quiz: Quiz = {
        id: quizId,
        courseId,
        topicIds: [],
        title,
        difficulty,
        origin: 'user',
        createdAt: now,
        updatedAt: now,
      }
      const persistedQuestions = questions.map((question, orderIndex) => ({
        ...question,
        id: uuid(),
        quizId,
        orderIndex,
        createdAt: now,
      }))
      await quizDB.createWithQuestions(quiz, persistedQuestions)
      return quiz
    },
    onSuccess: (quiz) => {
      qc.invalidateQueries({ queryKey: quizzesByCourseKey(quiz.courseId) })
    },
  })
}

export function useDeleteQuiz() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ quizId, courseId }: { quizId: string; courseId: string }) => {
      const attempts = await attemptDB.getByQuiz(quizId)
      if (attempts.length > 0) {
        throw new Error('此測驗已有作答紀錄，為保留歷史資料無法刪除。')
      }
      await quizDB.deleteWithQuestions(quizId)
      return courseId
    },
    onSuccess: (_result, { courseId, quizId }) => {
      qc.invalidateQueries({ queryKey: quizzesByCourseKey(courseId) })
      qc.invalidateQueries({ queryKey: quizKey(quizId) })
      qc.invalidateQueries({ queryKey: questionsByQuizKey(quizId) })
    },
  })
}
