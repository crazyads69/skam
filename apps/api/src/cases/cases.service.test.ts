import { describe, expect, it } from 'bun:test'
import type { CacheService } from '../cache/cache.service'
import type { PrismaService } from '../database/prisma.service'
import type { TelegramNotifierService } from '../notifications/telegram-notifier.service'
import type { TurnstileService } from '../turnstile/turnstile.service'
import { CasesService } from './cases.service'

describe('CasesService', () => {
  it('creates a case', async () => {
    const now: Date = new Date('2026-01-01T00:00:00.000Z')
    const prisma: Pick<PrismaService, 'scamCase'> = {
      scamCase: {
        create: async ({ data }: { data: Record<string, unknown> }) =>
          ({
            id: 'case_1',
            bankIdentifier: data.bankIdentifier as string,
            bankName: data.bankName as string,
            bankCode: data.bankCode as string,
            amount: data.amount as number | null,
            scammerName: data.scammerName as string | null,
            originalDescription: data.originalDescription as string,
            refinedDescription: null,
            status: 'PENDING',
            viewCount: 0,
            createdAt: now,
            updatedAt: now
          }) as never
      } as never
    }
    const cache: Pick<CacheService, 'fixedWindowLimit'> = {
      fixedWindowLimit: async () => true
    }
    const turnstile: Pick<TurnstileService, 'verify'> = {
      verify: async () => true
    }
    const notifier: Pick<TelegramNotifierService, 'notifyNewCase'> = {
      notifyNewCase: async () => undefined
    }
    const service = new CasesService(
      prisma as PrismaService,
      cache as CacheService,
      turnstile as TurnstileService,
      notifier as TelegramNotifierService
    )
    const created = await service.createCase({
      bankIdentifier: '12345678',
      bankName: 'Nguyen Van A',
      bankCode: 'VCB',
      amount: 1000000,
      originalDescription:
        'Tôi bị lừa qua hình thức mua bán online và đã chuyển khoản trước khi nhận hàng.'
    })
    expect(created.id.length).toBeGreaterThan(0)
    expect(created.bankCode).toBe('VCB')
  })
})
