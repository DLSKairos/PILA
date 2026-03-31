import {
  Controller, Post, Body, Get, Delete, Patch,
  Param, Req, Res, UseGuards,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { RegisterTrainerDto } from './dto/register-trainer.dto'
import { LoginDto } from './dto/login.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

const COOKIE_NAME = 'refreshToken'
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('trainer/register')
  async registerTrainer(
    @Body() dto: RegisterTrainerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerTrainer(dto)
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS)
    return { accessToken: result.accessToken, user: result.user }
  }

  @Post('trainer/login')
  async loginTrainer(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginTrainer(dto)
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS)
    return { accessToken: result.accessToken, user: result.user }
  }

  @Post('client/login')
  async loginClient(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginClient(dto)
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS)
    return { accessToken: result.accessToken, user: result.user }
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string>)[COOKIE_NAME]
    const result = await this.authService.refresh(token)
    res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTS)
    return { accessToken: result.accessToken, user: result.user }
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = (req.cookies as Record<string, string>)[COOKIE_NAME]
    await this.authService.logout(token)
    res.clearCookie(COOKIE_NAME, { path: '/' })
    return { ok: true }
  }

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

  // ── AJUSTE 1 — Sesiones activas ──────────────────────────────

  @UseGuards(JwtGuard)
  @Get('sessions')
  getSessions(@CurrentUser() user: any, @Req() req: Request) {
    const currentToken = (req.cookies as Record<string, string>)[COOKIE_NAME] ?? ''
    return this.authService.getSessions(user.id, user.role, currentToken)
  }

  @UseGuards(JwtGuard)
  @Delete('sessions/:tokenId')
  revokeSession(
    @CurrentUser() user: any,
    @Param('tokenId') tokenId: string,
    @Req() req: Request,
  ) {
    const currentToken = (req.cookies as Record<string, string>)[COOKIE_NAME] ?? ''
    return this.authService.revokeSession(user.id, user.role, tokenId, currentToken)
  }

  // ── AJUSTE 2 — Cambiar contraseña ────────────────────────────

  @UseGuards(JwtGuard)
  @Patch('change-password')
  changePassword(
    @CurrentUser() user: any,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @Req() req: Request,
  ) {
    const currentToken = (req.cookies as Record<string, string>)[COOKIE_NAME] ?? ''
    const ipAddress = req.ip as string | undefined
    const userAgent = req.headers['user-agent'] as string | undefined
    return this.authService.changePassword(
      user.id,
      user.role,
      currentPassword,
      newPassword,
      currentToken,
      ipAddress,
      userAgent,
    )
  }
}
