<script setup>
import { reactive, computed, ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import FormField from './FormField.vue'
import RecipeImage from './RecipeImage.vue'
import { useRecipeStore } from '../stores/recipeStore'
import { usePlannerStore } from '../stores/plannerStore'
import { useUiStore } from '../stores/uiStore'
import { validateMeal } from '../utils/validators'
import {
  DAYS,
  MEAL_TYPES,
  addDays,
  startOfWeek,
  toISODate,
  weekOffsetOf,
  dayIndexOf,
  todayIndex,
  weekOffsetLabel,
  weekRangeLabel,
  weekStartISO,
  formatMinutes,
  formatLongDate,
} from '../utils/helpers'

// Used both to ADD a meal (optionally with a preset) and to EDIT an existing one.
const props = defineProps({
  meal: { type: Object, default: null }, // existing planned meal -> edit mode
  preset: { type: Object, default: null }, // { recipeId?, date?, mealType? }
})
const emit = defineEmits(['close', 'saved'])

const store = useRecipeStore()
const planner = usePlannerStore()
const ui = useUiStore()

const isEdit = !!props.meal
const source = props.meal ?? props.preset ?? {}

const form = reactive({
  recipeId: source.recipeId ?? '',
  weekOffset: source.date ? weekOffsetOf(source.date) : 0,
  dayIndex: source.date ? dayIndexOf(source.date) : todayIndex(),
  mealType: source.mealType ?? '',
  servings: source.servings ?? '',
})
const submitted = ref(false)
const servingsTouched = ref(isEdit)

const recipesByCategory = computed(() =>
  store.categories
    .map((c) => ({
      category: c,
      recipes: store.allRecipes.filter((r) => r.category === c).sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.recipes.length),
)

const weekOptions = computed(() => {
  const lo = Math.min(-1, form.weekOffset)
  const hi = Math.max(6, form.weekOffset)
  return Array.from({ length: hi - lo + 1 }, (_, i) => {
    const offset = lo + i
    return { offset, label: `${weekOffsetLabel(offset)} · ${weekRangeLabel(weekStartISO(offset)).split(',')[0]}` }
  })
})

const dateISO = computed(() => toISODate(addDays(startOfWeek(), form.weekOffset * 7 + Number(form.dayIndex))))
const selectedRecipe = computed(() => store.getRecipeById(form.recipeId))

// Picking a recipe pre-fills servings with that recipe's own serving size (until the user edits it).
watch(
  selectedRecipe,
  (r) => {
    if (r && (!servingsTouched.value || form.servings === '')) form.servings = r.servings
  },
  { immediate: true },
)

function stepServings(delta) {
  servingsTouched.value = true
  form.servings = Math.min(50, Math.max(1, (Number(form.servings) || 1) + delta))
}

const validation = computed(() => {
  const res = validateMeal(form)
  if (res.valid && planner.hasDuplicate({ recipeId: form.recipeId, date: dateISO.value, mealType: form.mealType }, props.meal?.id)) {
    res.valid = false
    res.errors.form = 'This recipe is already planned for that day and meal.'
  }
  return res
})

function save() {
  submitted.value = true
  if (!validation.value.valid) return

  const payload = { recipeId: form.recipeId, date: dateISO.value, mealType: form.mealType, servings: Number(form.servings) }
  const res = isEdit ? planner.updateMeal(props.meal.id, payload) : planner.addMeal(payload)
  if (!res.ok) {
    ui.toast(res.error, 'error')
    return
  }
  const when = formatLongDate(payload.date)
  ui.toast(isEdit ? `Planned meal updated - ${when}.` : `Added to your plan - ${when}.`)
  emit('saved', res.meal)
  emit('close')
}
</script>

<template>
  <BaseModal :title="isEdit ? 'Edit planned meal' : 'Add to meal plan'" icon="🗓️" @close="emit('close')">
    <form id="plan-form" novalidate @submit.prevent="save">
      <FormField label="Recipe" for-id="plan-recipe" required :error="submitted ? validation.errors.recipeId : ''">
        <select id="plan-recipe" v-model="form.recipeId" class="input input--select" :class="{ 'input--invalid': submitted && validation.errors.recipeId }">
          <option value="" disabled>Select a recipe…</option>
          <optgroup v-for="g in recipesByCategory" :key="g.category" :label="g.category">
            <option v-for="r in g.recipes" :key="r.id" :value="r.id">{{ r.name }}</option>
          </optgroup>
        </select>
      </FormField>

      <Transition name="fade">
        <div v-if="selectedRecipe" class="plan-preview">
          <RecipeImage :recipe="selectedRecipe" size="sm" />
          <div>
            <strong>{{ selectedRecipe.name }}</strong>
            <p>⏱ {{ formatMinutes(selectedRecipe.prepTime + selectedRecipe.cookTime) }} · 👥 {{ selectedRecipe.servings }} servings</p>
          </div>
        </div>
      </Transition>

      <div class="form-grid">
        <FormField label="Week" for-id="plan-week">
          <select id="plan-week" v-model.number="form.weekOffset" class="input input--select">
            <option v-for="w in weekOptions" :key="w.offset" :value="w.offset">{{ w.label }}</option>
          </select>
        </FormField>

        <FormField label="Day" for-id="plan-day" required :error="submitted ? validation.errors.dayIndex : ''">
          <select id="plan-day" v-model.number="form.dayIndex" class="input input--select" :class="{ 'input--invalid': submitted && validation.errors.dayIndex }">
            <option v-for="(d, i) in DAYS" :key="d" :value="i">{{ d }}</option>
          </select>
        </FormField>
      </div>

      <FormField label="Meal type" required :error="submitted ? validation.errors.mealType : ''">
        <div class="meal-type-picker" role="radiogroup" aria-label="Meal type">
          <label v-for="t in MEAL_TYPES" :key="t.value" class="meal-type-option" :class="{ 'meal-type-option--active': form.mealType === t.value }">
            <input v-model="form.mealType" type="radio" name="mealType" :value="t.value" />
            <span class="meal-type-option__emoji">{{ t.emoji }}</span>
            {{ t.label }}
          </label>
        </div>
      </FormField>

      <FormField label="Servings" for-id="plan-servings" hint="Used to scale the shopping list." required :error="submitted ? validation.errors.servings : ''">
        <div class="stepper">
          <button type="button" class="btn-icon btn-icon--sm" aria-label="Fewer servings" @click="stepServings(-1)">−</button>
          <input id="plan-servings" v-model="form.servings" type="number" min="1" max="50" class="input stepper__input" :class="{ 'input--invalid': submitted && validation.errors.servings }" @input="servingsTouched = true" />
          <button type="button" class="btn-icon btn-icon--sm" aria-label="More servings" @click="stepServings(1)">＋</button>
        </div>
      </FormField>

      <p class="plan-summary">📅 Will be planned for <strong>{{ formatLongDate(dateISO) }}</strong></p>
      <p v-if="submitted && validation.errors.form" class="form-error" role="alert">⚠ {{ validation.errors.form }}</p>
    </form>

    <template #footer>
      <button type="button" class="btn btn-ghost" @click="emit('close')">Cancel</button>
      <button type="submit" form="plan-form" class="btn btn-primary">{{ isEdit ? 'Save changes' : 'Add to plan' }}</button>
    </template>
  </BaseModal>
</template>
