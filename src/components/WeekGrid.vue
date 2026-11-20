<script setup>
import { computed, ref } from 'vue'
import { DAYS, MEAL_TYPES, addDays, parseISODate, toISODate, formatShortDate } from '../utils/helpers'

const props = defineProps({
  weekStart: { type: String, required: true }, // ISO date of Monday
  meals: { type: Array, required: true }, // planned meals of that week (recipe attached)
})
const emit = defineEmits(['add', 'edit', 'remove', 'move'])

const todayISO = toISODate(new Date())

const days = computed(() =>
  DAYS.map((label, i) => {
    const iso = toISODate(addDays(parseISODate(props.weekStart), i))
    return { label, iso, short: formatShortDate(iso), isToday: iso === todayISO }
  }),
)

function mealsAt(iso, type) {
  return props.meals.filter((m) => m.date === iso && m.mealType === type)
}

// Drag & drop: move a planned meal to another slot.
const draggingId = ref(null)
const overKey = ref(null)

function onDragStart(e, meal) {
  draggingId.value = meal.id
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', meal.id)
}
function onDragEnd() {
  draggingId.value = null
  overKey.value = null
}
function onDrop(iso, type) {
  const id = draggingId.value
  overKey.value = null
  draggingId.value = null
  if (id) emit('move', { id, date: iso, mealType: type })
}
</script>

<template>
  <div class="week-grid">
    <section v-for="d in days" :key="d.iso" class="day-col" :class="{ 'day-col--today': d.isToday }" :aria-label="d.label">
      <header class="day-col__head">
        <h4>{{ d.label }}</h4>
        <span>{{ d.short }}</span>
        <span v-if="d.isToday" class="badge badge--today">Today</span>
      </header>

      <div
        v-for="t in MEAL_TYPES"
        :key="t.value"
        class="slot"
        :class="{ 'slot--over': overKey === `${d.iso}|${t.value}` }"
        @dragover.prevent="overKey = `${d.iso}|${t.value}`"
        @dragleave="overKey = null"
        @drop.prevent="onDrop(d.iso, t.value)"
      >
        <p class="slot__label">{{ t.emoji }} {{ t.label }}</p>

        <TransitionGroup name="list" tag="div" class="slot__meals">
          <div
            v-for="m in mealsAt(d.iso, t.value)"
            :key="m.id"
            class="meal-chip"
            :class="{ 'meal-chip--dragging': draggingId === m.id }"
            draggable="true"
            @dragstart="onDragStart($event, m)"
            @dragend="onDragEnd"
          >
            <span class="meal-chip__emoji" aria-hidden="true">{{ m.recipe.emoji || '🍽️' }}</span>
            <RouterLink :to="`/recipes/${m.recipe.id}`" class="meal-chip__name" :title="`${m.recipe.name} · ${m.servings || m.recipe.servings} servings`">{{ m.recipe.name }}</RouterLink>
            <span class="meal-chip__srv" title="Servings">👥{{ m.servings || m.recipe.servings }}</span>
            <button type="button" class="meal-chip__btn" :aria-label="`Edit ${m.recipe.name}`" title="Edit" @click="emit('edit', m)">✏️</button>
            <button type="button" class="meal-chip__btn" :aria-label="`Remove ${m.recipe.name}`" title="Remove" @click="emit('remove', m)">🗑️</button>
          </div>
        </TransitionGroup>

        <button type="button" class="slot__add" :aria-label="`Add ${t.label} on ${d.label}`" @click="emit('add', d.iso, t.value)">
          ＋ Add
        </button>
      </div>
    </section>
  </div>
</template>
