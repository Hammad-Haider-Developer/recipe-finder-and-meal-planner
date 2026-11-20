import { ref, computed, watch, onScopeDispose, getCurrentScope, unref } from 'vue'
import { formatMinutes } from '../utils/helpers'

export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name: A → Z' },
  { value: 'name-desc', label: 'Name: Z → A' },
  { value: 'prep-asc', label: 'Prep time: shortest' },
  { value: 'prep-desc', label: 'Prep time: longest' },
  { value: 'total-asc', label: 'Total time: shortest' },
  { value: 'total-desc', label: 'Total time: longest' },
  { value: 'newest', label: 'Recently added' },
]

export const SEARCH_MODES = [
  { value: 'all', label: 'Name & ingredients' },
  { value: 'name', label: 'Name only' },
  { value: 'ingredient', label: 'Ingredient only' },
]

/**
 * Reusable search + filter + sort + pagination logic for any list of recipes.
 * @param source  a ref / getter returning the recipe array
 */
export function useRecipeFilters(source, { pageSize = 9 } = {}) {
  const search = ref('')
  const debouncedSearch = ref('')
  const searchIn = ref('all')
  const category = ref('All')
  const tags = ref([])
  const sort = ref('name-asc')
  const page = ref(1)
  const size = ref(pageSize)
  const view = ref('grid')

  // Debounce typing so results update smoothly while the user types.
  let timer
  watch(search, (v) => {
    clearTimeout(timer)
    timer = setTimeout(() => (debouncedSearch.value = v.trim().toLowerCase()), 200)
  })
  if (getCurrentScope()) onScopeDispose(() => clearTimeout(timer))

  const items = computed(() => (typeof source === 'function' ? source() : unref(source)) ?? [])

  const filtered = computed(() => {
    const q = debouncedSearch.value
    return items.value.filter((r) => {
      if (category.value !== 'All' && r.category !== category.value) return false
      if (tags.value.length && !tags.value.every((t) => r.tags.includes(t))) return false
      if (!q) return true
      const inName = r.name.toLowerCase().includes(q)
      const inIngredients = r.ingredients.some((ing) => ing.name.toLowerCase().includes(q))
      if (searchIn.value === 'name') return inName
      if (searchIn.value === 'ingredient') return inIngredients
      return inName || inIngredients
    })
  })

  const sorted = computed(() => {
    const list = [...filtered.value]
    const total = (r) => r.prepTime + r.cookTime
    switch (sort.value) {
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name))
      case 'prep-asc':
        return list.sort((a, b) => a.prepTime - b.prepTime || a.name.localeCompare(b.name))
      case 'prep-desc':
        return list.sort((a, b) => b.prepTime - a.prepTime || a.name.localeCompare(b.name))
      case 'total-asc':
        return list.sort((a, b) => total(a) - total(b) || a.name.localeCompare(b.name))
      case 'total-desc':
        return list.sort((a, b) => total(b) - total(a) || a.name.localeCompare(b.name))
      case 'newest':
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      default:
        return list.sort((a, b) => a.name.localeCompare(b.name))
    }
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / size.value)))
  const paginated = computed(() => sorted.value.slice((page.value - 1) * size.value, page.value * size.value))

  // Any change to the criteria sends the user back to page 1.
  watch([debouncedSearch, searchIn, category, tags, sort, size], () => (page.value = 1), { deep: true })
  // If items disappear (e.g. a recipe is deleted) keep the page in range.
  watch(totalPages, (tp) => {
    if (page.value > tp) page.value = tp
  })

  const hasActiveFilters = computed(
    () => !!debouncedSearch.value || category.value !== 'All' || tags.value.length > 0 || searchIn.value !== 'all',
  )

  function toggleTag(tag) {
    tags.value = tags.value.includes(tag) ? tags.value.filter((t) => t !== tag) : [...tags.value, tag]
  }

  function clearFilters() {
    search.value = ''
    debouncedSearch.value = ''
    searchIn.value = 'all'
    category.value = 'All'
    tags.value = []
  }

  return {
    search, searchIn, category, tags, sort, page, size, view,
    filtered, sorted, paginated, totalPages, hasActiveFilters,
    toggleTag, clearFilters,
  }
}

export { formatMinutes }
