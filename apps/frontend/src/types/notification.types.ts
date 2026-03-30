export type NotificationType = 'MEAL_REMINDER' | 'WATER_REMINDER' | 'GYM_REMINDER' | 'STREAK_MILESTONE' | 'PLAN_CHANGE' | 'CHAT_MESSAGE' | 'WEEKLY_REPORT'

export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  platform: 'ios' | 'android' | 'desktop'
  userAgent: string
}
