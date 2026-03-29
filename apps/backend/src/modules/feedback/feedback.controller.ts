import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { FeedbackService } from './feedback.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard)
@Controller()
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Post('client/feedback')
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.feedbackService.createFeedback(user.id, dto)
  }

  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Get('client/feedback')
  getMyFeedback(@CurrentUser() user: any) {
    return this.feedbackService.getClientFeedback(user.id)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Get('trainer/clients/:id/feedback')
  getClientFeedback(@Param('id') clientId: string) {
    return this.feedbackService.getClientFeedback(clientId)
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Patch('trainer/clients/:id/feedback/:feedbackId')
  resolve(@Param('feedbackId') feedbackId: string, @Body('trainerNote') note: string) {
    return this.feedbackService.resolveFeedback(feedbackId, note)
  }
}
