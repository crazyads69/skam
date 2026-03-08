const rawWhitelist: string = process.env.ADMIN_WHITELIST ?? ''

export const ADMIN_WHITELIST: string[] = rawWhitelist
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean)
