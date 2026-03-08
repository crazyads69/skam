import { Injectable } from '@nestjs/common'
import { BANK_CODES } from '@skam/shared/src/constants'
import { CacheService } from '../cache/cache.service'

interface BankRecord {
  code: string
  shortName: string
  name: string
}

@Injectable()
export class BanksService {
  private readonly cacheKey: string = 'banks:list'
  private readonly cacheTtlSeconds: number = 60 * 60 * 24 * 7

  public constructor(private readonly cacheService: CacheService) {}

  public async listBanks(): Promise<BankRecord[]> {
    const cached: BankRecord[] | null = await this.cacheService.get<BankRecord[]>(this.cacheKey)
    if (cached) return cached
    const banks: BankRecord[] = BANK_CODES.map((code) => ({
      code,
      shortName: code,
      name: `Ngân hàng ${code}`
    }))
    await this.cacheService.set(this.cacheKey, banks, this.cacheTtlSeconds)
    return banks
  }

  public async searchBanks(query: string): Promise<BankRecord[]> {
    const normalized: string = query.trim().toLowerCase()
    const banks: BankRecord[] = await this.listBanks()
    return banks.filter((bank) =>
      bank.code.toLowerCase().includes(normalized) ||
      bank.shortName.toLowerCase().includes(normalized) ||
      bank.name.toLowerCase().includes(normalized)
    )
  }

  public async refreshBanks(): Promise<void> {
    await this.cacheService.del(this.cacheKey)
  }
}
