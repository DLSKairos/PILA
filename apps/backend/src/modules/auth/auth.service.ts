import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { RegisterTrainerDto } from './dto/register-trainer.dto'
import { LoginDto } from './dto/login.dto'
import { EmailService } from '../email/email.service'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  async registerTrainer(dto: RegisterTrainerDto) {
    const exists = await this.prisma.trainer.findUnique({
      where: { email: dto.email },
    })
    if (exists) throw new ConflictException('El email ya está registrado')

    const passwordHash = await bcrypt.hash(dto.password, 12)
    const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)

    const trainer = await this.prisma.trainer.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        preferredLanguage: dto.preferredLanguage ?? 'es',
        subscription: {
          create: {
            plan: 'STARTER',
            status: 'TRIAL',
            trialEndsAt,
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEndsAt,
          },
        },
        settings: {
          create: {},
        },
      },
    })

    await this.email.sendWelcomeTrainer(trainer.email, trainer.name, trainer.preferredLanguage)

    return this.generateTokens(trainer.id, 'TRAINER')
  }

  async loginTrainer(dto: LoginDto) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { email: dto.email },
    })
    if (!trainer || !trainer.isActive)
      throw new UnauthorizedException('Credenciales inválidas')

    const valid = await bcrypt.compare(dto.password, trainer.passwordHash)
    if (!valid) throw new UnauthorizedException('Credenciales inválidas')

    return this.generateTokens(trainer.id, 'TRAINER')
  }

  async loginClient(dto: LoginDto) {
    const client = await this.prisma.client.findUnique({
      where: { email: dto.email },
    })
    if (!client || !client.isActive)
      throw new UnauthorizedException('Credenciales inválidas')

    const valid = await bcrypt.compare(dto.password, client.passwordHash)
    if (!valid) throw new UnauthorizedException('Credenciales inválidas')

    return this.generateTokens(client.id, 'CLIENT')
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })
    if (!stored || stored.expiresAt < new Date())
      throw new UnauthorizedException('Refresh token inválido o expirado')

    await this.prisma.refreshToken.delete({ where: { token: refreshToken } })
    return this.generateTokens(stored.userId, stored.userRole)
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    })
  }

  async forgotPassword(email: string) {
    const trainer = await this.prisma.trainer.findUnique({ where: { email } })
    const client = !trainer
      ? await this.prisma.client.findUnique({ where: { email } })
      : null

    const user = trainer ?? client
    if (!user) return // No revelar si existe o no

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        userRole: trainer ? 'TRAINER' : 'CLIENT',
        expiresAt,
      },
    })

    const lang = trainer?.preferredLanguage ?? client?.preferredLanguage ?? 'es'
    await this.email.sendResetPassword(email, token, lang)
    return // no exponer el token en producción
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    })
    if (!record || record.expiresAt < new Date() || record.usedAt)
      throw new BadRequestException('Token inválido o expirado')

    const passwordHash = await bcrypt.hash(newPassword, 12)

    if (record.userRole === 'TRAINER') {
      await this.prisma.trainer.update({
        where: { id: record.userId },
        data: { passwordHash },
      })
    } else {
      await this.prisma.client.update({
        where: { id: record.userId },
        data: { passwordHash },
      })
    }

    await this.prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    })
  }

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role }
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '15m',
    })
    const refreshTokenValue = randomBytes(40).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        userRole: role as any,
        expiresAt,
      },
    })

    return { accessToken, refreshToken: refreshTokenValue }
  }
}
