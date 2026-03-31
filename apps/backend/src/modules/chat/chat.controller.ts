import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common'
import { ChatService } from './chat.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  // CLIENT: obtener su historial de mensajes con el entrenador
  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Get('me/messages')
  getMyMessages(
    @CurrentUser() user: any,
    @Query('page') page = '1',
  ) {
    return this.chatService.getMessagesForClient(user.id, Number(page))
  }

  // CLIENT: enviar un mensaje al entrenador
  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Post('messages')
  sendMessage(
    @CurrentUser() user: any,
    @Body() body: { trainerId: string; content: string; attachmentUrl?: string; attachmentType?: string },
  ) {
    return this.chatService.saveMessage({
      trainerId: body.trainerId,
      clientId: user.id,
      content: body.content,
      senderRole: 'CLIENT',
      attachmentUrl: body.attachmentUrl,
      attachmentType: body.attachmentType,
    })
  }

  // CLIENT: marcar mensajes del entrenador como leídos
  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Patch('me/read')
  markAsReadClient(@CurrentUser() user: any, @Body() body: { trainerId: string }) {
    return this.chatService.markAsRead(body.trainerId, user.id, 'CLIENT')
  }

  // TRAINER: obtener mensajes con un cliente específico
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

  // TRAINER: marcar mensajes de un cliente como leídos
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
