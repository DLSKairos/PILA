export function calculateTDEE(params: {
  weight: number
  height: number
  age: number
  sex: 'male' | 'female'
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE'
}): number {
  const { weight, height, age, sex, activityLevel } = params

  const bmr =
    sex === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161

  const multipliers = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725,
  }

  return Math.round(bmr * multipliers[activityLevel])
}
