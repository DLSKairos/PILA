import { Controller, Post, Body, Get, Delete, Param, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterTrainerDto } from './dto/register-trainer.dto'
import { LoginDto } from './dto/login.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

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
}
