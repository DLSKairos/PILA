import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { AIService } from '../ai/ai.service'
import { EmailService } from '../email/email.service'

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name)

  constructor(
    private prisma: PrismaService,
    private ai: AIService,
    private email: EmailService,
  ) {}

  async getWeeklyReports(trainerId: string) {
    return this.prisma.weeklyReport.findMany({
      where: { trainerId },
      orderBy: { weekStart: 'desc' },
      take: 12,
    })
  }

  async getReport(reportId: string) {
    return this.prisma.weeklyReport.findUnique({ where: { id: reportId } })
  }

  async getAICosts(trainerId: string) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const interactions = await this.prisma.aIInteraction.findMany({
      where: { trainerId, createdAt: { gte: startOfMonth } },
    })

    const totalCost = interactions.reduce((sum, i) => sum + i.costUsd, 0)
    const totalTokens = interactions.reduce((sum, i) => sum + i.inputTokens + i.outputTokens, 0)

    return {
      month: startOfMonth.toISOString().substring(0, 7),
      totalCostUsd: Math.round(totalCost * 10000) / 10000,
      totalTokens,
      byType: interactions.reduce(
        (acc, i) => {
          acc[i.type] = (acc[i.type] ?? 0) + i.costUsd
          return acc
        },
        {} as Record<string, number>,
      ),
    }
  }

  // ── AJUSTE 4 — Reporte ejecutivo para dashboard ───────────────

  async getLatestSummary(trainerId: string) {
    const today = new Date()
    const weekStart = new Date(today)
    // Inicio de la semana actual (lunes)
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
    weekStart.setDate(today.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)

    const clients = await this.prisma.client.findMany({
      where: { trainerId, isActive: true },
      select: {
        id: true,
        name: true,
        weeklyAdherence: {
          where: { weekStart: { gte: weekStart } },
          orderBy: { weekStart: 'desc' },
          take: 1,
        },
        dailyLogs: {
          where: {
            date: { gte: weekStart },
            workoutDone: false,
            isRestDay: false,
          },
          select: { id: true },
        },
      },
    })

    const totalClients = clients.length

    const clientStats = clients.map((c) => {
      const adherence = c.weeklyAdherence[0]?.overallAdherence ?? 0
      const daysMissed = c.dailyLogs.length
      return {
        clientId: c.id,
        name: c.name.split(' ')[0],
        adherence: Math.round(adherence),
        daysMissed,
      }
    })

    const avgAdherence =
      totalClients > 0
        ? Math.round(clientStats.reduce((sum, s) => sum + s.adherence, 0) / totalClients)
        : 0

    const topPerformer = clientStats.length > 0
      ? clientStats.reduce((best, s) => (s.adherence > best.adherence ? s : best))
      : null

    const needsAttention = clientStats
      .filter((s) => s.adherence < 50)
      .sort((a, b) => a.adherence - b.adherence)

    const aiCostRaw = await this.prisma.aIInteraction.aggregate({
      where: {
        trainerId,
        createdAt: { gte: weekStart },
      },
      _sum: { costUsd: true },
    })

    const aiCostThisWeek = Math.round((aiCostRaw._sum.costUsd ?? 0) * 10000) / 10000

    return {
      weekStart: weekStart.toISOString().substring(0, 10),
      totalClients,
      avgAdherence,
      topPerformer: topPerformer
        ? { clientId: topPerformer.clientId, name: topPerformer.name, adherence: topPerformer.adherence }
        : null,
      needsAttention: needsAttention.map((s) => ({
        clientId: s.clientId,
        name: s.name,
        adherence: s.adherence,
        daysMissed: s.daysMissed,
      })),
      aiCostThisWeek,
    }
  }

  // ── CRON: Reporte semanal — lunes 7:00 AM ─────────────────
  @Cron('0 7 * * 1')
  async generateWeeklyReports() {
    const trainers = await this.prisma.trainer.findMany({
      where: { isActive: true },
      include: { subscription: true, settings: true },
    })

    for (const trainer of trainers) {
      if (!trainer.settings?.enableWeeklyReports) continue
      if (!['TRIAL', 'ACTIVE'].includes(trainer.subscription?.status ?? '')) continue

      try {
        await this.generateReportForTrainer(trainer.id, trainer)
      } catch (err) {
        this.logger.error(`Error generando reporte para trainer ${trainer.id}`, err)
      }
    }
  }

  async generateReportForTrainer(trainerId: string, trainer?: any) {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 7)
    weekStart.setHours(0, 0, 0, 0)

    if (!trainer) {
      trainer = await this.prisma.trainer.findUnique({ where: { id: trainerId } })
    }

    const clients = await this.prisma.client.findMany({
      where: { trainerId, isActive: true },
      include: {
        weeklyAdherence: {
          where: { weekStart: { gte: weekStart } },
          orderBy: { weekStart: 'desc' },
          take: 1,
        },
        dailyLogs: {
          where: { date: { gte: weekStart } },
          orderBy: { date: 'desc' },
        },
        weightCheckins: {
          orderBy: { date: 'desc' },
          take: 2,
        },
      },
    })

    if (clients.length === 0) return null

    // Pre-calcular localmente — NO mandar logs crudos a la IA
    const summary = clients.map((c) => {
      const adherence = c.weeklyAdherence[0]
      const weightChange =
        c.weightCheckins.length >= 2
          ? c.weightCheckins[0].weight - c.weightCheckins[1].weight
          : 0
      const lastLog = c.dailyLogs[0]
      const streakCount = lastLog?.streakCount ?? 0

      return {
        name: c.name.split(' ')[0],
        nutritionAdherence: Math.round(adherence?.nutritionAdherence ?? 0),
        workoutAdherence: Math.round(adherence?.workoutAdherence ?? 0),
        overallAdherence: Math.round(adherence?.overallAdherence ?? 0),
        weightChange: Math.round(weightChange * 10) / 10,
        streakCount,
        status:
          (adherence?.overallAdherence ?? 0) >= 70
            ? 'verde'
            : (adherence?.overallAdherence ?? 0) >= 40
              ? 'amarillo'
              : 'rojo',
      }
    })

    const prompt = `Reporte semanal para entrenador. Clientes: ${JSON.stringify(summary)}.
Redacta un reporte narrativo breve en ${trainer.preferredLanguage === 'en' ? 'inglés' : 'español'}.
Máximo 300 palabras. Destaca logros y alertas.
Retorna JSON: { narrative: string, highlights: string[], alerts: string[] }`

    let aiReport: any
    try {
      const raw = await this.ai.callAI(prompt, 1024)
      aiReport = JSON.parse(raw)
    } catch {
      aiReport = { narrative: 'Reporte generado automáticamente.', highlights: [], alerts: [] }
    }

    const report = await this.prisma.weeklyReport.create({
      data: {
        trainerId,
        weekStart,
        content: { clients: summary, ai: aiReport },
        deliveredAt: new Date(),
      },
    })

    // Enviar por email
    const htmlContent = `
      <h3>${aiReport.narrative}</h3>
      ${aiReport.highlights?.length ? `<h4>Logros</h4><ul>${aiReport.highlights.map((h: string) => `<li>${h}</li>`).join('')}</ul>` : ''}
      ${aiReport.alerts?.length ? `<h4>Alertas</h4><ul>${aiReport.alerts.map((a: string) => `<li>${a}</li>`).join('')}</ul>` : ''}
    `
    await this.email.sendWeeklyReport(trainer.email, trainer.name, htmlContent, trainer.preferredLanguage)

    this.logger.log(`Reporte semanal generado para trainer ${trainerId}`)
    return report
  }
}
