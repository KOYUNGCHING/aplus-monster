import { z } from 'zod'

export const semesterFormSchema = z.object({
  name: z.string().min(1, '請輸入學期名稱').max(60, '名稱最多 60 字'),
  startDate: z.string().min(1, '請選擇開始日期'),
  endDate: z.string().min(1, '請選擇結束日期'),
  timezone: z.string().min(1),
}).refine((d) => d.startDate < d.endDate, {
  message: '結束日期必須晚於開始日期',
  path: ['endDate'],
})

export type SemesterFormValues = z.infer<typeof semesterFormSchema>
