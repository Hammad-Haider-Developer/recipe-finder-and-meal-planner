export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { value: 'lunch', label: 'Lunch', emoji: '🥪' },
  { value: 'dinner', label: 'Dinner', emoji: '🍽️' },
]

export const MEAL_ORDER = { breakfast: 0, lunch: 1, dinner: 2 }

export const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pcs', 'pinch']

export const FOOD_EMOJIS = ['🍲', '🍕', '🍔', '🌮', '🍜', '🍣', '🥗', '🍛', '🥘', '🍝', '🥞', '🍰', '🍪', '🥪', '🍗', '🥙']

const GRADIENTS = [
  ['#ffd29d', '#ff9a8b'],
  ['#c3f0ca', '#8fd3b6'],
  ['#ffe29f', '#ffa99f'],
  ['#d4c1ff', '#f6a6c9'],
  ['#b5e3ff', '#a0c4ff'],
  ['#ffd6e0', '#ffb347'],
  ['#d1f2a5', '#f9d976'],
  ['#fbc2eb', '#a6c1ee'],
]

export function gradientFor(seed = '') {
  let h = 0
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const [a, b] = GRADIENTS[h % GRADIENTS.length]
  return `linear-gradient(135deg, ${a}, ${b})`
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

/* ---------- dates (all local time, ISO yyyy-mm-dd strings) ---------- */

export function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Monday of the week that contains `date`. */
export function startOfWeek(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function weekStartISO(offset = 0) {
  return toISODate(addDays(startOfWeek(), offset * 7))
}

export function weekOffsetOf(iso) {
  const diff = startOfWeek(parseISODate(iso)) - startOfWeek(new Date())
  return Math.round(diff / (7 * 24 * 3600 * 1000))
}

/** 0 = Monday ... 6 = Sunday */
export function dayIndexOf(iso) {
  return (parseISODate(iso).getDay() + 6) % 7
}

export function todayIndex() {
  return (new Date().getDay() + 6) % 7
}

export function formatShortDate(iso) {
  return parseISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatLongDate(iso) {
  return parseISODate(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function weekRangeLabel(startISO) {
  const s = parseISODate(startISO)
  const e = addDays(s, 6)
  const opts = { month: 'short', day: 'numeric' }
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`
}

export function weekOffsetLabel(offset) {
  if (offset === 0) return 'This week'
  if (offset === 1) return 'Next week'
  if (offset === -1) return 'Last week'
  return offset > 0 ? `In ${offset} weeks` : `${Math.abs(offset)} weeks ago`
}

/* ---------- formatting ---------- */

export function formatMinutes(total) {
  const m = Number(total) || 0
  if (m <= 0) return '0 min'
  const h = Math.floor(m / 60)
  const min = m % 60
  if (!h) return `${min} min`
  return min ? `${h} h ${min} min` : `${h} h`
}

export function formatQty(n) {
  return String(Math.round(Number(n) * 100) / 100)
}

export function unitLabel(unit) {
  return unit === 'pcs' ? '' : unit
}

/** "2 tbsp Olive oil" / "3 Eggs" - optionally scaled by `factor`. */
export function formatIngredient(ing, factor = 1) {
  return [formatQty(ing.qty * factor), unitLabel(ing.unit), ing.name].filter(Boolean).join(' ')
}

export function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
