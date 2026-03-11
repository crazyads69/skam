import { z } from "zod";

export const createCaseSchema = z.object({
  bankIdentifier: z
    .string()
    .regex(/^\d{8,20}$/, "Số tài khoản phải từ 8-20 chữ số"),
  bankName: z.string().min(2).max(120),
  bankCode: z.string().min(2).max(10),
  amount: z.number().nonnegative().nullable().optional(),
  scammerName: z.string().min(2).max(120).nullable().optional(),
  originalDescription: z.string().min(50).max(5000),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
