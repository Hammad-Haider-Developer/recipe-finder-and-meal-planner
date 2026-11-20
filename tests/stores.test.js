import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../src/stores/authStore'
import { useRecipeStore } from '../src/stores/recipeStore'
import { usePlannerStore } from '../src/stores/plannerStore'
import { loadUserData } from '../src/stores/session'
import { combineIngredients } from '../src/utils/ingredients'
import { DEMO_USER_ID } from '../src/utils/demoData'
import { SAMPLE_RECIPES } from '../src/data/recipes'
import { weekStartISO, toISODate, addDays, startOfWeek } from '../src/utils/helpers'

beforeEach(() => setActivePinia(createPinia()))

const thisWeek = weekStartISO(0)
const day = (n) => toISODate(addDays(startOfWeek(), n))

describe('sample data', () => {
  it('has 20 complete recipes with unique ids', () => {
    expect(SAMPLE_RECIPES).toHaveLength(20)
    expect(new Set(SAMPLE_RECIPES.map((r) => r.id)).size).toBe(20)
    for (const r of SAMPLE_RECIPES) {
      for (const f of ['name', 'description', 'category', 'prepTime', 'cookTime', 'servings']) expect(r[f], `${r.id}.${f}`).not.toBeUndefined()
      expect(r.ingredients.length).toBeGreaterThan(2)
      expect(r.instructions.length).toBeGreaterThan(2)
      expect(Array.isArray(r.tags)).toBe(true)
    }
  })
})

describe('authStore', () => {
  it('signs up, rejects duplicates, logs in and out', () => {
    const auth = useAuthStore()
    const before = auth.users.length // seeded demo account
    expect(auth.signup({ name: 'Ali Khan', email: 'Ali@Test.com', password: 'abc123' }).ok).toBe(true)
    expect(auth.users).toHaveLength(before + 1)
    expect(JSON.parse(localStorage.getItem('users'))).toHaveLength(before + 1)

    const dup = auth.signup({ name: 'Ali Two', email: 'ali@test.com', password: 'zzz999' })
    expect(dup.ok).toBe(false)

    expect(auth.login({ email: 'nobody@test.com', password: 'x' }).ok).toBe(false)
    expect(auth.login({ email: 'ali@test.com', password: 'wrong' }).ok).toBe(false)
    expect(auth.isAuthenticated).toBe(false)

    expect(auth.login({ email: 'ali@test.com', password: 'abc123' }).ok).toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(JSON.parse(localStorage.getItem('currentUser')).email).toBe('ali@test.com')
    expect(JSON.parse(localStorage.getItem('currentUser')).password).toBeUndefined()

    auth.logout()
    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('currentUser')).toBeNull()
  })

  it('restores the session after a "refresh"', () => {
    const auth = useAuthStore()
    auth.login({ email: 'demo@recipes.app', password: 'demo123' })
    setActivePinia(createPinia()) // simulate page reload
    expect(useAuthStore().isAuthenticated).toBe(true)
  })
})

describe('recipeStore', () => {
  it('toggles favorites and persists them per user', () => {
    const s = useRecipeStore()
    s.init('u1')
    expect(s.toggleFavorite('r1')).toBe(true)
    expect(s.isFavorite('r1')).toBe(true)
    expect(s.stats.favorites).toBe(1)

    setActivePinia(createPinia()) // reload
    const s2 = useRecipeStore()
    s2.init('u1')
    expect(s2.favoriteIds).toEqual(['r1'])

    const other = useRecipeStore()
    other.reset()
    other.init('u2')
    expect(other.favoriteIds).toEqual([])

    s2.reset()
    s2.init('u1')
    expect(s2.toggleFavorite('r1')).toBe(false)
    expect(s2.stats.favorites).toBe(0)
  })

  it('manages custom recipes (create / update / delete) and cleans references', () => {
    const s = useRecipeStore()
    const planner = usePlannerStore()
    s.init('u1')
    planner.init('u1')
    const r = s.addCustomRecipe({
      name: 'My Dish', description: 'Tasty dish here', category: 'Dinner', prepTime: 5, cookTime: 5, servings: 2,
      tags: [], image: '', emoji: '🍲', ingredients: [{ name: 'Rice', qty: 100, unit: 'g' }], instructions: ['Cook'],
    })
    expect(s.stats.totalRecipes).toBe(21)
    s.toggleFavorite(r.id)
    planner.addMeal({ recipeId: r.id, date: day(0), mealType: 'lunch' })
    s.updateCustomRecipe(r.id, { name: 'Renamed' })
    expect(s.getRecipeById(r.id).name).toBe('Renamed')

    s.deleteCustomRecipe(r.id)
    expect(s.stats.totalRecipes).toBe(20)
    expect(s.favoriteIds).not.toContain(r.id)
    expect(planner.mealPlan).toHaveLength(0)
  })
})

describe('plannerStore', () => {
  const setup = () => {
    useRecipeStore().init('u1')
    const p = usePlannerStore()
    p.init('u1')
    return p
  }

  it('plans, edits, moves and removes meals; blocks duplicates', () => {
    const s = setup()
    const a = s.addMeal({ recipeId: 'r1', date: day(0), mealType: 'breakfast' })
    expect(a.ok).toBe(true)
    expect(a.meal.servings).toBe(4) // defaults to the recipe's own servings
    expect(s.addMeal({ recipeId: 'r1', date: day(0), mealType: 'breakfast' }).ok).toBe(false)
    s.addMeal({ recipeId: 'r2', date: day(1), mealType: 'breakfast' })

    expect(s.stats.planned).toBe(2)
    expect(s.stats.thisWeek).toBe(2)
    expect(s.mealsForWeek(thisWeek)).toHaveLength(2)
    expect(s.mealsForWeek(weekStartISO(1))).toHaveLength(0)

    expect(s.updateMeal(a.meal.id, { mealType: 'dinner' }).ok).toBe(true)
    expect(s.mealPlan.find((m) => m.id === a.meal.id).mealType).toBe('dinner')

    s.removeMeal(a.meal.id)
    expect(s.stats.planned).toBe(1)
    expect(s.clearWeek(thisWeek)).toBe(1)
    expect(s.stats.planned).toBe(0)
  })

  it('combines ingredients across planned recipes', () => {
    const s = setup()
    // r1 pancakes: Eggs 2 pcs, r16 lava cake: Eggs 3 pcs, Sugar 2 tbsp + 5 tbsp
    s.addMeal({ recipeId: 'r1', date: day(0), mealType: 'breakfast' })
    s.addMeal({ recipeId: 'r16', date: day(2), mealType: 'dinner' })
    const list = s.shoppingList(thisWeek)
    const eggs = list.find((i) => i.name === 'Eggs')
    const sugar = list.find((i) => i.name === 'Sugar')
    expect(eggs.qty).toBe(5)
    expect(eggs.recipes).toHaveLength(2)
    expect(sugar.qty).toBe(7)

    s.toggleChecked(thisWeek, eggs.key)
    expect(s.checkedForWeek(thisWeek)).toEqual([eggs.key])
  })

  it('scales the shopping list by planned servings', () => {
    const s = setup()
    s.addMeal({ recipeId: 'r1', date: day(0), mealType: 'breakfast', servings: 8 }) // recipe makes 4 -> x2
    const eggs = s.shoppingList(thisWeek).find((i) => i.name === 'Eggs')
    expect(eggs.qty).toBe(4)
  })

  it('persists the meal plan across reloads', () => {
    const s = setup()
    s.addMeal({ recipeId: 'r5', date: day(3), mealType: 'lunch' })
    setActivePinia(createPinia())
    useRecipeStore().init('u1')
    const s2 = usePlannerStore()
    s2.init('u1')
    expect(s2.mealPlan).toHaveLength(1)
    expect(s2.plannedMeals[0].recipe.name).toBe('Greek Salad Bowl')
  })

  it('seeds favourites and a weekly plan for the demo account only', () => {
    loadUserData(DEMO_USER_ID)
    expect(useRecipeStore().favoriteIds.length).toBeGreaterThan(0)
    expect(usePlannerStore().stats.thisWeek).toBeGreaterThan(10)

    localStorage.clear()
    setActivePinia(createPinia())
    loadUserData('u_other')
    expect(usePlannerStore().stats.planned).toBe(0)
  })
})

describe('combineIngredients', () => {
  const recipe = (servings, ingredients) => ({ name: 'R', servings, ingredients })
  it('merges kg with g and l with ml, then shows the friendly unit', () => {
    const list = combineIngredients([
      { servings: 2, recipe: recipe(2, [{ name: 'Rice', qty: 500, unit: 'g' }, { name: 'Milk', qty: 600, unit: 'ml' }]) },
      { servings: 2, recipe: recipe(2, [{ name: 'rice', qty: 1, unit: 'kg' }, { name: 'Milk', qty: 0.5, unit: 'l' }]) },
    ])
    const rice = list.find((i) => i.name.toLowerCase() === 'rice')
    const milk = list.find((i) => i.name === 'Milk')
    expect(rice).toMatchObject({ qty: 1.5, unit: 'kg' })
    expect(milk).toMatchObject({ qty: 1.1, unit: 'l' })
  })
})
