import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { TrackingService } from './tracking.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard, RolesGuard)
@Roles('CLIENT')
@Controller('client/tracking')
export class TrackingController {
  constructor(private trackingService: TrackingService) {}

  @Get('today')
  getToday(@CurrentUser() user: any) {
    return this.trackingService.getTodayLog(user.id)
  }

  @Post('meals/:mealItemId/complete')
  completeMeal(@CurrentUser() user: any, @Param('mealItemId') id: string) {
    return this.trackingService.completeMeal(user.id, id)
  }

  @Post('meals/:mealItemId/substitute')
  substituteMeal(
    @CurrentUser() user: any,
    @Param('mealItemId') id: string,
    @Body('reason') reason: string,
  ) {
    return this.trackingService.substituteMeal(user.id, id, reason)
  }

  @Post('gym/checkin')
  gymCheckin(@CurrentUser() user: any, @Body('gymId') gymId: string) {
    return this.trackingService.gymCheckin(user.id, gymId)
  }

  @Post('gym/checkout')
  gymCheckout(@CurrentUser() user: any) {
    return this.trackingService.gymCheckout(user.id)
  }

  @Post('exercises/:exerciseId/complete')
  completeExercise(
    @CurrentUser() user: any,
    @Param('exerciseId') id: string,
    @Body() data: any,
  ) {
    return this.trackingService.completeExercise(user.id, id, data)
  }

  @Delete('meals/:mealItemId/complete')
  uncompleteMeal(@CurrentUser() user: any, @Param('mealItemId') id: string) {
    return this.trackingService.uncompleteMeal(user.id, id)
  }

  @Delete('exercises/:exerciseId/complete')
  uncompleteExercise(@CurrentUser() user: any, @Param('exerciseId') id: string) {
    return this.trackingService.uncompleteExercise(user.id, id)
  }

  @Post('water')
  logWater(@CurrentUser() user: any) {
    return this.trackingService.logWater(user.id)
  }

  @Get('water/today')
  getWater(@CurrentUser() user: any) {
    return this.trackingService.getWaterToday(user.id)
  }

  @Get('gym/session')
  getGymSession(@CurrentUser() user: any) {
    return this.trackingService.getGymSession(user.id)
  }

  @Get('gym/history')
  getGymHistory(@CurrentUser() user: any) {
    return this.trackingService.getGymHistory(user.id)
  }
}
