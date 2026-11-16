# A+ Monster — Product Requirements & Technical Specification

## 1. Product vision

A+ Monster 是一個可愛、可靠、可持續使用的 AI Study Agent。學生輸入本學期課程、課綱、考試、目標與每週可用時間後，系統建立學期路線圖、每週／每日計畫、課程筆記、練習測驗、錯題本與複習建議；每次學習行為都能回饋到下一輪規劃。使用者的資料跨學期保存，可登入並跨裝置存取。

**North-star workflow:** Onboard → Import/Confirm Course Context → Plan → Study → Quiz → Diagnose → Propose Replan → User Approves → Persist → Repeat.

### 1.1 Product principles
1. **Useful before magical:** core CRUD and persistence must work without AI.
2. **Grounded AI:** clearly distinguish verified syllabus facts, user-provided facts, and AI suggestions; no fabricated dates, grades, or textbook content.
3. **User in control:** AI proposes edits; user confirms consequential changes to schedules, notes, or course records.
4. **Persistence by design:** all important entities have stable IDs, ownership, timestamps, and schema migrations.
5. **Friendly, not childish:** cute mascot UI with rigorous academic content.
6. **Privacy and security first:** authenticated access, RLS, server-side secrets, safe uploads, limited retention.
7. **Accessible:** keyboard support, readable contrast, reduced-motion preference, mobile-first.

### 1.2 Target users
- University students handling multiple courses and exams.
- Students who want a structured study plan but cannot maintain it manually.
- Students needing review based on actual quiz performance.

### 1.3 Non-goals for first release
- Grade guarantee, automatic access to LMS without authorization, plagiarism/cheating assistance, automatic exam submission, fully autonomous calendar modification, arbitrary internet browsing, public social feed.

## 2. Scope and delivery phases

| Phase | Required outcome | Definition of done |
|---|---|---|
| P0 — Deployable core | Responsive UI, auth or explicit local demo mode, semester/course CRUD, tasks, notes, quizzes, progress, persistence, AGENTS.md, live deployment | New user can create course, add task, reload and retain data; no dead controls |
| P1 — Real AI | NVIDIA-backed plan generation, quiz generation, note summarization, structured responses, errors/loading states | API invoked through secure server, results editable and saved, failure gracefully handled |
| P2 — Adaptive agent | Quiz analysis → weak topics → proposed plan changes → approval → history | Agent recommendation is explainable and reversible; no silent destructive writes |
| P3 — Advanced | PDF extraction, semantic search/RAG, calendar integrations, spaced repetition, rich analytics, cross-device exports | Independently tested per feature |

**Deadline strategy:** prioritize one complete vertical slice over many mocked screens. P0 is mandatory; P1 only counts as complete when a real model request succeeds in deployed environment. P2/P3 must be labeled upcoming until functional.

## 3. User stories and acceptance criteria

### US-01 Onboarding
- User enters display name (optional), semester start/end, time zone, weekly study hours, course list, goals, exam dates if known.
- AI asks for missing essential information; if unknown, creates clearly labeled draft assumptions, not fake facts.
- User can edit every field.

### US-02 Semester and course management
- Create/edit/archive semester; create/edit/archive courses; choose course color/icon; set grade goal, credit, difficulty, estimated weekly hours.
- Each course has topic outline, deadlines, attachments, study plans, notes, quizzes, mistake history, progress.
- Archiving never deletes history; hard deletion requires explicit confirmation.

### US-03 AI semester planner
- Inputs: course list, confirmed syllabus topics, exams, assignments, availability, preferred session duration, target grade, strengths/weaknesses.
- Outputs: course-level roadmap, weekly goals, daily sessions with duration, priority, topic, rationale, source status, dependencies.
- Constraint checks: no sessions outside semester; total scheduled time ≤ available time (or explicit conflict); exams prioritized; avoid duplicate sessions.
- When inputs are insufficient, provide a provisional plan and request clarification.
- Plan saved as **draft** until user approves; revisions are versioned.

### US-04 Notes and source grounding
- User writes Markdown notes, edits, tags, searches; attaches links and, later, PDFs.
- AI generates summary/key concepts/formulas/examples from **provided text** and cites source title + page/section where available.
- Unsupported claims flagged as suggestions, never passed off as course-specific facts.
- User can accept/edit/reject generated notes.

### US-05 Quiz generation and grading
- Generate quiz by course/topic/difficulty/question count; MVP supports multiple choice, true/false, short answer (manual or model-assisted grading with uncertainty warning).
- Each question has prompt, choices if applicable, correct answer, explanation, source provenance, difficulty, topic IDs.
- Validate that one-answer MCQ has exactly one correct answer and no duplicates; math answers checked where possible.
- User submits answers, receives score, rationale, topic breakdown; wrong answers saved to Mistake Notebook.
- Do not reveal answer before submission unless practice mode explicitly requests it.

### US-06 Adaptive review
- Weakness score based on quiz correctness, recency, attempts, self-reported confidence (transparent heuristic initially).
- Agent proposes review sessions with reason, expected time, and impacted plan entries.
- User can approve/reject and undo; no autonomous destructive schedule changes.

### US-07 Progress and archive
- Dashboard shows today’s tasks, next verified deadlines, weekly planned vs completed minutes, course progress, recent quizzes, Mochi status.
- Archive retains semester history and exportable JSON; cloud sync requires authenticated backend.
- Data must remain readable after schema updates.

### US-08 AI tutor
- Context-aware Q&A restricted to selected course and approved sources when selected.
- Replies include explanation, worked examples and confidence/provenance indicators; tutor must say when course context is missing.
- Tutor does not silently alter user data.

## 4. Information architecture and routes

| Route | Page | Main components |
|---|---|---|
| `/` | Landing | Hero, Mochi, CTA, feature preview |
| `/app` | Dashboard | TodayTaskList, CourseCards, NextExams, WeeklyProgress, MochiWidget |
| `/app/onboarding` | Setup wizard | SemesterForm, CourseEntry, AvailabilityGrid, SourceImport |
| `/app/semesters` | Semester archive | SemesterCards, CreateSemesterDialog |
| `/app/courses/:courseId` | Course overview | TopicOutline, Progress, Deadlines, QuickActions |
| `/app/courses/:courseId/notes` | Notes | NoteEditor, SourceBadge, TagFilters |
| `/app/courses/:courseId/quizzes` | Quiz library | QuizBuilder, QuizHistory |
| `/app/quizzes/:quizId` | Quiz attempt | QuestionRenderer, AnswerForm, Results |
| `/app/planner` | Study planner | Calendar/Week view, PlanDraft, ApproveChanges |
| `/app/mistakes` | Mistake notebook | TopicFilters, ReviewQueue |
| `/app/tutor` | AI tutor | Chat, CourseContextPicker, SourceList |
| `/app/progress` | Analytics | CourseProgress, StudyMinutes, WeakTopics |
| `/app/settings` | Settings | Profile, Theme, DataExport, DeleteAccount |

**Navigation:** desktop sidebar + top bar; mobile bottom nav (Dashboard, Courses, Planner, Tutor, Profile). Course sub-navigation uses tabs. Unknown route → friendly 404.

## 5. UI/UX design system

**Brand:** A+ Monster · **Mascot:** Mochi, original round study monster with glasses, small horns/ears, expressive face. Do not copy copyrighted characters.

**Visual direction:** cozy pastel productivity app, soft off-white backgrounds, lavender primary, mint success, peach accent, sunny yellow rewards; rounded cards, subtle borders, playful but restrained micro-interactions. Mathematical notes remain legible and professionally typeset.

**Suggested tokens (adjust only centrally):**
```css
:root {
  --bg: #FFFDF8;
  --surface: #FFFFFF;
  --primary: #8B7BE8;
  --primary-soft: #F0ECFF;
  --mint: #BCEBD8;
  --peach: #FFD6C8;
  --yellow: #FFE9A6;
  --text: #29283A;
  --muted: #696779;
  --border: #EAE6F2;
  --danger: #C44459;
  --radius-card: 20px;
  --radius-control: 12px;
}
```
- Typography: rounded friendly sans-serif for UI, high-legibility body font, monospace for code; MathJax/KaTeX only when needed.
- Breakpoints: 360px, 768px, 1024px, 1440px; mobile-first.
- States: loading skeleton, empty state, error with retry, offline, disabled, success feedback.
- A11y: WCAG AA contrast target, semantic headings, visible focus, form labels, keyboard navigation, aria-live for AI status, reduced motion.
- Mochi rewards must encourage without shaming; no guilt-based streak mechanics.

## 6. Technology architecture

**Recommended:** React + TypeScript + Vite; React Router; Tailwind CSS (or CSS variables + modules); TanStack Query; Zod; Supabase (Postgres/Auth/Storage/Edge Functions); NVIDIA-hosted model endpoint accessed **server-side only**; Vercel for frontend deployment or equivalent. Prefer minimal dependencies; lock versions.

```text
Browser (React/Vite)
   ├─ Auth session → Supabase Auth
   ├─ CRUD/query → Supabase Postgres (RLS)
   ├─ Upload → Supabase Storage (private buckets + policies)
   └─ AI request → authenticated Edge/Serverless Function
                         ├─ validate user & input
                         ├─ load authorized course context
                         ├─ enforce limits, schema, policy
                         ├─ call NVIDIA model endpoint (server secret)
                         ├─ validate structured response
                         └─ return draft; persist only by authorized action
```

### 6.1 NVIDIA API integration
- NVIDIA API credentials are configured as **server-side environment variables**, e.g. `NVIDIA_API_KEY`; **never** expose them with `VITE_` prefix or commit them.
- Provider configuration must be adjustable via `NVIDIA_BASE_URL` and `NVIDIA_MODEL` rather than hard-coding an unverified model name/endpoint. Check the account’s current endpoint and model capabilities during setup.
- Build `AIProvider` adapter: `generatePlan`, `generateQuiz`, `summarizeNotes`, `tutorReply`, `suggestReplan`.
- Use timeouts, abort/cancellation, retry with backoff only for transient errors, request ID, rate limiting, token/usage logging without logging private content.
- Prefer structured JSON responses; validate with Zod, reject malformed output, return actionable errors; cap generated volume.
- Do not call provider directly from browser. Do not include key in sample requests, error messages, analytics, screenshots or logs.
- AI failure must not block manual planning, note editing, quizzes or browsing.

### 6.2 Hosting decision
- Static GitHub Pages **alone cannot securely host a private NVIDIA API key**. It may host the frontend **only if** a separate secure API backend is deployed.
- A serverless-friendly deployment is recommended for MVP, with the API route/Edge Function hosted separately from static assets.
- Configure SPA route fallback or hash routing where necessary; test deep links after deployment.

## 7. Domain model (proposed)

All tables have `id uuid`, `user_id uuid` where user-owned, `created_at`, `updated_at`, and where relevant `archived_at`.

| Entity | Key fields | Notes |
|---|---|---|
| `profiles` | display_name, timezone, preferences_json | linked to auth user |
| `semesters` | name, start_date, end_date, status | user-owned |
| `courses` | semester_id, title, code, color, target_grade, difficulty, weekly_hours | user-owned |
| `topics` | course_id, parent_topic_id, title, order_index, source_status | hierarchical |
| `course_sources` | course_id, type, title, storage_path, extraction_status, provenance_json | private |
| `deadlines` | course_id, title, due_at, type, confirmed, source_id | verified vs suggested |
| `availability_rules` | semester_id, weekday, start_time, end_time, timezone | time constraints |
| `study_plans` | semester_id, version, status, generated_by, rationale_json | draft/approved/superseded |
| `study_sessions` | plan_id, course_id, topic_id, starts_at, duration_min, status, origin | planned/completed/skipped |
| `notes` | course_id, topic_id, title, body_md, source_ids, author_type | editable |
| `quizzes` | course_id, topic_ids, title, difficulty, origin | versioned |
| `quiz_questions` | quiz_id, type, prompt, options_json, answer_json, explanation, provenance_json | validated |
| `quiz_attempts` | quiz_id, started_at, submitted_at, score, answers_json | immutable on submit |
| `mistakes` | question_id, attempt_id, topic_id, error_type, review_due_at, resolved_at | review history |
| `agent_runs` | action_type, input_hash, status, model, error_code, proposed_changes_json | auditable; no raw secrets |
| `agent_proposals` | agent_run_id, proposal_type, payload_json, status, approved_at | approval gate |
| `mascot_progress` | xp, level, unlocked_items_json | rewards are nonpunitive |

**Integrity:** foreign keys, ownership checks, indexes by `(user_id, semester_id)` and date, timestamps, unique IDs, optimistic concurrency for edits, soft delete/archive as appropriate. RLS on every user-owned table; storage paths and policies must prevent cross-user access. Server-side authorization must not rely solely on client-provided `user_id`.

### 7.1 Data contracts (illustrative)
```ts
type SourceStatus = 'verified' | 'user_provided' | 'ai_suggested';
type PlanStatus = 'draft' | 'approved' | 'superseded';
interface StudySessionDraft {
  clientId: string;
  courseId: string;
  topicId?: string;
  title: string;
  date: string; // YYYY-MM-DD in user's timezone
  durationMinutes: number;
  priority: 'low' | 'medium' | 'high';
  rationale: string;
  sourceStatus: SourceStatus;
}
interface StudyPlanDraft {
  semesterId: string;
  assumptions: string[];
  warnings: string[];
  sessions: StudySessionDraft[];
}
```
- Validate `durationMinutes > 0`, valid course ownership, known topic IDs, no invented verified deadlines.
- User timezone is mandatory for calendar interpretation; store canonical timestamps and display in local timezone.

## 8. Agent orchestration and safety

### 8.1 Agent roles (logical capabilities, not necessarily separate LLMs)
1. **Context Collector:** asks for missing data; labels provenance.
2. **Planner:** produces schedule constrained by availability/deadlines.
3. **Content Assistant:** summarizes user-approved course materials.
4. **Assessment Builder:** creates and validates questions.
5. **Learning Analyst:** computes weak-topic signals from recorded attempts.
6. **Replanner:** proposes modifications, diff and rationale.

### 8.2 State machine
`collecting_context → generating_draft → validating → awaiting_approval → applied → monitoring → proposing_revision → awaiting_approval`.
Errors → `failed` with retry; cancellation → `cancelled`. Never silently jump from generation to applied.

### 8.3 Human-in-the-loop
- AI may **read** only data authorized for the logged-in user.
- AI may **propose** plans, notes, quizzes, review sessions.
- AI may **persist approved drafts** through explicit user action.
- Deleting course data, overwriting notes, or modifying confirmed deadlines requires explicit confirmation.
- Every proposed replan has before/after diff and undo/revert option.

### 8.4 Prompt injection and untrusted inputs
- Syllabi, PDFs, notes, and web text are **untrusted data**, not instructions to the agent.
- Ignore embedded requests to reveal secrets, call unrelated tools, alter system rules, or access other users’ data.
- Limit retrieved context to selected course and verified ownership; sanitize Markdown/HTML; never render model output as raw HTML.

### 8.5 Academic integrity
- Never claim an A+ guarantee; avoid fabricating syllabi, instructor policies, deadlines, citations, or source page numbers.
- Distinguish official course facts from general study recommendations.
- Provide learning support, not covert exam impersonation or unauthorized submission.

## 9. Core algorithms and heuristics

### 9.1 Scheduling baseline (works without AI)
1. Compute available weekly minutes from user rules.
2. Reserve high-priority sessions for verified upcoming deadlines.
3. Allocate remaining time by `(difficulty × urgency × weakness)` normalized across courses.
4. Split into sessions of 25–60 minutes; avoid collisions and exceeding available time.
5. Mark missing syllabus and dates as unconfirmed.
6. Allow manual overrides and rescheduling.

### 9.2 Weak-topic score (transparent MVP heuristic)
`weakness = 0.6 × (1 - recentAccuracy) + 0.25 × lowConfidence + 0.15 × recencyPenalty` (all normalized to [0,1]); if insufficient attempts, mark `insufficient_data` instead of assigning a fake precision score. Document coefficients as tunable, not research-validated.

### 9.3 XP / mascot
XP for completing study sessions, reviewing mistakes, and consistency. No penalty for missing days; no reward for artificially inflated quiz scores. Mascot logic is independent from grades.

## 10. Feature-level UX states

**Planner:** empty → form → generating → draft → conflict warnings → approve → calendar → version history.  
**Quiz:** configure → generate → validate → start → answer → submit → results → mistake log.  
**Notes:** empty → manual or paste source → generate draft → review → save → search/edit.  
**Agent:** request → progress status → proposed action with explanation → approve/reject → audit record.

Every async action must show loading, retry, cancellation where possible, and a nontechnical error message. Do not display placeholder data as real user data.

## 11. Privacy, security, and compliance

- Auth required for cloud user data; route protection and server authorization.
- RLS policies verified with two separate test accounts.
- API keys in secret manager/server env only; `.env.example` uses placeholders.
- CORS allowlist, request body size limits, upload MIME/size validation, rate limiting, input schema validation.
- Private storage buckets and short-lived signed URLs for source documents.
- No raw private documents or API keys in application logs; minimal agent telemetry.
- Explicit export/delete flows; retention policy stated in product privacy copy.
- AI requests may send selected learning content to NVIDIA-hosted services; disclose this before use and provide opt-out/manual path.
- Do not promise regulatory compliance without actual review.

## 12. Testing and quality gates

**Unit:** scheduling constraints, score calculations, quiz validators, schema parsers, date/time handling, XP.  
**Integration:** authenticated CRUD, RLS ownership, AI edge function validation, failure/retry, draft approval.  
**E2E:** onboarding → create course → generate/approve plan → complete task → quiz → mistake → proposed replan → refresh → preserved data.  
**Security:** no key in frontend bundle, no cross-user reads, injection attempts, upload validation.  
**Accessibility:** keyboard-only flow, contrast, labels, reduced motion.  
**Deployment:** fresh incognito sign-up, deep links, env vars, build, no broken buttons.


## 13. Proposed repository layout
```text
aplus-monster/
├── AGENTS.md
├── README.md
├── PRODUCT_SPEC.md
├── .env.example
├── .gitignore
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── mascots/
├── src/
│   ├── app/                # app bootstrap, router, providers
│   ├── components/
│   │   ├── ui/             # reusable design primitives
│   │   └── mascot/         # Mochi illustrations & states
│   ├── features/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── semesters/
│   │   ├── courses/
│   │   ├── planner/
│   │   ├── notes/
│   │   ├── quizzes/
│   │   ├── mistakes/
│   │   ├── tutor/
│   │   └── progress/
│   ├── lib/                # API clients, date helpers, validators
│   ├── styles/             # tokens and global styles
│   └── types/              # shared contracts
├── supabase/
│   ├── migrations/
│   └── functions/
│       └── ai-gateway/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
    ├── architecture.md
    ├── data-model.md
    └── decisions/
```

## 14. Milestone plan

**M0:** scaffold, design tokens, router, data model, auth/local-demo decision.  
**M1:** semester/course CRUD, dashboard, tasks, local persistence or Supabase.  
**M2:** planner, notes, quizzes, mistakes, progress, seed demo content clearly marked.  
**M3:** serverless NVIDIA gateway + real plan generation + approval flow.  
**M4:** AI notes/quiz, structured validation, rate limits.  
**M5:** adaptive replanning, version history, analytics.  
**M6:** document upload/RAG, exports, optional calendar integrations.

## 15. Open decisions (must not be guessed by coding agents)
- Which NVIDIA-accessible model and endpoint are enabled for the user's account? Verify via provider dashboard/docs.
- Supabase project and hosting provider credentials: supplied by project owner; do not invent.
- Login methods: email/password vs magic link vs OAuth.
- AI budget/rate limits and user consent copy.
- Whether PDFs are needed in first deployment; if yes, select extraction approach and file size cap.
- Preferred app language: default zh-TW, prepare i18n structure for English.


