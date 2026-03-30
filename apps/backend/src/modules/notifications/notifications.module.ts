import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [ScheduleModule.forRoot(), EmailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
