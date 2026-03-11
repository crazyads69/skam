import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type {
  Bank,
  CachedBanksPayload,
  VietQrBankItem,
  VietQrBankResponse,
} from "@skam/shared/src/types";
import { CacheService } from "../cache/cache.service";

@Injectable()
export class BanksService {
  private readonly cacheKey: string = "banks:vietqr:list";
  private readonly staleKey: string = "banks:vietqr:stale";
  private readonly cacheTtlSeconds: number = 24 * 60 * 60; // 1 day
  private readonly requestTimeoutMs: number = Math.max(
    1000,
    Number(process.env.VIETQR_TIMEOUT_MS ?? "5000"),
  );
  private readonly banksApiUrl: string =
    process.env.VIETQR_BANKS_URL ?? "https://api.vietqr.io/v2/banks";
  private memoryCache: CachedBanksPayload | null = null;
  private inflightFetch: Promise<Bank[]> | null = null;

  public constructor(private readonly cacheService: CacheService) {}

  public async listBanks(forceRefresh: boolean = false): Promise<Bank[]> {
    if (!forceRefresh) {
      const memory: Bank[] | null = this.getMemoryCache();
      if (memory) return memory;
      const cached: Bank[] | null = await this.cacheService.get<Bank[]>(
        this.cacheKey,
      );
      if (cached?.length) {
        this.memoryCache = { fetchedAt: Date.now(), data: cached };
        return cached;
      }
    }
    const banks: Bank[] = await this.fetchBanks();
    if (banks.length) {
      this.memoryCache = { fetchedAt: Date.now(), data: banks };
      await this.cacheService.set(this.cacheKey, banks, this.cacheTtlSeconds);
      const STALE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
      await this.cacheService.set(this.staleKey, banks, STALE_TTL_SECONDS);
      return banks;
    }
    const stale: Bank[] | null = await this.cacheService.get<Bank[]>(
      this.staleKey,
    );
    if (stale?.length) return stale;
    if (this.memoryCache?.data.length) return this.memoryCache.data;
    throw new ServiceUnavailableException("Không thể tải danh sách ngân hàng");
  }

  public async searchBanks(query: string): Promise<Bank[]> {
    const normalized: string = query.trim().toLowerCase();
    const banks: Bank[] = await this.listBanks();
    if (!normalized) return banks;
    return banks.filter(
      (bank) =>
        bank.code.toLowerCase().includes(normalized) ||
        bank.shortName.toLowerCase().includes(normalized) ||
        bank.name.toLowerCase().includes(normalized) ||
        bank.bin.toLowerCase().includes(normalized),
    );
  }

  public async refreshBanks(): Promise<void> {
    this.memoryCache = null;
    await this.cacheService.del(this.cacheKey);
    await this.cacheService.del(this.staleKey);
    await this.listBanks(true);
  }

  private async fetchBanksFromProvider(): Promise<Bank[]> {
    const response: Response | null = await this.fetchWithTimeout(
      this.banksApiUrl,
      this.requestTimeoutMs,
    );
    if (!response?.ok) return [];
    const payload = (await response.json()) as VietQrBankResponse;
    if (payload.code !== "00" || !Array.isArray(payload.data)) return [];
    return payload.data
      .map((item) => this.normalizeBank(item))
      .filter((item): item is Bank => Boolean(item))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  private async fetchBanks(): Promise<Bank[]> {
    if (!this.inflightFetch) {
      this.inflightFetch = this.fetchBanksFromProvider().finally(() => {
        this.inflightFetch = null;
      });
    }
    return this.inflightFetch;
  }

  private normalizeBank(input: VietQrBankItem): Bank | null {
    const str = (val?: unknown): string => String(val ?? "").trim();
    const id: number = Number(input.id ?? 0);
    const code: string = str(input.code).toUpperCase();
    const name: string = str(input.name);
    const bin: string = str(input.bin);
    const shortName: string = str(input.shortName ?? input.short_name ?? code);
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
    const ageMs: number = Date.now() - this.memoryCache.fetchedAt;
    if (ageMs > this.cacheTtlSeconds * 1000) {
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
