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
import type { GoogleProfile } from './strategies/google-trainer.strategy'

// Sesiones persistentes: 30 días, rolling (se renueva en cada refresh)
const REFRESH_TOKEN_DAYS = 30

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  // ── REGISTRO / LOGIN CLÁSICO ─────────────────────────────────

  async registerTrainer(dto: RegisterTrainerDto) {
    const exists = await this.prisma.trainer.findUnique({ where: { email: dto.email } })
    if (exists) throw new ConflictException('El email ya está registrado')

    const passwordHash = await bcrypt.hash(dto.password, 12)
    const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)

    const trainer = await this.prisma.trainer.create({
      data: {
        name: `${dto.firstName} ${dto.lastName}`,
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
        settings: { create: {} },
      },
    })

    this.email.sendWelcomeTrainer(trainer.email, trainer.name, trainer.preferredLanguage).catch(() => {})
    return this.generateTokens(trainer.id, 'TRAINER', trainer.email)
  }

  async loginTrainer(dto: LoginDto) {
    const trainer = await this.prisma.trainer.findUnique({ where: { email: dto.email } })
    if (!trainer || !trainer.isActive)
      throw new UnauthorizedException('Credenciales inválidas')

    if (!trainer.passwordHash)
      throw new UnauthorizedException('Esta cuenta usa Google. Inicia sesión con Google.')

    const valid = await bcrypt.compare(dto.password, trainer.passwordHash)
    if (!valid) throw new UnauthorizedException('Credenciales inválidas')

    await this.checkSessionLimit(trainer.id, 'TRAINER')
    return this.generateTokens(trainer.id, 'TRAINER', trainer.email)
  }

  async loginClient(dto: LoginDto) {
    const client = await this.prisma.client.findUnique({ where: { email: dto.email } })
    if (!client || !client.isActive)
      throw new UnauthorizedException('Credenciales inválidas')

    if (!client.passwordHash)
      throw new UnauthorizedException('Esta cuenta usa Google. Inicia sesión con Google.')

    const valid = await bcrypt.compare(dto.password, client.passwordHash)
    if (!valid) throw new UnauthorizedException('Credenciales inválidas')

    await this.checkSessionLimit(client.id, 'CLIENT')
    return this.generateTokens(client.id, 'CLIENT', client.email)
  }

  // ── GOOGLE OAUTH ─────────────────────────────────────────────

  async googleLoginTrainer(profile: GoogleProfile) {
    // 1. Buscar por googleId
    let trainer = await this.prisma.trainer.findUnique({ where: { googleId: profile.googleId } })

    // 2. Buscar por email (vincular cuenta existente)
    if (!trainer) {
      trainer = await this.prisma.trainer.findUnique({ where: { email: profile.email } })
      if (trainer) {
        trainer = await this.prisma.trainer.update({
          where: { id: trainer.id },
          data: {
            googleId: profile.googleId,
            photoUrl: trainer.photoUrl ?? profile.photoUrl,
          },
        })
      }
    }

    // 3. Crear nueva cuenta de entrenador con Google
    if (!trainer) {
      const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      trainer = await this.prisma.trainer.create({
        data: {
          name: profile.name,
          email: profile.email,
          googleId: profile.googleId,
          photoUrl: profile.photoUrl,
          preferredLanguage: 'es',
          subscription: {
            create: {
              plan: 'STARTER',
              status: 'TRIAL',
              trialEndsAt,
              currentPeriodStart: new Date(),
              currentPeriodEnd: trialEndsAt,
            },
          },
          settings: { create: {} },
        },
      })
      this.email.sendWelcomeTrainer(trainer.email, trainer.name, trainer.preferredLanguage).catch(() => {})
    }

    if (!trainer.isActive) throw new UnauthorizedException('Cuenta desactivada')

    await this.checkSessionLimit(trainer.id, 'TRAINER')
    return this.generateTokens(trainer.id, 'TRAINER', trainer.email)
  }

  async googleLoginClient(profile: GoogleProfile) {
    // Los clientes no se auto-registran: deben tener cuenta activa
    let client = await this.prisma.client.findUnique({ where: { googleId: profile.googleId } })

    if (!client) {
      client = await this.prisma.client.findUnique({ where: { email: profile.email } })
      if (client && client.isActive) {
        // Vincular Google a cuenta existente
        client = await this.prisma.client.update({
          where: { id: client.id },
          data: {
            googleId: profile.googleId,
            photoUrl: client.photoUrl ?? profile.photoUrl,
          },
        })
      }
    }

    if (!client || !client.isActive) {
      throw new UnauthorizedException(
        'No tienes una cuenta activa. Usa el link de invitación de tu entrenador.',
      )
    }

    await this.checkSessionLimit(client.id, 'CLIENT')
    return this.generateTokens(client.id, 'CLIENT', client.email)
  }

  async activateClientWithGoogle(invitationToken: string, profile: GoogleProfile) {
    const invitation = await this.prisma.clientInvitation.findUnique({
      where: { token: invitationToken },
    })

    if (!invitation || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Token de invitación inválido o expirado')
    }

    if (invitation.email.toLowerCase() !== profile.email.toLowerCase()) {
      throw new BadRequestException(
        'El email de Google no coincide con la invitación. Usa la cuenta de Google asociada a ' +
        invitation.email,
      )
    }

    const client = await this.prisma.client.findFirst({
      where: { email: invitation.email, trainerId: invitation.trainerId },
    })
    if (!client) throw new BadRequestException('Token de invitación inválido o expirado')

    await this.prisma.client.update({
      where: { id: client.id },
      data: {
        googleId: profile.googleId,
        photoUrl: client.photoUrl ?? profile.photoUrl,
        isActive: true,
      },
    })

    await this.prisma.clientInvitation.delete({ where: { token: invitationToken } })

    return this.generateTokens(client.id, 'CLIENT', client.email)
  }

  // ── REFRESH / LOGOUT ─────────────────────────────────────────

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token inválido o expirado')
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date())
      throw new UnauthorizedException('Refresh token inválido o expirado')

    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } })

    const email = stored.userRole === 'TRAINER'
      ? (await this.prisma.trainer.findUnique({ where: { id: stored.userId }, select: { email: true } }))?.email
      : (await this.prisma.client.findUnique({ where: { id: stored.userId }, select: { email: true } }))?.email

    return this.generateTokens(stored.userId, stored.userRole, email)
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }

  // ── CONTRASEÑA ───────────────────────────────────────────────

  async forgotPassword(email: string) {
    const trainer = await this.prisma.trainer.findUnique({ where: { email } })
    const client = !trainer ? await this.prisma.client.findUnique({ where: { email } }) : null
    const user = trainer ?? client
    if (!user) return

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, userRole: trainer ? 'TRAINER' : 'CLIENT', expiresAt },
    })

    const lang = trainer?.preferredLanguage ?? client?.preferredLanguage ?? 'es'
    this.email.sendResetPassword(email, token, lang).catch(() => {})
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token } })
    if (!record || record.expiresAt < new Date() || record.usedAt)
      throw new BadRequestException('Token inválido o expirado')

    const passwordHash = await bcrypt.hash(newPassword, 12)

    if (record.userRole === 'TRAINER') {
      await this.prisma.trainer.update({ where: { id: record.userId }, data: { passwordHash } })
    } else {
      await this.prisma.client.update({ where: { id: record.userId }, data: { passwordHash } })
    }

    await this.prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } })
  }

  async changePassword(
    userId: string,
    userRole: string,
    currentPassword: string,
    newPassword: string,
    currentToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    let storedHash: string | null

    if (userRole === 'TRAINER') {
      const trainer = await this.prisma.trainer.findUnique({ where: { id: userId } })
      if (!trainer) throw new NotFoundException('Usuario no encontrado')
      storedHash = trainer.passwordHash
    } else {
      const client = await this.prisma.client.findUnique({ where: { id: userId } })
      if (!client) throw new NotFoundException('Usuario no encontrado')
      storedHash = client.passwordHash
    }

    if (!storedHash) throw new BadRequestException('Esta cuenta usa Google. No tiene contraseña.')

    const valid = await bcrypt.compare(currentPassword, storedHash)
    if (!valid) throw new BadRequestException('La contraseña actual es incorrecta')

    const newHash = await bcrypt.hash(newPassword, 12)

    if (userRole === 'TRAINER') {
      await this.prisma.trainer.update({ where: { id: userId }, data: { passwordHash: newHash } })
    } else {
      await this.prisma.client.update({ where: { id: userId }, data: { passwordHash: newHash } })
    }

    const currentSession = await this.prisma.refreshToken.findUnique({ where: { token: currentToken } })
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        userRole: userRole as any,
        ...(currentSession ? { NOT: { id: currentSession.id } } : {}),
      },
    })

    await this.prisma.auditLog.create({
      data: {
        entityType: userRole === 'TRAINER' ? 'Trainer' : 'Client',
        entityId: userId,
        action: 'password_changed',
        changedBy: userId,
        changedByRole: userRole,
        ...(userRole === 'TRAINER' ? { trainerId: userId } : {}),
      },
    })

    return { success: true, message: 'Contraseña actualizada' }
  }

  // ── ACTIVACIÓN CLIENTE (contraseña) ──────────────────────────

  async activateClient(token: string, password: string) {
    const invitation = await this.prisma.clientInvitation.findUnique({ where: { token } })
    if (!invitation || invitation.expiresAt < new Date())
      throw new BadRequestException('Token inválido o expirado')

    const client = await this.prisma.client.findFirst({
      where: { email: invitation.email, trainerId: invitation.trainerId },
    })
    if (!client) throw new BadRequestException('Token inválido o expirado')

    const passwordHash = await bcrypt.hash(password, 12)
    await this.prisma.client.update({
      where: { id: client.id },
      data: { passwordHash, isActive: true },
    })
    await this.prisma.clientInvitation.delete({ where: { token } })

    return this.generateTokens(client.id, 'CLIENT', client.email)
  }

  // ── SESIONES ─────────────────────────────────────────────────

  private async checkSessionLimit(userId: string, userRole: string) {
    const activeSessions = await this.prisma.refreshToken.findMany({
      where: { userId, userRole: userRole as any, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
    })
    if (activeSessions.length >= 5) {
      await this.prisma.refreshToken.delete({ where: { id: activeSessions[0].id } })
    }
  }

  async getSessions(userId: string, userRole: string, currentToken: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId, userRole: userRole as any, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
    return sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.token === currentToken,
    }))
  }

  async revokeSession(userId: string, userRole: string, tokenId: string, currentToken: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: tokenId, userId, userRole: userRole as any },
    })
    if (!session) throw new NotFoundException('Sesión no encontrada')
    if (session.token === currentToken)
      throw new BadRequestException('No puedes cerrar la sesión actual desde este endpoint. Usa /auth/logout.')

    await this.prisma.refreshToken.delete({ where: { id: tokenId } })
    return { success: true, message: 'Sesión cerrada correctamente' }
  }

  // ── TOKENS ───────────────────────────────────────────────────

  private async generateTokens(userId: string, role: string, email?: string) {
    const payload = { sub: userId, role }
    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN') ?? '15m',
    })
    const refreshTokenValue = randomBytes(40).toString('hex')
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)

    await this.prisma.refreshToken.create({
      data: { token: refreshTokenValue, userId, userRole: role as any, expiresAt },
    })

    return { accessToken, refreshToken: refreshTokenValue, user: { id: userId, role, email: email ?? '' } }
  }
}
