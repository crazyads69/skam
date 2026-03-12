import { t } from "elysia";

export const ExchangeCodeBody = t.Object({
  code: t.String({ minLength: 32, maxLength: 128 }),
});

export const GitHubCallbackQuery = t.Object({
  code: t.String(),
});
