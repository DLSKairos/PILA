import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ConfigService } from '@nestjs/config'
import * as webpush from 'web-push'
import { PrismaService } from '../../prisma/prisma.service'
import { EmailService } from '../email/email.service'
import { evaluateDayForStreak } from '../../common/utils/streak.calculator'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private config: ConfigService,
  ) {
    webpush.setVapidDetails(
      config.get('VAPID_EMAIL') ?? 'mailto:admin@pila.app',
      config.get('VAPID_PUBLIC_KEY') ?? '',
      config.get('VAPID_PRIVATE_KEY') ?? '',
    )
  }

  // ── Push subscription ─────────────────────────────────────

  async subscribe(clientId: string, deviceInfo: any, subscription: any) {
    const device = await this.prisma.clientDevice.create({
      data: {
        clientId,
        deviceType: deviceInfo.deviceType ?? 'mobile',
        platform: deviceInfo.platform ?? 'web',
        userAgent: deviceInfo.userAgent,
      },
    })

    await this.prisma.pushSubscription.create({
      data: {
        deviceId: device.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })

    return { subscribed: true }
  }

  async unsubscribe(clientId: string, endpoint: string) {
    const sub = await this.prisma.pushSubscription.findUnique({ where: { endpoint } })
    if (sub) {
      await this.prisma.pushSubscription.delete({ where: { endpoint } })
      await this.prisma.clientDevice.deleteMany({ where: { id: sub.deviceId } })
    }
  }

  async sendPushToClient(clientId: string, title: string, body: string, data?: object) {
    const devices = await this.prisma.clientDevice.findMany({
      where: { clientId, isActive: true },
      include: { pushSubscription: true },
    })

    const payload = JSON.stringify({ title, body, data })

    for (const device of devices) {
      if (!device.pushSubscription) continue
      try {
        await webpush.sendNotification(
          {
            endpoint: device.pushSubscription.endpoint,
            keys: {
              p256dh: device.pushSubscription.p256dh,
              auth: device.pushSubscription.auth,
            },
          },
          payload,
        )
      } catch (err: any) {
        if (err.statusCode === 410) {
          await this.prisma.pushSubscription.delete({
            where: { endpoint: device.pushSubscription.endpoint },
          })
        }
      }
    }
  }

  // ── CRON 1: Meal reminders — cada hora ────────────────────
  @Cron('0 * * * *')
  async checkMealReminders() {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const profiles = await this.prisma.clientProfile.findMany({
      where: {
        client: { isActive: true },
        OR: [
          { breakfastTime: timeStr },
          { morningSnackTime: timeStr },
          { lunchTime: timeStr },
          { afternoonSnackTime: timeStr },
          { dinnerTime: timeStr },
        ],
      },
      include: {
        client: {
          include: { notificationSettings: true },
        },
      },
    })

    for (const profile of profiles) {
      if (!profile.client.notificationSettings?.mealReminders) continue

      let mealKey = ''
      if (profile.breakfastTime === timeStr) mealKey = 'meal.breakfast'
      else if (profile.morningSnackTime === timeStr) mealKey = 'meal.morning_snack'
      else if (profile.lunchTime === timeStr) mealKey = 'meal.lunch'
      else if (profile.afternoonSnackTime === timeStr) mealKey = 'meal.afternoon_snack'
      else if (profile.dinnerTime === timeStr) mealKey = 'meal.dinner'

      if (mealKey) {
        const messages: Record<string, string> = {
          'meal.breakfast': 'Es hora de tu desayuno',
          'meal.morning_snack': 'Es hora de tu media mañana',
          'meal.lunch': 'Es hora de tu almuerzo',
          'meal.afternoon_snack': 'Es hora de tu merienda',
          'meal.dinner': 'Es hora de tu cena',
        }
        await this.sendPushToClient(profile.clientId, 'PILA 🍽️', messages[mealKey])
      }
    }
  }

  // ── CRON 2: Water reminders — cada hora ───────────────────
  @Cron('0 * * * *')
  async checkWaterReminders() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const clients = await this.prisma.client.findMany({
      where: { isActive: true },
      include: { notificationSettings: true },
    })

    for (const client of clients) {
      if (!client.notificationSettings?.waterReminders) continue

      const lastWater = await this.prisma.waterLog.findFirst({
        where: { dailyLog: { clientId: client.id, date: { gte: today } } },
        orderBy: { loggedAt: 'desc' },
      })

      if (!lastWater || lastWater.loggedAt < twoHoursAgo) {
        await this.sendPushToClient(client.id, 'PILA 💧', 'Recuerda tomar agua')
      }
    }
  }

  // ── CRON 3: Evaluar racha — cada día a las 23:59 ──────────
  @Cron('59 23 * * *')
  async evaluateDailyStreaks() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const logs = await this.prisma.dailyLog.findMany({
      where: { date: today },
      include: { client: { include: { notificationSettings: true } } },
    })

    for (const log of logs) {
      const streakOk = evaluateDayForStreak({
        nutritionDone: log.nutritionDone,
        workoutDone: log.workoutDone,
        isRestDay: log.isRestDay,
      })

      const prevLog = await this.prisma.dailyLog.findFirst({
        where: { clientId: log.clientId, date: { lt: today } },
        orderBy: { date: 'desc' },
      })

      const prevStreak = prevLog?.streakCount ?? 0
      const newStreak = streakOk ? prevStreak + 1 : 0

      await this.prisma.dailyLog.update({
        where: { id: log.id },
        data: { streakCount: newStreak, streakActive: streakOk },
      })

      if (!streakOk && prevStreak > 0) {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        await this.prisma.streakHistory.create({
          data: {
            clientId: log.clientId,
            startDate: new Date(today.getTime() - prevStreak * 86400000),
            endDate: yesterday,
            days: prevStreak,
            brokenBy: !log.nutritionDone ? 'nutrition' : 'workout',
          },
        })

        if (log.client.notificationSettings?.streakAlerts) {
          await this.sendPushToClient(
            log.clientId,
            'PILA 😔',
            `Tu racha de ${prevStreak} días se rompió. ¡Mañana es un nuevo comienzo!`,
          )
        }
      }

      // Hitos de racha: 7, 14, 30, 60, 100 días
      if (streakOk && [7, 14, 30, 60, 100].includes(newStreak)) {
        const client = await this.prisma.client.findUnique({ where: { id: log.clientId } })
        if (client) {
          await this.email.sendStreakMilestone(client.email, client.name, newStreak, client.preferredLanguage)
          await this.sendPushToClient(log.clientId, `¡${newStreak} días de racha! 🔥`, '¡Increíble constancia!')
        }
      }
    }
    this.logger.log(`Rachas evaluadas: ${logs.length} logs procesados`)
  }

  // ── CRON 4: Check-in fotográfico — domingos 18:00 ─────────
  @Cron('0 18 * * 0')
  async sendWeeklyCheckinReminder() {
    const clients = await this.prisma.client.findMany({
      where: { isActive: true },
      include: { notificationSettings: true },
    })

    for (const client of clients) {
      if (!client.notificationSettings?.planUpdates) continue
      await this.sendPushToClient(
        client.id,
        'PILA 📸',
        'Es domingo — tómate tu foto de progreso semanal',
      )
    }
    this.logger.log(`Recordatorio check-in enviado a ${clients.length} clientes`)
  }

  // ── CRON 5: Calcular adherencia semanal — domingos 23:50 ──
  @Cron('50 23 * * 0')
  async calculateWeeklyAdherence() {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)

    const clients = await this.prisma.client.findMany({ where: { isActive: true } })

    for (const client of clients) {
      const logs = await this.prisma.dailyLog.findMany({
        where: { clientId: client.id, date: { gte: weekStart, lte: today } },
      })

      if (logs.length === 0) continue

      const nutritionDays = logs.filter((l) => l.nutritionDone || l.isRestDay).length
      const workoutDays = logs.filter((l) => l.workoutDone || l.isRestDay).length
      const expectedDays = 7

      const nutritionAdherence = (nutritionDays / expectedDays) * 100
      const workoutAdherence = (workoutDays / expectedDays) * 100
      const overallAdherence = (nutritionAdherence + workoutAdherence) / 2

      await this.prisma.weeklyAdherence.upsert({
        where: { clientId_weekStart: { clientId: client.id, weekStart } },
        create: {
          clientId: client.id,
          weekStart,
          nutritionAdherence,
          workoutAdherence,
          overallAdherence,
          daysCompleted: logs.filter((l) => l.nutritionDone && (l.workoutDone || l.isRestDay)).length,
          daysExpected: expectedDays,
        },
        update: { nutritionAdherence, workoutAdherence, overallAdherence },
      })
    }
    this.logger.log(`Adherencia semanal calculada para ${clients.length} clientes`)
  }

  // ── CRON 6: Aviso vencimiento trial — diario 9:00 ─────────
  @Cron('0 9 * * *')
  async checkTrialExpiring() {
    const in3days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const expiring = await this.prisma.trainerSubscription.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: { gte: tomorrow, lte: in3days },
      },
      include: { trainer: true },
    })

    for (const sub of expiring) {
      const daysLeft = Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000)
      await this.email.sendTrialExpiring(
        sub.trainer.email,
        sub.trainer.name,
        daysLeft,
        sub.trainer.preferredLanguage,
      )
    }
  }

  // ── CRON 7: Mantenimiento nocturno — diario 2:00 ──────────
  @Cron('0 2 * * *')
  async nightlyMaintenance() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const [expiredTokens, oldNotifications, oldLogs] = await Promise.all([
      this.prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.scheduledNotification.deleteMany({
        where: { sentAt: { lt: thirtyDaysAgo } },
      }),
      this.prisma.systemLog.deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } }),
    ])

    this.logger.log(
      `Mantenimiento: ${expiredTokens.count} tokens, ${oldNotifications.count} notifs, ${oldLogs.count} logs eliminados`,
    )
  }

  // ── CRON 8: Reset rate limits IA — primer día del mes ─────
  @Cron('0 0 1 * *')
  async resetAIRateLimits() {
    await this.prisma.aIRateLimit.deleteMany()
    this.logger.log('Rate limits de IA reseteados para el nuevo mes')
  }

  // ── CRON 9: Streak at risk — diario 20:00 ─────────────────
  @Cron('0 20 * * *')
  async checkStreakAtRisk() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const clientsAtRisk = await this.prisma.dailyLog.findMany({
      where: {
        date: today,
        streakActive: false,
        streakCount: { gt: 0 },
        client: { isActive: true },
      },
      include: { client: { include: { notificationSettings: true } } },
    })

    for (const log of clientsAtRisk) {
      if (!log.client.notificationSettings?.streakAlerts) continue
      await this.sendPushToClient(
        log.clientId,
        'PILA ⚠️',
        `Tu racha de ${log.streakCount} días está en riesgo. ¡Registra hoy!`,
      )
    }
  }
}
