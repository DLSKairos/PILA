import { Module } from '@nestjs/common'
import { OnboardingService } from './onboarding.service'
import { OnboardingController } from './onboarding.controller'
import { AIModule } from '../ai/ai.module'

@Module({
  imports: [AIModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
