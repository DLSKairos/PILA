import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET')!,
    })
  }

  async validate(payload: { sub: string; role: string }) {
    if (payload.role === 'TRAINER') {
      const trainer = await this.prisma.trainer.findUnique({
        where: { id: payload.sub },
      })
      if (!trainer || !trainer.isActive) throw new UnauthorizedException()
      return { id: trainer.id, email: trainer.email, role: 'TRAINER' }
    }

    const client = await this.prisma.client.findUnique({
      where: { id: payload.sub },
    })
    if (!client || !client.isActive) throw new UnauthorizedException()
    return { id: client.id, email: client.email, role: 'CLIENT', trainerId: client.trainerId }
  }
}
