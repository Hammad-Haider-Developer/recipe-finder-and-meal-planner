import { describe, it, expect, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useRecipeFilters } from '../src/composables/useRecipeFilters'
import { SAMPLE_RECIPES } from '../src/data/recipes'

function setup(opts) {
  const scope = effectScope()
  const f = scope.run(() => useRecipeFilters(() => SAMPLE_RECIPES, opts))
  return f
}

async function typeSearch(f, text) {
  vi.useFakeTimers()
  f.search.value = text
  await nextTick()
  vi.advanceTimersByTime(250)
  vi.useRealTimers()
  await nextTick()
}

describe('useRecipeFilters', () => {
  it('paginates 20 recipes at 9 per page (3 pages)', () => {
    const f = setup({ pageSize: 9 })
    expect(f.filtered.value).toHaveLength(20)
    expect(f.totalPages.value).toBe(3)
    expect(f.paginated.value).toHaveLength(9)
    f.page.value = 3
    expect(f.paginated.value).toHaveLength(2)
  })

  it('searches by name and by ingredient', async () => {
    const f = setup()
    await typeSearch(f, 'biryani')
    expect(f.filtered.value.map((r) => r.name)).toEqual(['Chicken Biryani'])

    f.searchIn.value = 'name'
    await typeSearch(f, 'chickpeas')
    expect(f.filtered.value).toHaveLength(0)

    f.searchIn.value = 'ingredient'
    await nextTick()
    expect(f.filtered.value.map((r) => r.name).sort()).toEqual(['Chana Masala', 'Creamy Hummus with Veggie Sticks'])
  })

  it('filters by category and dietary tags (all selected tags must match)', async () => {
    const f = setup()
    f.category.value = 'Dinner'
    await nextTick()
    expect(f.filtered.value.every((r) => r.category === 'Dinner')).toBe(true)
    f.toggleTag('Vegan')
    await nextTick()
    expect(f.filtered.value.length).toBeGreaterThan(0)
    expect(f.filtered.value.every((r) => r.tags.includes('Vegan'))).toBe(true)
    f.clearFilters()
    await nextTick()
    expect(f.filtered.value).toHaveLength(20)
  })

  it('sorts by name and prep time and resets to page 1', async () => {
    const f = setup({ pageSize: 6 })
    f.page.value = 2
    f.sort.value = 'name-desc'
    await nextTick()
    expect(f.page.value).toBe(1)
    const names = f.sorted.value.map((r) => r.name)
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)))

    f.sort.value = 'prep-asc'
    await nextTick()
    const preps = f.sorted.value.map((r) => r.prepTime)
    expect(preps).toEqual([...preps].sort((a, b) => a - b))
  })
})
