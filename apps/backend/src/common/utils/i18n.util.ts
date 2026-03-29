const messages: Record<string, Record<string, string>> = {
  es: {
    'meal.breakfast': 'Es hora de tu desayuno',
    'meal.morning_snack': 'Es hora de tu media mañana',
    'meal.lunch': 'Es hora de tu almuerzo',
    'meal.afternoon_snack': 'Es hora de tu merienda',
    'meal.dinner': 'Es hora de tu cena',
    'water.reminder': 'Recuerda tomar agua ({current}/{goal} vasos)',
    'gym.proximity': '¡Llegaste al gym! Presiona para iniciar tu sesión',
    'streak.risk': 'Tu racha de {days} días está en riesgo',
    'plan.updated': 'Tu entrenador actualizó tu plan',
    'checkin.reminder': 'Es domingo — tómate tu foto de progreso',
    'trainer.message': 'Tienes un mensaje de tu entrenador',
  },
  en: {
    'meal.breakfast': 'Time for breakfast',
    'meal.morning_snack': 'Morning snack time',
    'meal.lunch': 'Lunch time',
    'meal.afternoon_snack': 'Afternoon snack time',
    'meal.dinner': 'Dinner time',
    'water.reminder': 'Remember to drink water ({current}/{goal} glasses)',
    'gym.proximity': "You're at the gym! Tap to start your session",
    'streak.risk': 'Your {days}-day streak is at risk',
    'plan.updated': 'Your trainer updated your plan',
    'checkin.reminder': "It's Sunday — take your progress photo",
    'trainer.message': 'You have a message from your trainer',
  },
}

export function t(
  key: string,
  lang = 'es',
  params?: Record<string, string | number>,
): string {
  let msg = messages[lang]?.[key] ?? messages['es'][key] ?? key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      msg = msg.replace(`{${k}}`, String(v))
    })
  }
  return msg
}
