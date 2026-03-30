import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@UseGuards(JwtGuard, RolesGuard)
@Roles('TRAINER')
@Controller('trainer/reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('weekly')
  getWeeklyReports(@CurrentUser() user: any) {
    return this.reportsService.getWeeklyReports(user.id)
  }

  @Get('weekly/:id')
  getReport(@Param('id') id: string) {
    return this.reportsService.getReport(id)
  }

  @Get('costs')
  getAICosts(@CurrentUser() user: any) {
    return this.reportsService.getAICosts(user.id)
  }

  // ── AJUSTE 4 — Reporte ejecutivo para dashboard ───────────────

  @Get('latest')
  getLatestSummary(@CurrentUser() user: any) {
    return this.reportsService.getLatestSummary(user.id)
  }
}
