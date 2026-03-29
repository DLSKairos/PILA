import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { TrainersService } from './trainers.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard, RolesGuard)
@Roles('TRAINER')
@Controller('trainer')
export class TrainersController {
  constructor(private trainersService: TrainersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.trainersService.getProfile(user.id)
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: any, @Body() dto: any) {
    return this.trainersService.updateProfile(user.id, dto)
  }

  @Get('settings')
  getSettings(@CurrentUser() user: any) {
    return this.trainersService.getSettings(user.id)
  }

  @Patch('settings')
  updateSettings(@CurrentUser() user: any, @Body() dto: any) {
    return this.trainersService.updateSettings(user.id, dto)
  }

  @Get('dashboard')
  getDashboard(@CurrentUser() user: any) {
    return this.trainersService.getDashboard(user.id)
  }

  @Get('dashboard/stats')
  getDashboardStats(@CurrentUser() user: any) {
    return this.trainersService.getDashboardStats(user.id)
  }
}
