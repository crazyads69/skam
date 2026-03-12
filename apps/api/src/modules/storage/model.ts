import { t } from "elysia";

export const UploadPresignBody = t.Object({
  fileName: t.String({ minLength: 3, maxLength: 255 }),
  contentType: t.String({ minLength: 3, maxLength: 120 }),
  fileSize: t.Number({ minimum: 1, maximum: 104857600 }),
  fileHash: t.Optional(t.String({ minLength: 10, maxLength: 128 })),
});

export const ViewUrlBody = t.Object({
  fileKey: t.String({ minLength: 10, maxLength: 255, pattern: "^evidence/[a-zA-Z0-9._/-]+$" }),
});

export const PublicViewUrlBody = t.Object({
  caseId: t.String({ minLength: 10, maxLength: 40 }),
  evidenceId: t.String({ minLength: 10, maxLength: 40 }),
});
