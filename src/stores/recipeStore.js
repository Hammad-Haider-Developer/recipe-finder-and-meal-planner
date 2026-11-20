import { defineStore } from 'pinia'
import { SAMPLE_RECIPES, CATEGORIES, CATEGORY_EMOJI, DIETARY_TAGS } from '../data/recipes'
import { readJSON, writeJSON } from '../utils/storage'
import { uid } from '../utils/helpers'
import { usePlannerStore } from './plannerStore'

// Per-user data lives under namespaced localStorage keys:
//   recipes:<userId>:custom     custom recipes the user created
//   recipes:<userId>:favorites  array of favourite recipe ids
// (the meal plan and shopping-list ticks live in plannerStore.js)

const key = (userId, name) => `recipes:${userId}:${name}`

export const useRecipeStore = defineStore('recipes', {
  state: () => ({
    userId: null,
    customRecipes: [],
    favoriteIds: [],
  }),

  getters: {
    categories: () => CATEGORIES,
    dietaryTags: () => DIETARY_TAGS,
    categoryEmoji: () => CATEGORY_EMOJI,

    allRecipes: (state) => [...SAMPLE_RECIPES, ...state.customRecipes],

    recipeMap() {
      return new Map(this.allRecipes.map((r) => [r.id, r]))
    },

    getRecipeById() {
      return (id) => this.recipeMap.get(id) ?? null
    },

    isFavorite: (state) => (id) => state.favoriteIds.includes(id),

    favoriteRecipes() {
      return this.favoriteIds.map((id) => this.recipeMap.get(id)).filter(Boolean)
    },

    /** Recipe numbers for the dashboard - recalculated automatically when data changes. */
    stats() {
      return {
        totalRecipes: this.allRecipes.length,
        customCount: this.customRecipes.length,
        favorites: this.favoriteRecipes.length,
        byCategory: CATEGORIES.map((c) => ({
          category: c,
          emoji: CATEGORY_EMOJI[c],
          count: this.allRecipes.filter((r) => r.category === c).length,
        })),
      }
    },
  },

  actions: {
    /* ----- lifecycle ----- */
    init(userId) {
      if (!userId || this.userId === userId) return
      this.userId = userId
      this.customRecipes = readJSON(key(userId, 'custom'), [])
      this.favoriteIds = readJSON(key(userId, 'favorites'), [])
    },

    reset() {
      this.$reset()
    },

    persist(...names) {
      if (!this.userId) return
      const map = { custom: this.customRecipes, favorites: this.favoriteIds }
      names.forEach((n) => writeJSON(key(this.userId, n), map[n]))
    },

    /* ----- custom recipes (CRUD) ----- */
    addCustomRecipe(data) {
      const recipe = { ...data, id: uid('c'), isCustom: true, createdAt: new Date().toISOString() }
      this.customRecipes.unshift(recipe)
      this.persist('custom')
      return recipe
    },

    updateCustomRecipe(id, data) {
      const idx = this.customRecipes.findIndex((r) => r.id === id)
      if (idx === -1) return null
      this.customRecipes[idx] = { ...this.customRecipes[idx], ...data, id, isCustom: true }
      this.persist('custom')
      return this.customRecipes[idx]
    },

    deleteCustomRecipe(id) {
      this.customRecipes = this.customRecipes.filter((r) => r.id !== id)
      this.favoriteIds = this.favoriteIds.filter((f) => f !== id)
      this.persist('custom', 'favorites')
      usePlannerStore().removeMealsForRecipe(id)
    },

    /* ----- favourites ----- */
    toggleFavorite(id) {
      const added = !this.favoriteIds.includes(id)
      this.favoriteIds = added ? [...this.favoriteIds, id] : this.favoriteIds.filter((f) => f !== id)
      this.persist('favorites')
      return added
    },
  },
})
