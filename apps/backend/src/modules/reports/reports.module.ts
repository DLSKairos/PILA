import { Module } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { ReportsController } from './reports.controller'
import { AIModule } from '../ai/ai.module'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [AIModule, EmailModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
