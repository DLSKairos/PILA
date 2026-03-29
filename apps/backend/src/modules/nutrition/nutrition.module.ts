import { Module } from '@nestjs/common'
import { NutritionService } from './nutrition.service'
import { NutritionController } from './nutrition.controller'
import { AIModule } from '../ai/ai.module'

@Module({
  imports: [AIModule],
  controllers: [NutritionController],
  providers: [NutritionService],
  exports: [NutritionService],
})
export class NutritionModule {}
