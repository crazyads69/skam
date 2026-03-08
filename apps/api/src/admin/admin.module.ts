import { Module } from '@nestjs/common'
import { BanksModule } from '../banks/banks.module'
import { AuthModule } from '../auth/auth.module'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'

@Module({
  imports: [AuthModule, BanksModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
