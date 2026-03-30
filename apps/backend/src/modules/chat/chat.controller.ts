import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common'
import { ChatService } from './chat.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Get(':clientId/messages')
  getMessages(
    @CurrentUser() user: any,
    @Param('clientId') clientId: string,
    @Query('page') page = '1',
  ) {
    return this.chatService.getMessages(user.id, clientId, Number(page))
  }

  @UseGuards(RolesGuard)
  @Roles('TRAINER')
  @Patch(':clientId/read')
  markAsRead(@CurrentUser() user: any, @Param('clientId') clientId: string) {
    return this.chatService.markAsRead(user.id, clientId, 'TRAINER')
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: any) {
    return this.chatService.getUnreadCount(user.id, user.role)
  }
}
