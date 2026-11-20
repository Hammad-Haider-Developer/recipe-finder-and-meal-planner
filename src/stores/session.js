import { useRecipeStore } from './recipeStore'
import { usePlannerStore } from './plannerStore'
import { seedDemoData } from '../utils/demoData'

// Loads / clears every per-user store in one place so the router guard,
// the auth store and the multi-tab sync all behave the same way.

export function loadUserData(userId) {
  if (!userId) return
  seedDemoData(userId)
  useRecipeStore().init(userId)
  usePlannerStore().init(userId)
}

export function clearUserData() {
  useRecipeStore().reset()
  usePlannerStore().reset()
}
