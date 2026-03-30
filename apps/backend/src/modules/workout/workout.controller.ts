import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { WorkoutService } from './workout.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard)
@Controller()
export class WorkoutController {
  constructor(private workoutService: WorkoutService) {}

  // ── Trainer endpoints ──────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Post('trainer/clients/:id/ai/workout')
  generateWithAI(@CurrentUser() user: any, @Param('id') clientId: string) {
    return this.workoutService.generateWithAI(user.id, clientId)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Post('trainer/clients/:id/workout')
  createPlan(@Param('id') clientId: string) {
    return this.workoutService.createPlan(clientId)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Get('trainer/clients/:id/workout')
  getActivePlan(@Param('id') clientId: string) {
    return this.workoutService.getActivePlan(clientId)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Get('trainer/clients/:id/workout/history')
  getPlanHistory(@Param('id') clientId: string) {
    return this.workoutService.getPlanHistory(clientId)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Post('trainer/clients/:id/workout/:planId/approve')
  approvePlan(@Param('planId') planId: string) {
    return this.workoutService.approvePlan(planId)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Post('trainer/clients/:id/workout/:planId/days')
  addDay(@Param('planId') planId: string, @Body() dto: any) {
    return this.workoutService.addDay(planId, dto)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Patch('trainer/clients/:id/workout/:planId/days/:dayId')
  updateDay(@Param('dayId') dayId: string, @Body() dto: any) {
    return this.workoutService.updateDay(dayId, dto)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Delete('trainer/clients/:id/workout/:planId/days/:dayId')
  deleteDay(@Param('dayId') dayId: string) {
    return this.workoutService.deleteDay(dayId)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Post('trainer/clients/:id/workout/:planId/days/:dayId/exercises')
  addExercise(@Param('dayId') dayId: string, @Body() dto: any) {
    return this.workoutService.addExercise(dayId, dto)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Patch('trainer/clients/:id/workout/:planId/days/:dayId/exercises/:exId')
  updateExercise(@Param('exId') exId: string, @Body() dto: any) {
    return this.workoutService.updateExercise(exId, dto)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Delete('trainer/clients/:id/workout/:planId/days/:dayId/exercises/:exId')
  deleteExercise(@Param('exId') exId: string) {
    return this.workoutService.deleteExercise(exId)
  }

  // ── Exercise library ───────────────────────────────────────

  @Get('exercises/library')
  getLibrary(
    @Query('muscle') muscle?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    return this.workoutService.getExerciseLibrary(muscle, difficulty)
  }

  // ── Client endpoints ───────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Get('client/workout')
  getMyPlan(@CurrentUser() user: any) {
    return this.workoutService.getActivePlan(user.id)
  }

  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Get('client/workout/today')
  getTodayWorkout(@CurrentUser() user: any) {
    return this.workoutService.getTodayWorkout(user.id)
  }
}
