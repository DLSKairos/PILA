import {
  Controller, Post, Body, Get, Delete, Patch,
  Param, Req, UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterTrainerDto } from './dto/register-trainer.dto'
import { LoginDto } from './dto/login.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('trainer/register')
  registerTrainer(@Body() dto: RegisterTrainerDto) {
    return this.authService.registerTrainer(dto)
  }

  @Post('trainer/login')
  loginTrainer(@Body() dto: LoginDto) {
    return this.authService.loginTrainer(dto)
  }

  @Post('client/login')
  loginClient(@Body() dto: LoginDto) {
    return this.authService.loginClient(dto)
  }

  @Post('refresh')
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refresh(token)
  }

  @Post('logout')
  logout(@Body('refreshToken') token: string) {
    return this.authService.logout(token)
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email)
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password)
  }

  // ── AJUSTE 1 — Sesiones activas ──────────────────────────────

  @UseGuards(JwtGuard)
  @Get('sessions')
  getSessions(@CurrentUser() user: any, @Req() req: any) {
    const currentToken = (req.headers['x-refresh-token'] as string) ?? ''
    return this.authService.getSessions(user.id, user.role, currentToken)
  }

  @UseGuards(JwtGuard)
  @Delete('sessions/:tokenId')
  revokeSession(
    @CurrentUser() user: any,
    @Param('tokenId') tokenId: string,
    @Req() req: any,
  ) {
    const currentToken = (req.headers['x-refresh-token'] as string) ?? ''
    return this.authService.revokeSession(user.id, user.role, tokenId, currentToken)
  }

  // ── AJUSTE 2 — Cambiar contraseña ────────────────────────────

  @UseGuards(JwtGuard)
  @Patch('change-password')
  changePassword(
    @CurrentUser() user: any,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @Req() req: any,
  ) {
    const currentToken = (req.headers['x-refresh-token'] as string) ?? ''
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
