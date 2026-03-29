export function calculateMacros(params: {
  targetCalories: number
  goal: 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'DEFINE' | 'ENDURANCE' | 'MAINTENANCE'
  weight: number
}): { protein: number; carbs: number; fat: number } {
  const { targetCalories, goal } = params

  const distributions = {
    LOSE_WEIGHT: { protein: 0.4, carbs: 0.3, fat: 0.3 },
    GAIN_MUSCLE: { protein: 0.3, carbs: 0.5, fat: 0.2 },
    DEFINE: { protein: 0.4, carbs: 0.35, fat: 0.25 },
    ENDURANCE: { protein: 0.25, carbs: 0.55, fat: 0.2 },
    MAINTENANCE: { protein: 0.3, carbs: 0.45, fat: 0.25 },
  }

  const dist = distributions[goal]
  return {
    protein: Math.round((targetCalories * dist.protein) / 4),
    carbs: Math.round((targetCalories * dist.carbs) / 4),
    fat: Math.round((targetCalories * dist.fat) / 9),
  }
}

export function calculateTargetCalories(tdee: number, goal: string): number {
  const adjustments: Record<string, number> = {
    LOSE_WEIGHT: -500,
    GAIN_MUSCLE: 300,
    DEFINE: -250,
    ENDURANCE: 100,
    MAINTENANCE: 0,
  }
  return Math.round(tdee + (adjustments[goal] ?? 0))
}
