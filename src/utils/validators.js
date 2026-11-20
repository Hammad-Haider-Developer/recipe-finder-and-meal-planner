// Pure validation helpers. Each validator returns { valid, errors } where
// `errors` is a flat map of field -> message (empty when valid).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(value) {
  return EMAIL_RE.test(String(value ?? '').trim())
}

export function isValidUrl(value) {
  try {
    const u = new URL(String(value).trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function result(errors) {
  return { errors, valid: Object.keys(errors).length === 0 }
}

/* ---------------- authentication ---------------- */

export function validateSignup(form) {
  const errors = {}
  const name = form.name.trim()

  if (!name) errors.name = 'Full name is required.'
  else if (name.length < 3) errors.name = 'Full name must be at least 3 characters.'
  else if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(name)) errors.name = 'Name may only contain letters, spaces and . - \' characters.'

  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!isValidEmail(form.email)) errors.email = 'Please enter a valid email address.'

  if (!form.password) errors.password = 'Password is required.'
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.'

  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password.'
  else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.'

  return result(errors)
}

export function validateLogin(form) {
  const errors = {}
  if (!form.email.trim()) errors.email = 'Email is required.'
  else if (!isValidEmail(form.email)) errors.email = 'Please enter a valid email address.'
  if (!form.password) errors.password = 'Password is required.'
  return result(errors)
}

/** 0-4 score used by the password strength meter on the signup page. */
export function passwordStrength(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}

/* ---------------- recipes ---------------- */

function checkNumber(errors, key, label, value, { min, max, integer = false }) {
  const raw = String(value ?? '').trim()
  if (raw === '') {
    errors[key] = `${label} is required.`
    return
  }
  const n = Number(raw)
  if (!Number.isFinite(n)) errors[key] = `${label} must be a valid number.`
  else if (integer && !Number.isInteger(n)) errors[key] = `${label} must be a whole number.`
  else if (n < min || n > max) errors[key] = `${label} must be between ${min} and ${max}.`
}

export function validateRecipe(form) {
  const errors = {}
  const name = form.name.trim()
  const description = form.description.trim()

  if (!name) errors.name = 'Recipe name is required.'
  else if (name.length < 3) errors.name = 'Recipe name must be at least 3 characters.'
  else if (name.length > 60) errors.name = 'Recipe name must be 60 characters or fewer.'

  if (!description) errors.description = 'A short description is required.'
  else if (description.length < 10) errors.description = 'Description must be at least 10 characters.'
  else if (description.length > 300) errors.description = 'Description must be 300 characters or fewer.'

  if (!form.category) errors.category = 'Please choose a category.'

  checkNumber(errors, 'prepTime', 'Preparation time', form.prepTime, { min: 0, max: 1440, integer: true })
  checkNumber(errors, 'cookTime', 'Cooking time', form.cookTime, { min: 0, max: 1440, integer: true })
  checkNumber(errors, 'servings', 'Servings', form.servings, { min: 1, max: 50, integer: true })

  if (form.image.trim() && !isValidUrl(form.image)) {
    errors.image = 'Image must be a valid http(s) URL (or leave it empty).'
  }

  if (form.ingredients.length === 0) errors.ingredients = 'Add at least one ingredient.'
  form.ingredients.forEach((ing, i) => {
    if (!ing.name.trim()) errors[`ingredient-${i}-name`] = 'Name required.'
    const q = String(ing.qty ?? '').trim()
    if (q === '') errors[`ingredient-${i}-qty`] = 'Qty required.'
    else if (!Number.isFinite(Number(q)) || Number(q) <= 0) errors[`ingredient-${i}-qty`] = 'Must be > 0.'
    if (!ing.unit) errors[`ingredient-${i}-unit`] = 'Unit required.'
  })

  if (form.instructions.length === 0) errors.instructions = 'Add at least one cooking step.'
  form.instructions.forEach((step, i) => {
    if (!step.trim()) errors[`step-${i}`] = 'This step is empty - fill it in or remove it.'
  })

  return result(errors)
}

/* ---------------- meal planning ---------------- */

export function validateMeal(form) {
  const errors = {}
  if (!form.recipeId) errors.recipeId = 'Please select a recipe.'
  if (form.dayIndex === '' || form.dayIndex === null || form.dayIndex === undefined || Number.isNaN(Number(form.dayIndex))) {
    errors.dayIndex = 'Please select a day.'
  } else if (Number(form.dayIndex) < 0 || Number(form.dayIndex) > 6) {
    errors.dayIndex = 'Selected day is invalid.'
  }
  if (form.servings !== undefined) {
    const n = Number(form.servings)
    if (String(form.servings).trim() === '' || !Number.isInteger(n) || n < 1 || n > 50) {
      errors.servings = 'Servings must be a whole number between 1 and 50.'
    }
  }
  if (!form.mealType) errors.mealType = 'Please select a meal type.'
  else if (!['breakfast', 'lunch', 'dinner'].includes(form.mealType)) errors.mealType = 'Selected meal type is invalid.'
  return result(errors)
}
