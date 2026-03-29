import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { NutritionService } from './nutrition.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard)
@Controller()
export class NutritionController {
  constructor(private nutritionService: NutritionService) {}

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Post('trainer/clients/:id/ai/nutrition')
  generateWithAI(@CurrentUser() user: any, @Param('id') clientId: string) {
    return this.nutritionService.generateWithAI(user.id, clientId)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Get('trainer/clients/:id/nutrition')
  getActivePlan(@Param('id') clientId: string) {
    return this.nutritionService.getActivePlan(clientId)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Post('trainer/clients/:id/nutrition/:planId/approve')
  approvePlan(@Param('planId') planId: string) {
    return this.nutritionService.approvePlan(planId)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Post('trainer/clients/:id/nutrition/:planId/meals')
  addMeal(@Param('planId') planId: string, @Body() dto: any) {
    return this.nutritionService.addMealItem(planId, dto)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Patch('trainer/clients/:id/nutrition/:planId/meals/:mealId')
  updateMeal(@Param('mealId') mealId: string, @Body() dto: any) {
    return this.nutritionService.updateMealItem(mealId, dto)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Delete('trainer/clients/:id/nutrition/:planId/meals/:mealId')
  deleteMeal(@Param('mealId') mealId: string) {
    return this.nutritionService.deleteMealItem(mealId)
  }

  @Get('foods/search')
  searchFoods(@Query('q') q: string) {
    return this.nutritionService.searchFoods(q)
  }

  @Get('foods/substitutions/:foodName')
  getSubstitutions(@Param('foodName') foodName: string) {
    return this.nutritionService.getFoodSubstitutions(foodName)
  }

  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Get('client/nutrition')
  getMyPlan(@CurrentUser() user: any) {
    return this.nutritionService.getActivePlan(user.id)
  }
}
