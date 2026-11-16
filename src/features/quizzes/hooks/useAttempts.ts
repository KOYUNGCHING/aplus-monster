import { attemptDB } from '@/lib/db'
import { uuid } from '@/lib/id'
import type { Mistake, QuizAttempt, QuizQuestion } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ─── Query keys ──────────────────────────────────────────────────────────────

const attemptsByQuizKey = (quizId: string) => ['quiz_attempts', 'quiz', quizId] as const
const attemptKey = (id: string) => ['quiz_attempts', id] as const

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useAttemptsByQuiz(quizId: string) {
  return useQuery({
    queryKey: attemptsByQuizKey(quizId),
    queryFn: () => attemptDB.getByQuiz(quizId),
    enabled: !!quizId,
    select: (data) =>
      [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
  })
}

export function useAttempt(id: string) {
  return useQuery({
    queryKey: attemptKey(id),
    queryFn: () => attemptDB.get(id),
    enabled: !!id,
  })
}

// ─── Submit attempt ──────────────────────────────────────────────────────────

interface SubmitAttemptInput {
  quizId: string
  startedAt: string
  answersJson: Record<string, string>
  questions: QuizQuestion[]
}

interface SubmitAttemptResult {
  attempt: QuizAttempt
  score: number | null
  wrongIds: string[]
}

export function useSubmitAttempt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      quizId,
      startedAt,
      answersJson,
      questions,
    }: SubmitAttemptInput): Promise<SubmitAttemptResult> => {
      const now = new Date().toISOString()

      // Grade each question
      let correct = 0
      let gradeable = 0
      const wrongIds: string[] = []

      for (const q of questions) {
        const userAnswer = answersJson[q.id] ?? ''

        if (q.type === 'short_answer') {
          // Not included in denominator; will be manually graded
          continue
        }

        gradeable++
        const correctAnswer = Array.isArray(q.answer) ? q.answer[0] : q.answer
        const isCorrect =
          userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()

        if (isCorrect) {
          correct++
        } else {
          wrongIds.push(q.id)
        }
      }

      const score = gradeable > 0 ? Math.round((correct / gradeable) * 100) : null

      const attempt: QuizAttempt = {
        id: uuid(),
        quizId,
        startedAt,
        submittedAt: now,
        score: score ?? undefined,
        answersJson,
        createdAt: now,
      }

      const mistakes: Mistake[] = wrongIds.map((questionId) => {
        const question = questions.find((item) => item.id === questionId)
        return {
          id: uuid(),
          questionId,
          attemptId: attempt.id,
          topicId: question?.topicIds[0],
          createdAt: now,
        }
      })
      await attemptDB.addWithMistakes(attempt, mistakes)

      return { attempt, score, wrongIds }
    },
    onSuccess: (_result, { quizId }) => {
      qc.invalidateQueries({ queryKey: attemptsByQuizKey(quizId) })
      qc.invalidateQueries({ queryKey: ['mistakes'] })
    },
  })
}
