// Centralized route paths — never hard-code these strings elsewhere

export const ROUTES = {
  landing: '/',
  app: '/app',
  onboarding: '/app/onboarding',
  semesters: '/app/semesters',
  course: (courseId = ':courseId') => `/app/courses/${courseId}`,
  courseNotes: (courseId = ':courseId') => `/app/courses/${courseId}/notes`,
  courseQuizzes: (courseId = ':courseId') => `/app/courses/${courseId}/quizzes`,
  quiz: (quizId = ':quizId') => `/app/quizzes/${quizId}`,
  planner: '/app/planner',
  mistakes: '/app/mistakes',
  tutor: '/app/tutor',
  progress: '/app/progress',
  settings: '/app/settings',
} as const
