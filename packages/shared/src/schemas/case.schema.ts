import { z } from 'zod'

export const createCaseSchema = z.object({
  bankIdentifier: z.string().min(6).max(40),
  bankName: z.string().min(2).max(120),
  bankCode: z.string().min(2).max(10),
  amount: z.number().nonnegative().nullable().optional(),
  scammerName: z.string().min(2).max(120).nullable().optional(),
  originalDescription: z.string().min(50).max(5000)
})

export type CreateCaseInput = z.infer<typeof createCaseSchema>
