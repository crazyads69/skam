import { Module } from '@nestjs/common'
import { AdminModule } from './admin/admin.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { AuthModule } from './auth/auth.module'
import { BanksModule } from './banks/banks.module'
import { CacheModule } from './cache/cache.module'
import { CasesModule } from './cases/cases.module'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './health/health.module'
import { ProfilesModule } from './profiles/profiles.module'
import { StorageModule } from './storage/storage.module'
import { TurnstileModule } from './turnstile/turnstile.module'

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    TurnstileModule,
    HealthModule,
    CasesModule,
    ProfilesModule,
    AnalyticsModule,
    AuthModule,
    AdminModule,
    BanksModule,
    StorageModule
  ]
})
export class AppModule {}
