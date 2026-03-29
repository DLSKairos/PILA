import { Module } from '@nestjs/common'
import { TrackingService } from './tracking.service'
import { TrackingController } from './tracking.controller'
import { AIModule } from '../ai/ai.module'

@Module({
  imports: [AIModule],
  controllers: [TrackingController],
  providers: [TrackingService],
})
export class TrackingModule {}
