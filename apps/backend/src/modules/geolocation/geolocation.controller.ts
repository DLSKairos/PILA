import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { GeolocationService } from './geolocation.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard, RolesGuard)
@Roles('CLIENT')
@Controller('client/location')
export class GeolocationController {
  constructor(private geolocationService: GeolocationService) {}

  @Post('check')
  check(
    @CurrentUser() user: any,
    @Body() body: { latitude: number; longitude: number },
  ) {
    return this.geolocationService.checkProximity(user.id, body.latitude, body.longitude)
  }
}
