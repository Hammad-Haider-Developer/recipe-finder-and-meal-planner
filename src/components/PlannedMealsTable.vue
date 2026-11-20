<script setup>
import { ref, computed, watch } from 'vue'
import PaginationBar from './PaginationBar.vue'
import EmptyState from './EmptyState.vue'
import { MEAL_TYPES, formatLongDate, DAYS, dayIndexOf } from '../utils/helpers'

// Every planned meal across all weeks - with search, filter, sort and pagination.
const props = defineProps({
  meals: { type: Array, required: true },
})
const emit = defineEmits(['edit', 'remove'])

const search = ref('')
const mealType = ref('all')
const sort = ref('date-asc')
const page = ref(1)
const pageSize = 8

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = props.meals.filter(
    (m) => (mealType.value === 'all' || m.mealType === mealType.value) && (!q || m.recipe.name.toLowerCase().includes(q)),
  )
  return list.sort((a, b) => {
    if (sort.value === 'name') return a.recipe.name.localeCompare(b.recipe.name)
    return sort.value === 'date-desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
  })
})

const paged = computed(() => rows.value.slice((page.value - 1) * pageSize, page.value * pageSize))

watch([search, mealType, sort], () => (page.value = 1))
watch(
  () => rows.value.length,
  (len) => {
    const max = Math.max(1, Math.ceil(len / pageSize))
    if (page.value > max) page.value = max
  },
)

const typeMeta = Object.fromEntries(MEAL_TYPES.map((t) => [t.value, t]))
</script>

<template>
  <section class="card">
    <div class="table-tools">
      <input v-model="search" type="search" class="input" placeholder="Search planned meals by recipe name…" aria-label="Search planned meals" />
      <select v-model="mealType" class="input input--select" aria-label="Filter by meal type">
        <option value="all">All meal types</option>
        <option v-for="t in MEAL_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
      <select v-model="sort" class="input input--select" aria-label="Sort planned meals">
        <option value="date-asc">Date: oldest first</option>
        <option value="date-desc">Date: newest first</option>
        <option value="name">Recipe: A → Z</option>
      </select>
    </div>

    <template v-if="paged.length">
      <ul class="meal-table">
        <li v-for="m in paged" :key="m.id" class="meal-row">
          <span class="meal-row__emoji" aria-hidden="true">{{ m.recipe.emoji || '🍽️' }}</span>
          <div class="meal-row__main">
            <RouterLink :to="`/recipes/${m.recipe.id}`">{{ m.recipe.name }}</RouterLink>
            <small class="muted">{{ formatLongDate(m.date) }}</small>
          </div>
          <span class="badge">{{ typeMeta[m.mealType].emoji }} {{ typeMeta[m.mealType].label }}</span>
          <span class="meal-row__day muted" title="Servings">👥 {{ m.servings || m.recipe.servings }}</span>
          <div class="meal-row__actions">
            <button type="button" class="btn-icon btn-icon--sm" :aria-label="`Edit ${m.recipe.name}`" @click="emit('edit', m)">✏️</button>
            <button type="button" class="btn-icon btn-icon--sm" :aria-label="`Remove ${m.recipe.name}`" @click="emit('remove', m)">🗑️</button>
          </div>
        </li>
      </ul>
      <PaginationBar v-model:page="page" :total-items="rows.length" :page-size="pageSize" noun="planned meals" />
    </template>

    <EmptyState
      v-else
      icon="📭"
      :title="meals.length ? 'No planned meals match your filters' : 'No meals planned yet'"
      :message="meals.length ? 'Try a different search or meal type.' : 'Use the weekly plan to add your first meal.'"
    />
  </section>
</template>
