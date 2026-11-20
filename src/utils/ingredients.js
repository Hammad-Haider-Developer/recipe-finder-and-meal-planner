import { formatQty } from './helpers'

/**
 * Builds the combined shopping list for a set of planned meals.
 *
 *  - Each ingredient is scaled by (planned servings / recipe servings).
 *  - Ingredients with the same name AND the same unit family are summed.
 *  - kg is merged into g and l into ml, then shown in the friendlier unit again
 *    (e.g. 1250 g -> "1.25 kg").
 *
 * @param meals planned meals that already carry their `recipe`
 */
const BASE_UNIT = { kg: ['g', 1000], l: ['ml', 1000] }

export function normalizeUnit(qty, unit) {
  const base = BASE_UNIT[unit]
  return base ? { qty: qty * base[1], unit: base[0] } : { qty, unit }
}

export function friendlyUnit(qty, unit) {
  if (unit === 'g' && qty >= 1000) return { qty: qty / 1000, unit: 'kg' }
  if (unit === 'ml' && qty >= 1000) return { qty: qty / 1000, unit: 'l' }
  return { qty, unit }
}

export function combineIngredients(meals) {
  const map = new Map()

  for (const meal of meals) {
    const factor = (Number(meal.servings) || meal.recipe.servings) / meal.recipe.servings
    for (const ing of meal.recipe.ingredients) {
      const base = normalizeUnit(Number(ing.qty) * factor, ing.unit)
      const k = `${ing.name.trim().toLowerCase()}|${base.unit}`
      const row = map.get(k) ?? { key: k, name: ing.name.trim(), unit: base.unit, qty: 0, recipes: [] }
      row.qty += base.qty
      if (!row.recipes.includes(meal.recipe.name)) row.recipes.push(meal.recipe.name)
      map.set(k, row)
    }
  }

  return [...map.values()]
    .map((row) => {
      const shown = friendlyUnit(row.qty, row.unit)
      return { ...row, qty: Math.round(shown.qty * 100) / 100, unit: shown.unit, qtyLabel: formatQty(shown.qty) }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
