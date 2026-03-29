import { Injectable, Logger } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'

const AI_SYSTEM_PROMPT = `Responde ÚNICAMENTE con JSON válido. Sin texto antes ni después. Sin markdown. Sin bloques de código. Sin explicaciones.`

@Injectable()
export class AIService {
  private client: Anthropic
  private readonly logger = new Logger(AIService.name)
  private readonly model: string

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.client = new Anthropic({ apiKey: config.get('ANTHROPIC_API_KEY') })
    this.model = config.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-20250514'
  }

  async callAI(prompt: string, maxTokens = 4096): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const costUsd = (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15

    this.logger.log(`AI call: ${inputTokens} in / ${outputTokens} out / $${costUsd.toFixed(6)}`)

    return (response.content[0] as any).text
  }

  async generateNutritionPlan(clientData: {
    name: string
    goal: string
    targetCalories: number
    targetProtein: number
    targetCarbs: number
    targetFat: number
    mealsPerDay: number
    restrictions: string[]
    dietaryStyle?: string
  }): Promise<any> {
    const prompt = `Plan alimentación JSON. Cliente: ${JSON.stringify(clientData)}.
Genera ${clientData.mealsPerDay} comidas distribuidas en el día.
Retorna: { meals: [{ mealType, order, foodName, quantity, unit, calories, protein, carbs, fat, recipe }] }
Las calorías totales deben ser ±5% de ${clientData.targetCalories}kcal.`

    const raw = await this.callAI(prompt)
    return JSON.parse(raw)
  }

  async generateWorkoutPlan(clientData: {
    name: string
    goal: string
    daysPerWeek: number
    sessionDuration: number
    activityLevel: string
    hasGymAccess: boolean
    injuries: string[]
  }): Promise<any> {
    const prompt = `Plan entrenamiento JSON. Cliente: ${JSON.stringify(clientData)}.
Retorna: { days: [{ dayOfWeek, isRestDay, exercises: [{ order, name, muscleGroup, sets, reps, restSeconds, weightSuggestion, notes }] }] }`

    const raw = await this.callAI(prompt)
    return JSON.parse(raw)
  }

  async generateSubstitution(foodName: string, reason: string, macros: any): Promise<any> {
    const prompt = `Sustituye "${foodName}" (${reason}). Macros objetivo: ${JSON.stringify(macros)}.
Retorna: { substituteFoodName, substituteQuantity, substituteUnit, substituteCalories, substituteProtein, substituteCarbs, substituteFat }`

    const raw = await this.callAI(prompt, 512)
    return JSON.parse(raw)
  }

  async generateOnboardingReply(messages: Array<{ role: string; content: string }>, turnCount: number): Promise<string> {
    const isLast = turnCount >= 5

    const systemContext = `Eres el asistente de onboarding de PILA, un app de entrenamiento personalizado.
Tu objetivo es conocer la motivación del cliente en máximo 6 turnos.
Pregunta sobre: objetivo principal, obstáculos anteriores, motivación real, disponibilidad, expectativas.
${isLast ? 'Este es el último turno. Resume lo que aprendiste y despídete amablemente.' : `Turno ${turnCount + 1} de 6.`}
Responde en el mismo idioma del usuario. Sé empático y breve.`

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 512,
      system: systemContext,
      messages: messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    return (response.content[0] as any).text
  }

  async generateMotivationSummary(messages: Array<{ role: string; content: string }>): Promise<any> {
    const conversation = messages.map((m) => `${m.role}: ${m.content}`).join('\n')
    const prompt = `Analiza esta conversación de onboarding y extrae:
${conversation}

Retorna JSON: { motivationType: "intrinsic"|"extrinsic", mainObstacle, previousAttempts, aiSummary }`

    const raw = await this.callAI(prompt, 1024)
    return JSON.parse(raw)
  }
}
