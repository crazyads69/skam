import { SocialPlatform } from "@skam/shared/types";
import { z } from "zod";

const maxEvidenceFiles: number = 5;
const maxEvidenceFileSize: number = 100 * 1024 * 1024;

export const reportSchema = z.object({
  bankIdentifier: z
    .string()
    .regex(/^\d{8,20}$/, "Số tài khoản phải từ 8-20 chữ số"),
  bankName: z.string().min(2).max(120),
  bankCode: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Za-z0-9]+$/, "Mã ngân hàng không hợp lệ"),
  amount: z.coerce.number().min(0).optional(),
  scammerName: z.string().min(2).max(120).optional().or(z.literal("")),
  originalDescription: z.string().min(50).max(5000),
  socialLinks: z
    .array(
      z.object({
        platform: z.nativeEnum(SocialPlatform),
        url: z
          .string()
          .max(500)
          .refine(
            (value) =>
              value.trim().length === 0 ||
              z.string().url().safeParse(value).success,
            "Liên kết không hợp lệ",
          ),
        username: z.string(),
      }),
    )
    .default([]),
  evidenceFiles: z
    .array(
      z.object({
        fileName: z.string(),
        fileSize: z
          .number()
          .int()
          .positive()
          .max(maxEvidenceFileSize, "Tệp vượt quá 100MB"),
        fileType: z.string(),
        fileKey: z.string(),
        fileHash: z.string(),
      }),
    )
    .max(maxEvidenceFiles, "Chỉ được tải tối đa 5 tệp")
    .default([]),
});

export type ReportFormValues = z.infer<typeof reportSchema>;
