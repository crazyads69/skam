import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AdminGuard } from './guards/admin.guard'
import { GitHubStrategy } from './strategies/github.strategy'

@Module({
  imports: [PassportModule.register({ session: false })],
  controllers: [AuthController],
  providers: [AuthService, AdminGuard, GitHubStrategy],
  exports: [AuthService, AdminGuard]
})
export class AuthModule {}
