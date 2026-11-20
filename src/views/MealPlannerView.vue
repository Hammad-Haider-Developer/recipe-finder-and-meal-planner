<script setup>
import { ref, computed } from 'vue'
import WeekGrid from '../components/WeekGrid.vue'
import ShoppingList from '../components/ShoppingList.vue'
import PlannedMealsTable from '../components/PlannedMealsTable.vue'
import PlanMealModal from '../components/PlanMealModal.vue'
import { usePlannerStore } from '../stores/plannerStore'
import { useUiStore } from '../stores/uiStore'
import { weekStartISO, weekRangeLabel, weekOffsetLabel, formatLongDate } from '../utils/helpers'

const store = usePlannerStore()
const ui = useUiStore()

const weekOffset = ref(0) // 0 = this week
const tab = ref('week')
const showPlan = ref(false)
const modalMeal = ref(null)
const modalPreset = ref(null)

const weekStart = computed(() => weekStartISO(weekOffset.value))
const weekLabel = computed(() => weekRangeLabel(weekStart.value))
const weekMeals = computed(() => store.mealsForWeek(weekStart.value))
const shopping = computed(() => store.shoppingList(weekStart.value))
const checked = computed(() => store.checkedForWeek(weekStart.value))
const slotsFilled = computed(() => new Set(weekMeals.value.map((m) => `${m.date}|${m.mealType}`)).size)
const uniqueRecipes = computed(() => new Set(weekMeals.value.map((m) => m.recipeId)).size)

const tabs = computed(() => [
  { id: 'week', label: '🗓️ Weekly plan' },
  { id: 'shopping', label: `🛒 Shopping list (${shopping.value.length})` },
  { id: 'all', label: `📋 All planned meals (${store.plannedMeals.length})` },
])

function openAdd(date, mealType) {
  modalMeal.value = null
  modalPreset.value = date ? { date, mealType } : { date: weekStart.value }
  showPlan.value = true
}
function openEdit(meal) {
  modalMeal.value = meal
  modalPreset.value = null
  showPlan.value = true
}

async function removeMeal(meal) {
  const ok = await ui.confirm({
    title: 'Remove planned meal?',
    message: `"${meal.recipe.name}" (${meal.mealType}, ${formatLongDate(meal.date)}) will be removed from your plan.`,
    confirmText: 'Remove',
  })
  if (!ok) return
  store.removeMeal(meal.id)
  ui.toast('Meal removed from your plan.', 'info')
}

async function clearWeek() {
  if (!weekMeals.value.length) return
  const ok = await ui.confirm({
    title: 'Clear this week?',
    message: `All ${weekMeals.value.length} planned meals for ${weekLabel.value} will be removed.`,
    confirmText: 'Clear week',
  })
  if (!ok) return
  const n = store.clearWeek(weekStart.value)
  ui.toast(`Cleared ${n} planned ${n === 1 ? 'meal' : 'meals'}.`, 'info')
}

function moveMeal({ id, date, mealType }) {
  const res = store.updateMeal(id, { date, mealType })
  if (res.ok) ui.toast(`Meal moved to ${formatLongDate(date)} · ${mealType}.`)
  else ui.toast(res.error, 'error')
}
</script>

<template>
  <div class="container page">
    <header class="page-head">
      <div>
        <h1>🗓️ Weekly meal planner</h1>
        <p class="muted">Plan breakfast, lunch and dinner. Drag meals between slots to rearrange them.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openAdd()">＋ Add meal</button>
    </header>

    <div class="week-bar card">
      <div class="week-bar__nav">
        <button type="button" class="btn-icon" aria-label="Previous week" @click="weekOffset--">‹</button>
        <div class="week-bar__label">
          <strong>{{ weekOffsetLabel(weekOffset) }}</strong>
          <span>{{ weekLabel }}</span>
        </div>
        <button type="button" class="btn-icon" aria-label="Next week" @click="weekOffset++">›</button>
        <button v-if="weekOffset !== 0" type="button" class="btn btn-ghost btn-sm" @click="weekOffset = 0">Today</button>
      </div>
      <ul class="week-bar__stats">
        <li><strong>{{ weekMeals.length }}</strong> meals</li>
        <li><strong>{{ slotsFilled }}/21</strong> slots</li>
        <li><strong>{{ uniqueRecipes }}</strong> recipes</li>
      </ul>
      <button type="button" class="btn btn-ghost btn-ghost--danger btn-sm" :disabled="!weekMeals.length" @click="clearWeek">🧹 Clear week</button>
    </div>

    <div class="tabs" role="tablist">
      <button v-for="t in tabs" :key="t.id" type="button" role="tab" class="tabs__btn" :class="{ 'tabs__btn--active': tab === t.id }" :aria-selected="tab === t.id" @click="tab = t.id">
        {{ t.label }}
      </button>
    </div>

    <Transition name="fade" mode="out-in">
      <WeekGrid v-if="tab === 'week'" :week-start="weekStart" :meals="weekMeals" @add="openAdd" @edit="openEdit" @remove="removeMeal" @move="moveMeal" />
      <ShoppingList v-else-if="tab === 'shopping'" :items="shopping" :checked="checked" :week-label="weekLabel" @toggle="(k) => store.toggleChecked(weekStart, k)" />
      <PlannedMealsTable v-else :meals="store.plannedMeals" @edit="openEdit" @remove="removeMeal" />
    </Transition>

    <PlanMealModal v-if="showPlan" :meal="modalMeal" :preset="modalPreset" @close="showPlan = false" />
  </div>
</template>
