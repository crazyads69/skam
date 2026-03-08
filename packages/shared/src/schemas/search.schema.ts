import { z } from 'zod'

export const searchSchema = z.object({
  q: z.string().min(3).max(64),
  bankCode: z.string().min(2).max(10).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10)
})

export type SearchInput = z.infer<typeof searchSchema>
