export interface RequestLike {
  ip?: string
  headers: Record<string, string | string[] | undefined>
}

export function resolveRequestIdentifier(request: RequestLike): string {
  const fallback: string = request.ip ?? 'unknown'
  if ((process.env.TRUST_PROXY_HEADERS ?? 'false') !== 'true') return fallback
  const trustedHeader: string = process.env.TRUSTED_PROXY_HEADER ?? 'x-vercel-forwarded-for'
  const headerValue: string | string[] | undefined = request.headers[trustedHeader]
  const rawValue: string | undefined = Array.isArray(headerValue) ? headerValue[0] : headerValue
  const candidate: string = rawValue?.split(',')[0]?.trim() ?? fallback
  if (!candidate) return fallback
  if (candidate.length > 128) return fallback
  if (!/^[0-9a-fA-F:.]+$/.test(candidate)) return fallback
  return candidate
}
