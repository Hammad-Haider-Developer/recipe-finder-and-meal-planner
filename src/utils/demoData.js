import { readJSON, writeJSON } from './storage'
import { uid, toISODate, addDays, startOfWeek } from './helpers'

export const DEMO_USER_ID = 'u_demo'

// [dayIndex (0 = Monday), mealType, recipeId, servings]
const DEMO_PLAN = [
  [0, 'breakfast', 'r1', 4], [0, 'lunch', 'r6', 2], [0, 'dinner', 'r12', 4],
  [1, 'breakfast', 'r4', 2], [1, 'lunch', 'r7', 4], [1, 'dinner', 'r11', 2],
  [2, 'breakfast', 'r3', 2], [2, 'lunch', 'r5', 2], [2, 'dinner', 'r10', 2],
  [3, 'breakfast', 'r2', 4], [3, 'lunch', 'r8', 4], [3, 'dinner', 'r9', 6],
  [4, 'breakfast', 'r20', 2], [4, 'dinner', 'r14', 4],
  [5, 'breakfast', 'r1', 4], [5, 'lunch', 'r19', 4], [5, 'dinner', 'r15', 4],
]

const DEMO_FAVORITES = ['r12', 'r9', 'r1', 'r16', 'r11', 'r7', 'r5', 'r2']

/**
 * The demo account gets a few favourites and a plan for the current week the
 * first time it is used, so the dashboard and planner look alive straight away.
 * Real users that sign up start with an empty plan.
 */
export function seedDemoData(userId) {
  if (userId !== DEMO_USER_ID) return
  const flag = `recipes:${userId}:seeded`
  if (readJSON(flag, false)) return

  const monday = startOfWeek()
  const plan = DEMO_PLAN.map(([day, mealType, recipeId, servings]) => ({
    id: uid('m'),
    recipeId,
    date: toISODate(addDays(monday, day)),
    mealType,
    servings,
  }))
  writeJSON(`recipes:${userId}:plan`, plan)
  writeJSON(`recipes:${userId}:favorites`, DEMO_FAVORITES)
  writeJSON(flag, true)
}
