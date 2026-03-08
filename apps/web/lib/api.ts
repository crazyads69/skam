import type { ApiResponse, ScamCase } from '@skam/shared/types'

const defaultApiUrl: string = 'http://localhost:4000/api/v1'
const apiUrl: string = process.env.NEXT_PUBLIC_API_URL ?? defaultApiUrl

export interface SearchParams {
  readonly q: string
  readonly bankCode?: string
}

export async function searchCases(params: SearchParams): Promise<ApiResponse<ScamCase[]>> {
  const searchParams: URLSearchParams = new URLSearchParams({ q: params.q })
  if (params.bankCode) searchParams.set('bankCode', params.bankCode)
  const response: Response = await fetch(`${apiUrl}/cases/search?${searchParams.toString()}`, {
    cache: 'no-store'
  })
  return response.json()
}
