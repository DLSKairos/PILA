import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { OnboardingService } from './onboarding.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard, RolesGuard)
@Roles('CLIENT')
@Controller('client/onboarding')
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Get('status')
  getStatus(@CurrentUser() user: any) {
    return this.onboardingService.getStatus(user.id)
  }

  @Post('message')
  sendMessage(@CurrentUser() user: any, @Body('message') message: string) {
    return this.onboardingService.sendMessage(user.id, message)
  }
}
