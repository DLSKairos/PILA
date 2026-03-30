import { Module } from '@nestjs/common'
import { WorkoutService } from './workout.service'
import { WorkoutController } from './workout.controller'
import { AIModule } from '../ai/ai.module'

@Module({
  imports: [AIModule],
  controllers: [WorkoutController],
  providers: [WorkoutService],
  exports: [WorkoutService],
})
export class WorkoutModule {}
