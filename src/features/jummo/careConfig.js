export const CARE_CONFIG = {
  defaults: { mood: 80, fullness: 40, cleanliness: 80, energy: 80 },
  decayPeriodMs: 30 * 60 * 1000,
  decay: { mood: 4, fullness: 5, cleanliness: 3, energy: 5 },
  moodReward: { amount: 2, periodMs: 10 * 1000 },
  sleepReward: { amount: 5, periodMs: 60 * 1000 },
  happyActivities: ['reading', 'dancing', 'listening', 'stargazing'],
  defaultNutrition: 20,
  bathReward: 40,
  offlineCap: 30,
  refreshMs: 1000,
  saveEveryMs: 15000,
}
