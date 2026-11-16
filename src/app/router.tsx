import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { ROUTES } from '@/lib/routes'

// Pages
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { SemestersPage } from '@/features/semesters/SemestersPage'
import { CoursePage } from '@/features/courses/CoursePage'
import { CourseNotesPage } from '@/features/notes/CourseNotesPage'
import { CourseQuizzesPage } from '@/features/quizzes/CourseQuizzesPage'
import { QuizAttemptPage } from '@/features/quizzes/QuizAttemptPage'
import { PlannerPage } from '@/features/planner/PlannerPage'
import { MistakesPage } from '@/features/mistakes/MistakesPage'
import { TutorPage } from '@/features/tutor/TutorPage'
import { ProgressPage } from '@/features/progress/ProgressPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { NotFoundPage } from './NotFoundPage'

const router = createBrowserRouter([
  {
    path: ROUTES.landing,
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'semesters', element: <SemestersPage /> },
      { path: 'courses/:courseId', element: <CoursePage /> },
      { path: 'courses/:courseId/notes', element: <CourseNotesPage /> },
      { path: 'courses/:courseId/quizzes', element: <CourseQuizzesPage /> },
      { path: 'quizzes/:quizId', element: <QuizAttemptPage /> },
      { path: 'planner', element: <PlannerPage /> },
      { path: 'mistakes', element: <MistakesPage /> },
      { path: 'tutor', element: <TutorPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
