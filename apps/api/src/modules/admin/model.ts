import { t } from "elysia";

export const ApproveCaseBody = t.Object({
  refinedDescription: t.Optional(t.String({ minLength: 10, maxLength: 5000 })),
});

export const RejectCaseBody = t.Object({
  reason: t.String({ minLength: 5, maxLength: 500 }),
});

export const RefineCaseBody = t.Object({
  refinedDescription: t.String({ minLength: 10, maxLength: 5000 }),
});

export const AdminCasesQuery = t.Object({
  status: t.Optional(
    t.Union([
      t.Literal("PENDING"),
      t.Literal("APPROVED"),
      t.Literal("REJECTED"),
    ]),
  ),
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  pageSize: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
});
