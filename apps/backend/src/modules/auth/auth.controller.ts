import {
  Controller, Post, Body, Get, Delete, Patch,
  Param, Req, Res, UseGuards, Query,
} from '@nestjs/common'
import type { Request, Response } from 'express'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const passport = require('passport') as typeof import('passport')
import { AuthGuard } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { RegisterTrainerDto } from './dto/register-trainer.dto'
import { LoginDto } from './dto/login.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { GoogleProfile } from './strategies/google-trainer.strategy'

const COOKIE_NAME = 'refreshToken'
const INVITATION_COOKIE = '_pending_invitation'

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días — sesión persistente
  path: '/',
}

const INVITATION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 10 * 60 * 1000, // 10 minutos
  path: '/',
}

@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string

  constructor(private authService: AuthService) {
    this.frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5174'
  }

  // ── REGISTRO / LOGIN CLÁSICO ─────────────────────────────────

  @Post('trainer/register')
  async registerTrainer(@Body() dto: RegisterTrainerDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.registerTrainer(dto)
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS)
    return { accessToken: result.accessToken, user: result.user }
  }

  @Post('trainer/login')
  async loginTrainer(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.loginTrainer(dto)
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS)
    return { accessToken: result.accessToken, user: result.user }
  }

  @Post('client/login')
  async loginClient(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.loginClient(dto)
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS)
    return { accessToken: result.accessToken, user: result.user }
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies as Record<string, string>)[COOKIE_NAME]
    const result = await this.authService.refresh(token)
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS)
    return { accessToken: result.accessToken, user: result.user }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies as Record<string, string>)[COOKIE_NAME]
    await this.authService.logout(token)
    res.clearCookie(COOKIE_NAME, { path: '/' })
    return { ok: true }
  }

  // ── GOOGLE OAUTH — ENTRENADOR ────────────────────────────────

  /**
   * Inicia el flujo OAuth con Google para entrenadores.
   * El callback redirige al frontend con el token.
   */
  @Get('google/trainer')
  googleTrainerInit(@Req() req: Request, @Res() res: Response) {
    passport.authenticate('google-trainer', {
      scope: ['profile', 'email'],
      session: false,
    })(req, res, () => {
      res.redirect(`${this.frontendUrl}/login?error=google`)
    })
  }

  @Get('google/trainer/callback')
  @UseGuards(AuthGuard('google-trainer'))
  async googleTrainerCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const profile = req.user as GoogleProfile
      const result = await this.authService.googleLoginTrainer(profile)
      res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS)
      const params = new URLSearchParams({
        at: result.accessToken,
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      })
      res.redirect(`${this.frontendUrl}/auth/google/callback?${params.toString()}`)
    } catch (err: any) {
      const msg = encodeURIComponent(err?.message ?? 'Error al autenticar con Google')
      res.redirect(`${this.frontendUrl}/login?error=${msg}`)
    }
  }

  // ── GOOGLE OAUTH — CLIENTE ───────────────────────────────────

  /**
   * Inicia el flujo OAuth con Google para clientes.
   * Si viene con `invitationToken`, lo guarda en cookie segura antes de redirigir a Google.
   * El backend usa esa cookie en el callback para activar la cuenta.
   */
  @Get('google/client')
  googleClientInit(
    @Query('invitationToken') invitationToken: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (invitationToken) {
      res.cookie(INVITATION_COOKIE, invitationToken, INVITATION_COOKIE_OPTS)
    }
    passport.authenticate('google-client', {
      scope: ['profile', 'email'],
      session: false,
    })(req, res, () => {
      res.redirect(`${this.frontendUrl}/login?error=google`)
    })
  }

  @Get('google/client/callback')
  @UseGuards(AuthGuard('google-client'))
  async googleClientCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const profile = req.user as GoogleProfile
      const invitationToken = (req.cookies as Record<string, string>)[INVITATION_COOKIE]

      // Limpiar cookie de invitación
      res.clearCookie(INVITATION_COOKIE, { path: '/' })

      let result: Awaited<ReturnType<typeof this.authService.googleLoginClient>>

      if (invitationToken) {
        result = await this.authService.activateClientWithGoogle(invitationToken, profile)
      } else {
        result = await this.authService.googleLoginClient(profile)
      }

      res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS)
      const params = new URLSearchParams({
        at: result.accessToken,
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      })
      res.redirect(`${this.frontendUrl}/auth/google/callback?${params.toString()}`)
    } catch (err: any) {
      const msg = encodeURIComponent(err?.message ?? 'Error al autenticar con Google')
      const cookies = req.cookies as Record<string, string>
      const hasInvitation = !!cookies[INVITATION_COOKIE]
      res.clearCookie(INVITATION_COOKIE, { path: '/' })
      const target = hasInvitation ? '/activate' : '/login'
      res.redirect(`${this.frontendUrl}${target}?error=${msg}`)
    }
  }

  // ── CONTRASEÑA ───────────────────────────────────────────────

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email)
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password)
  }

  @Post('client/activate')
  async activateClient(
    @Body('token') token: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.activateClient(token, password)
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS)
    return { accessToken: result.accessToken, user: result.user }
  }

  // ── SESIONES ─────────────────────────────────────────────────

  @UseGuards(JwtGuard)
  @Get('sessions')
  getSessions(@CurrentUser() user: any, @Req() req: Request) {
    const currentToken = (req.cookies as Record<string, string>)[COOKIE_NAME] ?? ''
    return this.authService.getSessions(user.id, user.role, currentToken)
  }

  @UseGuards(JwtGuard)
  @Delete('sessions/:tokenId')
  revokeSession(@CurrentUser() user: any, @Param('tokenId') tokenId: string, @Req() req: Request) {
    const currentToken = (req.cookies as Record<string, string>)[COOKIE_NAME] ?? ''
    return this.authService.revokeSession(user.id, user.role, tokenId, currentToken)
  }

  // ── CAMBIAR CONTRASEÑA ───────────────────────────────────────

  @UseGuards(JwtGuard)
  @Patch('change-password')
  changePassword(
    @CurrentUser() user: any,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @Req() req: Request,
  ) {
    const currentToken = (req.cookies as Record<string, string>)[COOKIE_NAME] ?? ''
    return this.authService.changePassword(
      user.id,
      user.role,
      currentPassword,
      newPassword,
      currentToken,
      req.ip,
      req.headers['user-agent'],
    )
  }
}
