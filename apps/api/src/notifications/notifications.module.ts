import { Global, Module } from '@nestjs/common'
import { TelegramNotifierService } from './telegram-notifier.service'

@Global()
@Module({
  providers: [TelegramNotifierService],
  exports: [TelegramNotifierService]
})
export class NotificationsModule {}
