import { defineStore } from 'pinia'
import { readJSON, writeJSON } from '../utils/storage'
import { MEAL_ORDER, MEAL_TYPES, uid, toISODate, addDays, weekStartISO, parseISODate } from '../utils/helpers'
import { combineIngredients } from '../utils/ingredients'
import { useRecipeStore } from './recipeStore'

// Weekly meal planner store. Per-user data lives in localStorage under:
//   recipes:<userId>:plan     planned meals  { id, recipeId, date, mealType, servings }
//   recipes:<userId>:checked  ticked shopping-list items "<weekStart>|<ingredientKey>"

const key = (userId, name) => `recipes:${userId}:${name}`

export const usePlannerStore = defineStore('planner', {
  state: () => ({
    userId: null,
    mealPlan: [],
    checkedItems: [],
  }),

  getters: {
    /** Every planned meal with its recipe attached, ordered by date then meal type. */
    plannedMeals(state) {
      const recipes = useRecipeStore()
      return state.mealPlan
        .map((m) => ({ ...m, recipe: recipes.getRecipeById(m.recipeId) }))
        .filter((m) => m.recipe)
        .sort((a, b) => a.date.localeCompare(b.date) || MEAL_ORDER[a.mealType] - MEAL_ORDER[b.mealType])
    },

    mealsForWeek() {
      return (weekStart) => {
        const end = toISODate(addDays(parseISODate(weekStart), 6))
        return this.plannedMeals.filter((m) => m.date >= weekStart && m.date <= end)
      }
    },

    /** Combined ingredient list for a week - quantities are scaled by the planned servings. */
    shoppingList() {
      return (weekStart) => combineIngredients(this.mealsForWeek(weekStart))
    },

    checkedForWeek: (state) => (weekStart) =>
      state.checkedItems.filter((k) => k.startsWith(weekStart + '|')).map((k) => k.slice(weekStart.length + 1)),

    hasDuplicate: (state) => ({ recipeId, date, mealType }, ignoreId = null) =>
      state.mealPlan.some((m) => m.id !== ignoreId && m.recipeId === recipeId && m.date === date && m.mealType === mealType),

    /** Planner numbers for the dashboard - recalculated automatically when data changes. */
    stats() {
      const week = weekStartISO(0)
      const thisWeek = this.mealsForWeek(week)
      const today = toISODate(new Date())
      return {
        planned: this.plannedMeals.length,
        thisWeek: thisWeek.length,
        slotsFilled: new Set(thisWeek.map((m) => `${m.date}|${m.mealType}`)).size,
        slotsTotal: 21,
        todayMeals: this.plannedMeals.filter((m) => m.date === today),
        upcoming: this.plannedMeals.filter((m) => m.date > today).slice(0, 5),
        byMealType: MEAL_TYPES.map((t) => ({
          ...t,
          count: this.plannedMeals.filter((m) => m.mealType === t.value).length,
        })),
      }
    },
  },

  actions: {
    init(userId) {
      if (!userId || this.userId === userId) return
      this.userId = userId
      this.mealPlan = readJSON(key(userId, 'plan'), [])
      this.checkedItems = readJSON(key(userId, 'checked'), [])
    },

    reset() {
      this.$reset()
    },

    persist(...names) {
      if (!this.userId) return
      const map = { plan: this.mealPlan, checked: this.checkedItems }
      names.forEach((n) => writeJSON(key(this.userId, n), map[n]))
    },

    /** Servings default to the recipe's own serving size. */
    defaultServings(recipeId) {
      return useRecipeStore().getRecipeById(recipeId)?.servings ?? 1
    },

    addMeal({ recipeId, date, mealType, servings }) {
      if (this.hasDuplicate({ recipeId, date, mealType })) {
        return { ok: false, error: 'This recipe is already planned for that day and meal.' }
      }
      const meal = { id: uid('m'), recipeId, date, mealType, servings: Number(servings) || this.defaultServings(recipeId) }
      this.mealPlan.push(meal)
      this.persist('plan')
      return { ok: true, meal }
    },

    updateMeal(id, patch) {
      const idx = this.mealPlan.findIndex((m) => m.id === id)
      if (idx === -1) return { ok: false, error: 'That planned meal no longer exists.' }
      const next = { ...this.mealPlan[idx], ...patch }
      if (this.hasDuplicate(next, id)) {
        return { ok: false, error: 'This recipe is already planned for that day and meal.' }
      }
      this.mealPlan[idx] = next
      this.persist('plan')
      return { ok: true, meal: next }
    },

    removeMeal(id) {
      this.mealPlan = this.mealPlan.filter((m) => m.id !== id)
      this.persist('plan')
    },

    /** Used when a custom recipe is deleted so the plan never points at a missing recipe. */
    removeMealsForRecipe(recipeId) {
      this.mealPlan = this.mealPlan.filter((m) => m.recipeId !== recipeId)
      this.persist('plan')
    },

    clearWeek(weekStart) {
      const ids = new Set(this.mealsForWeek(weekStart).map((m) => m.id))
      this.mealPlan = this.mealPlan.filter((m) => !ids.has(m.id))
      this.checkedItems = this.checkedItems.filter((k) => !k.startsWith(weekStart + '|'))
      this.persist('plan', 'checked')
      return ids.size
    },

    toggleChecked(weekStart, itemKey) {
      const full = `${weekStart}|${itemKey}`
      this.checkedItems = this.checkedItems.includes(full)
        ? this.checkedItems.filter((k) => k !== full)
        : [...this.checkedItems, full]
      this.persist('checked')
    },
  },
})
