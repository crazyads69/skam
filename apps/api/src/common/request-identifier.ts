export interface RequestLike {
  ip?: string
  headers: Record<string, string | string[] | undefined>
}

export function resolveRequestIdentifier(request: RequestLike): string {
  const fallback: string = request.ip ?? 'unknown'
  if ((process.env.TRUST_PROXY_HEADERS ?? 'false') !== 'true') return fallback
  const forwardedFor: string | string[] | undefined = request.headers['x-forwarded-for']
  const rawValue: string | undefined = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
  const candidate: string = rawValue?.split(',')[0]?.trim() ?? fallback
  if (!candidate) return fallback
  if (candidate.length > 128) return fallback
  if (!/^[0-9a-fA-F:.]+$/.test(candidate)) return fallback
  return candidate
}
