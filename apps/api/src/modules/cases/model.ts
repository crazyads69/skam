import { t } from "elysia";

export const CreateSocialLinkSchema = t.Object({
  platform: t.Union([
    t.Literal("FACEBOOK"), t.Literal("ZALO"), t.Literal("TELEGRAM"),
    t.Literal("X"), t.Literal("TIKTOK"), t.Literal("INSTAGRAM"),
  ]),
  url: t.String({ maxLength: 500, format: "uri" }),
  username: t.Optional(t.String({ maxLength: 120 })),
});

export const CreateEvidenceFileSchema = t.Object({
  fileType: t.String({ minLength: 2, maxLength: 40 }),
  fileKey: t.String({ minLength: 5, maxLength: 300 }),
  fileName: t.Optional(t.String({ maxLength: 255 })),
  fileSize: t.Optional(t.Number({ minimum: 1, maximum: 104857600 })),
  fileHash: t.Optional(t.String({ minLength: 10, maxLength: 128 })),
});

export const CreateCaseBody = t.Object({
  bankIdentifier: t.RegExp(/^\d{8,20}$/, { error: "Số tài khoản phải từ 8-20 chữ số" }),
  bankName: t.String({ minLength: 2, maxLength: 120 }),
  bankCode: t.String({ minLength: 2, maxLength: 10, pattern: "^[A-Za-z0-9]+$" }),
  amount: t.Optional(t.Number({ minimum: 0, maximum: 100000000000 })),
  scammerName: t.Optional(t.String({ minLength: 2, maxLength: 120 })),
  originalDescription: t.String({ minLength: 50, maxLength: 5000 }),
  turnstileToken: t.Optional(t.String({ minLength: 10 })),
  submitterFingerprint: t.Optional(t.String({ minLength: 8, maxLength: 255 })),
  socialLinks: t.Optional(t.Array(CreateSocialLinkSchema)),
  evidenceFiles: t.Optional(t.Array(CreateEvidenceFileSchema)),
});

export const SearchCaseQuery = t.Object({
  q: t.String({ minLength: 3, maxLength: 64 }),
  bankCode: t.Optional(t.String({ minLength: 2, maxLength: 10 })),
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  pageSize: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 10 })),
});

export const PaginateQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  pageSize: t.Optional(t.Number({ minimum: 1, maximum: 50, default: 10 })),
});
