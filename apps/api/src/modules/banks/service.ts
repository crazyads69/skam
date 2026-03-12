import type {
  Bank,
  CachedBanksPayload,
  VietQrBankItem,
  VietQrBankResponse,
} from "@skam/shared/src/types";
import { serviceUnavailable } from "../../common/error";
import { cache } from "../../services/cache";

const CACHE_KEY = "banks:vietqr:list";
const STALE_KEY = "banks:vietqr:stale";
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 1 day
const STALE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const REQUEST_TIMEOUT_MS = Math.max(
  1000,
  Number(process.env.VIETQR_TIMEOUT_MS ?? "5000"),
);
const BANKS_API_URL =
  process.env.VIETQR_BANKS_URL ?? "https://api.vietqr.io/v2/banks";

export class BanksService {
  private memoryCache: CachedBanksPayload | null = null;
  private inflightFetch: Promise<Bank[]> | null = null;

  async listBanks(forceRefresh = false): Promise<Bank[]> {
    if (!forceRefresh) {
      const memory = this.getMemoryCache();
      if (memory) return memory;

      const cached = await cache.get<Bank[]>(CACHE_KEY);
      if (cached?.length) {
        this.memoryCache = { fetchedAt: Date.now(), data: cached };
        return cached;
      }
    }

    const banks = await this.fetchBanks();
    if (banks.length) {
      this.memoryCache = { fetchedAt: Date.now(), data: banks };
      await cache.set(CACHE_KEY, banks, CACHE_TTL_SECONDS);
      await cache.set(STALE_KEY, banks, STALE_TTL_SECONDS);
      return banks;
    }

    const stale = await cache.get<Bank[]>(STALE_KEY);
    if (stale?.length) return stale;
    if (this.memoryCache?.data.length) return this.memoryCache.data;

    throw serviceUnavailable("Không thể tải danh sách ngân hàng");
  }

  async searchBanks(query: string): Promise<Bank[]> {
    const normalized = query.trim().toLowerCase();
    const banks = await this.listBanks();
    if (!normalized) return banks;
    return banks.filter(
      (bank) =>
        bank.code.toLowerCase().includes(normalized) ||
        bank.shortName.toLowerCase().includes(normalized) ||
        bank.name.toLowerCase().includes(normalized) ||
        bank.bin.toLowerCase().includes(normalized),
    );
  }

  async refreshBanks(): Promise<void> {
    this.memoryCache = null;
    await cache.del(CACHE_KEY);
    await cache.del(STALE_KEY);
    await this.listBanks(true);
  }

  private async fetchBanks(): Promise<Bank[]> {
    if (!this.inflightFetch) {
      this.inflightFetch = this.fetchBanksFromProvider().finally(() => {
        this.inflightFetch = null;
      });
    }
    return this.inflightFetch;
  }

  private async fetchBanksFromProvider(): Promise<Bank[]> {
    const response = await this.fetchWithTimeout(
      BANKS_API_URL,
      REQUEST_TIMEOUT_MS,
    );
    if (!response?.ok) return [];
    const payload = (await response.json()) as VietQrBankResponse;
    if (payload.code !== "00" || !Array.isArray(payload.data)) return [];
    return payload.data
      .map((item) => this.normalizeBank(item))
      .filter((item): item is Bank => Boolean(item))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  private normalizeBank(input: VietQrBankItem): Bank | null {
    const str = (val?: unknown): string => String(val ?? "").trim();
    const id = Number(input.id ?? 0);
    const code = str(input.code).toUpperCase();
    const name = str(input.name);
    const bin = str(input.bin);
    const shortName = str(input.shortName ?? input.short_name ?? code);
    const transferSupported: 0 | 1 =
      Number(input.transferSupported ?? input.isTransfer ?? 0) === 1 ? 1 : 0;
    const lookupSupported: 0 | 1 =
      Number(input.lookupSupported ?? 0) === 1 ? 1 : 0;

    if (!id || !code || !name || !bin || !shortName) return null;
    if (!/^\d{6}$/.test(bin)) return null;

    return {
      id,
      code,
      bin,
      name,
      shortName,
      logo: this.normalizeLogo(input.logo ?? null),
      transferSupported,
      lookupSupported,
      short_name: input.short_name ? String(input.short_name) : undefined,
      support: typeof input.support === "number" ? input.support : undefined,
      isTransfer:
        typeof input.isTransfer === "number"
          ? input.isTransfer === 1
            ? 1
            : 0
          : undefined,
      swift_code: input.swift_code ? String(input.swift_code) : undefined,
    };
  }

  private normalizeLogo(logo: string | null): string | null {
    if (!logo) return null;
    try {
      const parsed = new URL(logo);
      if (
        parsed.hostname === "api.vietqr.io" &&
        parsed.pathname.startsWith("/img/")
      ) {
        return `https://cdn.vietqr.io${parsed.pathname}`;
      }
      return logo;
    } catch {
      return null;
    }
  }

  private getMemoryCache(): Bank[] | null {
    if (!this.memoryCache) return null;
    const ageMs = Date.now() - this.memoryCache.fetchedAt;
    if (ageMs > CACHE_TTL_SECONDS * 1000) {
      this.memoryCache = null;
      return null;
    }
    return this.memoryCache.data;
  }

  private async fetchWithTimeout(
    url: string,
    timeoutMs: number,
  ): Promise<Response | null> {
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeoutMs);
    try {
      return await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          "user-agent": "skam-api/1.0",
        },
        signal: abortController.signal,
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

export const banksService = new BanksService();
