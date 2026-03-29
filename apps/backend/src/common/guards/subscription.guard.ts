import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest()
    if (user?.role !== 'TRAINER') return true

    const sub = await this.prisma.trainerSubscription.findUnique({
      where: { trainerId: user.id },
    })

    if (!sub || !['TRIAL', 'ACTIVE'].includes(sub.status)) {
      throw new ForbiddenException(
        'Tu suscripción ha vencido. Renueva tu plan para continuar.',
      )
    }
    return true
  }
}
