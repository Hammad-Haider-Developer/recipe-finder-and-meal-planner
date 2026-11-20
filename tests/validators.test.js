import { describe, it, expect } from 'vitest'
import { validateSignup, validateLogin, validateRecipe, validateMeal, isValidEmail, passwordStrength } from '../src/utils/validators'

describe('auth validation', () => {
  const good = { name: 'Hammad Haider', email: 'h@example.com', password: 'secret1', confirmPassword: 'secret1' }

  it('accepts valid signup data', () => {
    expect(validateSignup(good).valid).toBe(true)
  })

  it('flags every empty required field', () => {
    const { errors } = validateSignup({ name: '', email: '', password: '', confirmPassword: '' })
    expect(Object.keys(errors).sort()).toEqual(['confirmPassword', 'email', 'name', 'password'])
  })

  it('validates email format', () => {
    expect(isValidEmail('a@b.co')).toBe(true)
    for (const bad of ['abc', 'a@b', 'a b@c.com', '@c.com', 'a@.com']) expect(isValidEmail(bad)).toBe(false)
    expect(validateSignup({ ...good, email: 'nope' }).errors.email).toMatch(/valid email/i)
  })

  it('requires matching passwords', () => {
    expect(validateSignup({ ...good, confirmPassword: 'other' }).errors.confirmPassword).toMatch(/do not match/i)
  })

  it('validates login fields', () => {
    expect(validateLogin({ email: '', password: '' }).valid).toBe(false)
    expect(validateLogin({ email: 'a@b.co', password: 'x' }).valid).toBe(true)
  })

  it('scores password strength', () => {
    expect(passwordStrength('')).toBe(0)
    expect(passwordStrength('abcdef')).toBe(1)
    expect(passwordStrength('Abcdefghij1!')).toBe(4)
  })
})

describe('recipe validation', () => {
  const good = {
    name: 'Test Soup',
    description: 'A warm test soup for everyone.',
    category: 'Lunch',
    prepTime: '10',
    cookTime: '20',
    servings: '4',
    image: '',
    ingredients: [{ name: 'Water', qty: '500', unit: 'ml' }],
    instructions: ['Boil it.'],
  }

  it('accepts a complete recipe', () => {
    expect(validateRecipe(good).valid).toBe(true)
  })

  it('rejects missing/invalid fields', () => {
    const { errors } = validateRecipe({
      ...good,
      name: '',
      description: 'short',
      category: '',
      prepTime: 'abc',
      cookTime: '-5',
      servings: '2.5',
      image: 'not a url',
      ingredients: [{ name: '', qty: '0', unit: 'g' }],
      instructions: [' '],
    })
    for (const key of ['name', 'description', 'category', 'prepTime', 'cookTime', 'servings', 'image', 'ingredient-0-name', 'ingredient-0-qty', 'step-0']) {
      expect(errors[key], key).toBeTruthy()
    }
  })

  it('requires at least one ingredient and step', () => {
    const { errors } = validateRecipe({ ...good, ingredients: [], instructions: [] })
    expect(errors.ingredients).toBeTruthy()
    expect(errors.instructions).toBeTruthy()
  })
})

describe('meal validation', () => {
  it('requires recipe, day and meal type', () => {
    const { errors } = validateMeal({ recipeId: '', dayIndex: '', mealType: '' })
    expect(Object.keys(errors).sort()).toEqual(['dayIndex', 'mealType', 'recipeId'])
    expect(validateMeal({ recipeId: 'r1', dayIndex: 0, mealType: 'lunch' }).valid).toBe(true)
  })
  it('validates servings when provided', () => {
    const base = { recipeId: 'r1', dayIndex: 0, mealType: 'lunch' }
    expect(validateMeal({ ...base, servings: 4 }).valid).toBe(true)
    for (const bad of ['', 0, -2, 2.5, 99, 'abc']) expect(validateMeal({ ...base, servings: bad }).errors.servings, String(bad)).toBeTruthy()
  })
})
