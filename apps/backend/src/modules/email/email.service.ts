import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter
  private readonly logger = new Logger(EmailService.name)

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('EMAIL_HOST'),
      port: config.get<number>('EMAIL_PORT'),
      secure: false,
      auth: {
        user: config.get('EMAIL_USER'),
        pass: config.get('EMAIL_PASS'),
      },
    })
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.config.get('EMAIL_FROM'),
        to,
        subject,
        html,
      })
      this.logger.log(`Email enviado a ${to}: ${subject}`)
    } catch (error) {
      this.logger.error(`Error enviando email a ${to}`, error)
    }
  }

  async sendWelcomeTrainer(to: string, name: string, lang = 'es') {
    const subjects = { es: '¡Bienvenido a PILA! 💪', en: 'Welcome to PILA! 💪' }
    const html = lang === 'en'
      ? `<h2>Welcome, ${name}!</h2><p>Your PILA account is ready. You have a <strong>15-day free trial</strong> to explore all features.</p><p>Start by adding your first client from your dashboard.</p>`
      : `<h2>¡Hola, ${name}!</h2><p>Tu cuenta de PILA está lista. Tienes <strong>15 días de prueba gratuita</strong> para explorar todas las funciones.</p><p>Empieza agregando tu primer cliente desde tu dashboard.</p>`
    await this.send(to, subjects[lang] ?? subjects.es, html)
  }

  async sendClientInvitation(to: string, trainerName: string, token: string, lang = 'es') {
    const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:5173'
    const link = `${frontendUrl}/activate?token=${token}`
    const subjects = { es: `${trainerName} te invitó a PILA 💪`, en: `${trainerName} invited you to PILA 💪` }
    const html = lang === 'en'
      ? `<h2>You have been invited!</h2><p><strong>${trainerName}</strong> has added you as their client on PILA.</p><p><a href="${link}" style="background:#FF5C00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Activate my account</a></p><p style="color:#999;font-size:12px;">Link expires in 7 days.</p>`
      : `<h2>¡Tienes una invitación!</h2><p><strong>${trainerName}</strong> te ha agregado como su cliente en PILA.</p><p><a href="${link}" style="background:#FF5C00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Activar mi cuenta</a></p><p style="color:#999;font-size:12px;">El link vence en 7 días.</p>`
    await this.send(to, subjects[lang] ?? subjects.es, html)
  }

  async sendResetPassword(to: string, token: string, lang = 'es') {
    const frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:5173'
    const link = `${frontendUrl}/reset-password?token=${token}`
    const subjects = { es: 'Recupera tu contraseña de PILA', en: 'Reset your PILA password' }
    const html = lang === 'en'
      ? `<h2>Password reset</h2><p>Click the link below to set a new password. It expires in 1 hour.</p><p><a href="${link}" style="background:#FF5C00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Reset password</a></p>`
      : `<h2>Recupera tu contraseña</h2><p>Haz clic en el siguiente enlace para establecer una nueva contraseña. Vence en 1 hora.</p><p><a href="${link}" style="background:#FF5C00;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Cambiar contraseña</a></p>`
    await this.send(to, subjects[lang] ?? subjects.es, html)
  }

  async sendTrialExpiring(to: string, name: string, daysLeft: number, lang = 'es') {
    const subjects = { es: `Tu prueba de PILA vence en ${daysLeft} días`, en: `Your PILA trial expires in ${daysLeft} days` }
    const html = lang === 'en'
      ? `<h2>Hi ${name},</h2><p>Your free trial expires in <strong>${daysLeft} days</strong>. Upgrade your plan to keep access to all your clients.</p>`
      : `<h2>Hola ${name},</h2><p>Tu prueba gratuita vence en <strong>${daysLeft} días</strong>. Actualiza tu plan para mantener acceso a todos tus clientes.</p>`
    await this.send(to, subjects[lang] ?? subjects.es, html)
  }

  async sendStreakMilestone(to: string, name: string, days: number, lang = 'es') {
    const subjects = { es: `¡${days} días de racha en PILA! 🔥`, en: `${days}-day streak on PILA! 🔥` }
    const html = lang === 'en'
      ? `<h2>Amazing, ${name}!</h2><p>You've completed <strong>${days} consecutive days</strong> on PILA. Keep it up!</p>`
      : `<h2>¡Increíble, ${name}!</h2><p>Llevas <strong>${days} días consecutivos</strong> en PILA. ¡Sigue así!</p>`
    await this.send(to, subjects[lang] ?? subjects.es, html)
  }

  async sendWeeklyReport(to: string, name: string, reportSummary: string, lang = 'es') {
    const subjects = { es: 'Tu reporte semanal de PILA 📊', en: 'Your weekly PILA report 📊' }
    const html = lang === 'en'
      ? `<h2>Weekly report for ${name}</h2>${reportSummary}`
      : `<h2>Reporte semanal de ${name}</h2>${reportSummary}`
    await this.send(to, subjects[lang] ?? subjects.es, html)
  }
}
