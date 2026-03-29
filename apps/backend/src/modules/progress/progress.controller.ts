import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { ProgressService } from './progress.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard)
@Controller()
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Post('client/progress/weight')
  logWeight(@CurrentUser() user: any, @Body() body: { weight: number; notes?: string }) {
    return this.progressService.logWeight(user.id, body.weight, body.notes)
  }

  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Get('client/progress/weight')
  getWeight(@CurrentUser() user: any) {
    return this.progressService.getWeightHistory(user.id)
  }

  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Get('client/progress/streak')
  getStreak(@CurrentUser() user: any) {
    return this.progressService.getStreak(user.id)
  }

  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Get('client/progress/adherence')
  getAdherence(@CurrentUser() user: any) {
    return this.progressService.getAdherence(user.id)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Get('trainer/clients/:id/progress')
  getClientProgress(@Param('id') clientId: string) {
    return this.progressService.getWeightHistory(clientId)
  }
}
