import { z } from 'zod'

export const courseFormSchema = z.object({
  title: z.string().min(1, '請輸入課程名稱').max(80, '名稱最多 80 字'),
  code: z.string().max(20, '課程代碼最多 20 字').optional().default(''),
  color: z.enum(['lavender', 'mint', 'peach', 'yellow', 'sky', 'rose']).default('lavender'),
  targetGrade: z.string().max(10, '成績目標最多 10 字').optional().default(''),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  weeklyHours: z.coerce.number().min(0.5, '至少 0.5 小時').max(40, '最多 40 小時').default(3),
})

export type CourseFormValues = z.infer<typeof courseFormSchema>
