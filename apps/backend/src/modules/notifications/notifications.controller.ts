import { Controller, Post, Delete, Get, Body, UseGuards } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard, RolesGuard)
@Roles('CLIENT')
@Controller('client/notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('subscribe')
  subscribe(
    @CurrentUser() user: any,
    @Body() body: { deviceInfo: any; subscription: any },
  ) {
    return this.notificationsService.subscribe(user.id, body.deviceInfo, body.subscription)
  }

  @Delete('subscribe')
  unsubscribe(@CurrentUser() user: any, @Body('endpoint') endpoint: string) {
    return this.notificationsService.unsubscribe(user.id, endpoint)
  }
}
