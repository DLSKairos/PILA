import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common'
import { ChatService } from './chat.service'
import { ChatGateway } from './chat.gateway'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

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
  async markAsReadClient(@CurrentUser() user: any, @Body() body: { trainerId: string }) {
    const result = await this.chatService.markAsRead(body.trainerId, user.id, 'CLIENT')
    this.chatGateway.server
      .to(`user:${body.trainerId}`)
      .emit('messages_read', { conversationId: body.trainerId, readBy: 'CLIENT' })
    return result
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
  async markAsRead(@CurrentUser() user: any, @Param('clientId') clientId: string) {
    const result = await this.chatService.markAsRead(user.id, clientId, 'TRAINER')
    this.chatGateway.server
      .to(`user:${clientId}`)
      .emit('messages_read', { conversationId: clientId, readBy: 'TRAINER' })
    return result
  }

  @UseGuards(RolesGuard)
  @Roles('CLIENT')
  @Get('conversations')
  getConversations(@CurrentUser() user: any) {
    return this.chatService.getConversationsForClient(user.id)
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: any) {
    return this.chatService.getUnreadCount(user.id, user.role)
  }
}
