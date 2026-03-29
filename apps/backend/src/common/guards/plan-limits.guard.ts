import { Injectable } from '@nestjs/common'

export const PLAN_LIMITS = {
  STARTER: {
    maxClients: 10,
    aiPlansPerMonth: 5,
    leaderboard: false,
    voiceMode: false,
    weeklyReports: false,
    customBranding: false,
    gymMotivationAI: false,
  },
  PRO: {
    maxClients: 40,
    aiPlansPerMonth: 15,
    leaderboard: true,
    voiceMode: true,
    weeklyReports: true,
    customBranding: false,
    gymMotivationAI: true,
  },
  ELITE: {
    maxClients: Infinity,
    aiPlansPerMonth: Infinity,
    leaderboard: true,
    voiceMode: true,
    weeklyReports: true,
    customBranding: true,
    gymMotivationAI: true,
  },
} as const
