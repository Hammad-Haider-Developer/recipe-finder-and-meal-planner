<script setup>
import { SORT_OPTIONS, SEARCH_MODES } from '../composables/useRecipeFilters'

// Every control is bound with v-model so the parent view owns the state
// (it comes from the useRecipeFilters composable).
const search = defineModel('search', { type: String, default: '' })
const searchIn = defineModel('searchIn', { type: String, default: 'all' })
const category = defineModel('category', { type: String, default: 'All' })
const sort = defineModel('sort', { type: String, default: 'name-asc' })
const size = defineModel('size', { type: Number, default: 9 })
const view = defineModel('view', { type: String, default: 'grid' })

defineProps({
  categories: { type: Array, required: true },
  tags: { type: Array, required: true }, // all available dietary tags
  activeTags: { type: Array, default: () => [] },
  hasActive: { type: Boolean, default: false },
  resultCount: { type: Number, default: 0 },
  showView: { type: Boolean, default: true },
  pageSizes: { type: Array, default: () => [6, 9, 12, 18] },
  placeholder: { type: String, default: 'Search by recipe name or ingredient…' },
})
const emit = defineEmits(['toggle-tag', 'clear'])
</script>

<template>
  <section class="filters card" aria-label="Search and filter recipes">
    <div class="filters__row">
      <div class="search-box">
        <span class="search-box__icon" aria-hidden="true">🔎</span>
        <input
          v-model="search"
          type="search"
          class="input search-box__input"
          :placeholder="placeholder"
          aria-label="Search recipes"
        />
        <button v-if="search" type="button" class="search-box__clear" aria-label="Clear search" @click="search = ''">✕</button>
      </div>

      <label class="select-wrap">
        <span>Search in</span>
        <select v-model="searchIn" class="input input--select">
          <option v-for="m in SEARCH_MODES" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </label>

      <label class="select-wrap">
        <span>Sort by</span>
        <select v-model="sort" class="input input--select">
          <option v-for="o in SORT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
    </div>

    <div class="filters__group">
      <span class="filters__label">Category</span>
      <div class="chip-row" role="group" aria-label="Filter by category">
        <button
          v-for="c in ['All', ...categories]"
          :key="c"
          type="button"
          class="chip"
          :class="{ 'chip--active': category === c }"
          :aria-pressed="category === c"
          @click="category = c"
        >
          {{ c }}
        </button>
      </div>
    </div>

    <div class="filters__group">
      <span class="filters__label">Dietary</span>
      <div class="chip-row" role="group" aria-label="Filter by dietary preference">
        <button
          v-for="t in tags"
          :key="t"
          type="button"
          class="chip chip--diet"
          :class="{ 'chip--active': activeTags.includes(t) }"
          :aria-pressed="activeTags.includes(t)"
          @click="emit('toggle-tag', t)"
        >
          {{ t }}
        </button>
      </div>
    </div>

    <div class="filters__footer">
      <p class="filters__count">
        <strong>{{ resultCount }}</strong> {{ resultCount === 1 ? 'recipe' : 'recipes' }} found
      </p>
      <div class="filters__tools">
        <button v-if="hasActive" type="button" class="btn btn-ghost btn-sm" @click="emit('clear')">✕ Clear filters</button>
        <label class="select-wrap select-wrap--inline">
          <span>Per page</span>
          <select v-model.number="size" class="input input--select input--sm">
            <option v-for="n in pageSizes" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
        <div v-if="showView" class="segmented" role="group" aria-label="Layout">
          <button type="button" :class="{ active: view === 'grid' }" aria-label="Grid view" @click="view = 'grid'">▦</button>
          <button type="button" :class="{ active: view === 'list' }" aria-label="List view" @click="view = 'list'">☰</button>
        </div>
      </div>
    </div>
  </section>
</template>
