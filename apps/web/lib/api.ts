import type {
  ApiResponse,
  Bank,
  CaseStatus,
  PaginatedResponse,
  ScamCase,
  ScammerProfile,
  SocialPlatform,
} from "@skam/shared/types";
import { getApiBaseUrl } from "@/lib/site";

export const apiUrl: string = getApiBaseUrl();

interface ApiRequestInit extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
  next?: {
    revalidate: number;
  };
}

async function apiRequest<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (init?.headers) {
    const extraHeaders = new Headers(init.headers);
    extraHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;
  const response: Response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: init?.next ? undefined : "no-store",
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const errorField: unknown =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      (payload as { error?: unknown }).error
        ? (payload as { error: unknown }).error
        : null;
    const messageField: unknown =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      (payload as { message?: unknown }).message
        ? (payload as { message: unknown }).message
        : null;
    const raw: unknown = errorField ?? messageField;
    const message: string =
      typeof raw === "string"
        ? raw
        : Array.isArray(raw)
          ? raw
              .filter((item): item is string => typeof item === "string")
              .join(", ")
          : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export interface SearchParams {
  readonly q: string;
  readonly bankCode?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface SearchPayload extends PaginatedResponse<ScamCase> {}

export async function searchCases(
  params: SearchParams,
): Promise<SearchPayload> {
  const searchParams: URLSearchParams = new URLSearchParams({ q: params.q });
  if (params.bankCode) searchParams.set("bankCode", params.bankCode);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
  return apiRequest<SearchPayload>(`/cases/search?${searchParams.toString()}`);
}

export async function getCase(id: string): Promise<ApiResponse<ScamCase>> {
  return apiRequest<ApiResponse<ScamCase>>(`/cases/${id}`);
}

export interface ProfilePayload extends ScammerProfile {
  recentCases: ScamCase[];
}

export async function getProfile(
  identifier: string,
): Promise<ApiResponse<ProfilePayload>> {
  return apiRequest<ApiResponse<ProfilePayload>>(
    `/profiles/${encodeURIComponent(identifier)}`,
  );
}

export async function getBanks(): Promise<ApiResponse<Bank[]>> {
  return apiRequest<ApiResponse<Bank[]>>("/banks");
}

export async function searchBanks(query: string): Promise<ApiResponse<Bank[]>> {
  const searchParams: URLSearchParams = new URLSearchParams({ q: query });
  return apiRequest<ApiResponse<Bank[]>>(
    `/banks/search?${searchParams.toString()}`,
  );
}

export interface PresignUploadInput {
  readonly fileName: string;
  readonly fileSize: number;
  readonly contentType: string;
  readonly fileHash?: string;
}

export interface PresignUploadPayload {
  fileKey: string;
  uploadUrl: string;
  expiresIn: number;
}

export async function presignUpload(
  input: PresignUploadInput,
): Promise<ApiResponse<PresignUploadPayload>> {
  return apiRequest<ApiResponse<PresignUploadPayload>>("/upload/presign", {
    method: "POST",
    body: input,
  });
}

export interface CreateCaseInput {
  readonly bankIdentifier: string;
  readonly bankName: string;
  readonly bankCode: string;
  readonly amount?: number;
  readonly scammerName?: string;
  readonly originalDescription: string;
  readonly turnstileToken?: string;
  readonly socialLinks?: Array<{
    platform: SocialPlatform;
    url: string;
    username?: string;
  }>;
  readonly evidenceFiles?: Array<{
    fileType: string;
    fileKey: string;
    fileName?: string;
    fileSize?: number;
    fileHash?: string;
  }>;
}

export async function createCase(
  input: CreateCaseInput,
): Promise<ApiResponse<ScamCase>> {
  return apiRequest<ApiResponse<ScamCase>>("/cases", {
    method: "POST",
    body: input,
  });
}

export async function getSummary(): Promise<
  ApiResponse<{
    totalCases: number;
    totalApprovedCases: number;
    totalPendingCases: number;
    totalScammerProfiles: number;
    totalScamAmount: number;
  }>
> {
  return apiRequest("/analytics/summary", {
    next: { revalidate: 60 },
  });
}

export async function getRecentCases(
  page: number = 1,
  pageSize: number = 6,
): Promise<PaginatedResponse<ScamCase>> {
  const searchParams: URLSearchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest(`/cases/recent?${searchParams.toString()}`, {
    next: { revalidate: 60 },
  });
}

export async function getAdminMe(
  token: string,
): Promise<ApiResponse<{ username: string; provider: "github" }>> {
  return apiRequest("/auth/me", { token });
}

export async function exchangeAdminCode(code: string): Promise<
  ApiResponse<{
    token: string;
    principal: { username: string; provider: "github" };
  }>
> {
  return apiRequest("/auth/code/exchange", {
    method: "POST",
    body: { code },
  });
}

export async function listAdminCases(
  token: string,
  status?: CaseStatus,
  page: number = 1,
  pageSize: number = 20,
): Promise<PaginatedResponse<ScamCase>> {
  const searchParams = new URLSearchParams();
  if (status) searchParams.set("status", status);
  searchParams.set("page", String(page));
  searchParams.set("pageSize", String(pageSize));
  return apiRequest(
    `/admin/cases${searchParams.size ? `?${searchParams.toString()}` : ""}`,
    { token },
  );
}

export async function approveAdminCase(
  token: string,
  id: string,
  refinedDescription?: string,
): Promise<ApiResponse<ScamCase>> {
  return apiRequest(`/admin/cases/${id}/approve`, {
    method: "PATCH",
    token,
    body: { refinedDescription },
  });
}

export async function rejectAdminCase(
  token: string,
  id: string,
  reason: string,
): Promise<ApiResponse<ScamCase>> {
  return apiRequest(`/admin/cases/${id}/reject`, {
    method: "PATCH",
    token,
    body: { reason },
  });
}

export async function getAdminCase(
  token: string,
  id: string,
): Promise<ApiResponse<ScamCase>> {
  return apiRequest(`/admin/cases/${id}`, { token });
}

export async function getAdminAnalytics(token: string): Promise<
  ApiResponse<{
    totalCases: number;
    statusBreakdown: Record<string, number>;
    topReportedAccounts: Array<{
      bankIdentifier: string;
      bankCode: string;
      count: number;
    }>;
  }>
> {
  return apiRequest("/admin/analytics", { token });
}

export async function refineAdminCase(
  token: string,
  id: string,
  refinedDescription: string,
): Promise<ApiResponse<ScamCase>> {
  return apiRequest(`/admin/cases/${id}/refine`, {
    method: "PATCH",
    token,
    body: { refinedDescription },
  });
}

export async function getAdminEvidenceViewUrl(
  token: string,
  fileKey: string,
): Promise<
  ApiResponse<{ fileKey: string; viewUrl: string; expiresIn: number }>
> {
  return apiRequest("/upload/view-url", {
    method: "POST",
    token,
    body: { fileKey },
  });
}

export async function getPublicEvidenceViewUrl(
  caseId: string,
  evidenceId: string,
): Promise<
  ApiResponse<{ fileKey: string; viewUrl: string; expiresIn: number }>
> {
  return apiRequest("/upload/public-view-url", {
    method: "POST",
    body: { caseId, evidenceId },
  });
}
