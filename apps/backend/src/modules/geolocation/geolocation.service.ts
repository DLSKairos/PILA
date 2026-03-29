import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { calculateDistance } from '../../common/utils/distance.calculator'

const GYM_MOTIVATION_TEMPLATES = {
  es: [
    '{name}, llevas {streak} días seguidos. Dale todo hoy',
    '{name} en la casa. Día {streak} de racha. Tu cuerpo ya sabe lo que tiene que hacer.',
    '{streak} días, {name}. Eso no es suerte, eso es disciplina.',
    'Llegaste, {name}. Eso ya es el 50%. El otro 50% está adentro.',
  ],
  en: [
    '{name}, {streak} days in a row. Give it everything today.',
    '{name} is here. Day {streak}. Your body already knows what to do.',
    '{streak} days, {name}. That is not luck, that is discipline.',
    'You showed up, {name}. That is already 50%. The other 50% is inside.',
  ],
}

@Injectable()
export class GeolocationService {
  constructor(private prisma: PrismaService) {}

  async checkProximity(clientId: string, latitude: number, longitude: number) {
    const gyms = await this.prisma.clientGym.findMany({
      where: { clientId, isActive: true },
    })

    for (const gym of gyms) {
      const distance = calculateDistance(latitude, longitude, gym.latitude, gym.longitude)
      if (distance <= gym.radiusMeters) {
        const lastLog = await this.prisma.dailyLog.findFirst({
          where: { clientId },
          orderBy: { date: 'desc' },
        })
        const streak = lastLog?.streakCount ?? 0
        const client = await this.prisma.client.findUnique({ where: { id: clientId } })
        const lang = client?.preferredLanguage ?? 'es'

        const templates = GYM_MOTIVATION_TEMPLATES[lang] ?? GYM_MOTIVATION_TEMPLATES.es
        const template = templates[Math.floor(Math.random() * templates.length)]
        const message = template
          .replace('{name}', client!.name.split(' ')[0])
          .replace('{streak}', String(streak))

        return { nearGym: true, gym, message }
      }
    }

    return { nearGym: false }
  }
}
