export function evaluateDayForStreak(params: {
  nutritionDone: boolean
  workoutDone: boolean
  isRestDay: boolean
}): boolean {
  const { nutritionDone, workoutDone, isRestDay } = params
  if (isRestDay) return nutritionDone
  return nutritionDone && workoutDone
}
