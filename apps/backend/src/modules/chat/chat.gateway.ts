import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { ChatService } from './chat.service'
import { Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(ChatGateway.name)
  private connectedUsers = new Map<string, { socketId: string; role: string }>()

  constructor(
    private chatService: ChatService,
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token as string
      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      }) as { sub: string; role: string }

      client.data.userId = payload.sub
      client.data.role = payload.role
      this.connectedUsers.set(payload.sub, { socketId: client.id, role: payload.role })
      client.join(`user:${payload.sub}`)
      this.logger.log(`Connected: ${payload.sub} (${payload.role})`)
    } catch {
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.connectedUsers.delete(client.data.userId)
    }
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { clientId?: string; trainerId?: string; content: string; attachmentUrl?: string; attachmentType?: string },
  ) {
    const senderId = client.data.userId
    const senderRole = client.data.role as 'TRAINER' | 'CLIENT'

    let trainerId = senderRole === 'TRAINER' ? senderId : data.trainerId
    const clientId = senderRole === 'CLIENT' ? senderId : data.clientId

    if (!clientId) return

    if (senderRole === 'CLIENT' && !trainerId) {
      const clientRecord = await this.prisma.client.findUnique({
        where: { id: clientId },
        select: { trainerId: true },
      })
      trainerId = clientRecord?.trainerId
    }

    if (!trainerId) return

    const message = await this.chatService.saveMessage({
      trainerId,
      clientId,
      content: data.content,
      senderRole,
      attachmentUrl: data.attachmentUrl,
      attachmentType: data.attachmentType,
    })

    // Enviar al destinatario si está conectado
    const recipientId = senderRole === 'TRAINER' ? clientId : trainerId
    this.server.to(`user:${recipientId}`).emit('new_message', message)
    client.emit('new_message', message)
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { clientId?: string; trainerId?: string; isTyping: boolean },
  ) {
    const recipientId = client.data.role === 'TRAINER' ? data.clientId : data.trainerId
    this.server.to(`user:${recipientId}`).emit('typing', {
      userId: client.data.userId,
      isTyping: data.isTyping,
    })
  }
}
