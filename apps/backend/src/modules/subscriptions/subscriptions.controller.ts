import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { SubscriptionsService } from './subscriptions.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard, RolesGuard)
@Roles('TRAINER')
@Controller('trainer/subscription')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get()
  getSubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.getSubscription(user.id)
  }

  @Get('usage')
  getUsage(@CurrentUser() user: any) {
    return this.subscriptionsService.getUsage(user.id)
  }

  @Post('payment')
  registerPayment(@CurrentUser() user: any, @Body() dto: any) {
    return this.subscriptionsService.registerPayment(user.id, dto)
  }
}
