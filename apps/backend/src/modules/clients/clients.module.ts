import { Module } from '@nestjs/common'
import { ClientsService } from './clients.service'
import { ClientsController } from './clients.controller'
import { SubscriptionsModule } from '../subscriptions/subscriptions.module'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [SubscriptionsModule, EmailModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
