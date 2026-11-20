<script setup>
import { reactive, computed, ref, onMounted, nextTick } from 'vue'
import BaseModal from './BaseModal.vue'
import FormField from './FormField.vue'
import RecipeImage from './RecipeImage.vue'
import { useRecipeStore } from '../stores/recipeStore'
import { useUiStore } from '../stores/uiStore'
import { validateRecipe } from '../utils/validators'
import { UNITS, FOOD_EMOJIS } from '../utils/helpers'

// Create a custom recipe, or edit one when `recipe` is supplied.
const props = defineProps({
  recipe: { type: Object, default: null },
})
const emit = defineEmits(['close', 'saved'])

const store = useRecipeStore()
const ui = useUiStore()
const isEdit = !!props.recipe

const form = reactive(
  props.recipe
    ? {
        name: props.recipe.name,
        emoji: props.recipe.emoji || '🍲',
        image: props.recipe.image || '',
        description: props.recipe.description,
        category: props.recipe.category,
        prepTime: String(props.recipe.prepTime),
        cookTime: String(props.recipe.cookTime),
        servings: String(props.recipe.servings),
        tags: [...props.recipe.tags],
        ingredients: props.recipe.ingredients.map((i) => ({ name: i.name, qty: String(i.qty), unit: i.unit })),
        instructions: [...props.recipe.instructions],
      }
    : {
        name: '',
        emoji: '🍲',
        image: '',
        description: '',
        category: '',
        prepTime: '',
        cookTime: '',
        servings: '',
        tags: [],
        ingredients: [{ name: '', qty: '', unit: 'g' }],
        instructions: [''],
      },
)

const submitted = ref(false)
const touched = reactive({})
const validation = computed(() => validateRecipe(form)) // recomputed on every keystroke

const touch = (k) => (touched[k] = true)
const err = (k) => (submitted.value || touched[k] ? validation.value.errors[k] || '' : '')
const invalid = (k) => !!err(k)

const previewRecipe = computed(() => ({
  id: props.recipe?.id ?? 'preview',
  name: form.name || 'Your recipe',
  image: form.image.trim(),
  emoji: form.emoji,
  category: form.category,
}))

function addIngredient() {
  form.ingredients.push({ name: '', qty: '', unit: 'g' })
  nextTick(() => document.getElementById(`ing-name-${form.ingredients.length - 1}`)?.focus())
}
function removeIngredient(idx) {
  form.ingredients.splice(idx, 1)
}
function addStep() {
  form.instructions.push('')
  nextTick(() => document.getElementById(`step-${form.instructions.length - 1}`)?.focus())
}
function removeStep(idx) {
  form.instructions.splice(idx, 1)
}
function toggleTag(tag) {
  const i = form.tags.indexOf(tag)
  i === -1 ? form.tags.push(tag) : form.tags.splice(i, 1)
}

function save() {
  submitted.value = true
  if (!validation.value.valid) {
    ui.toast('Please fix the highlighted fields.', 'error')
    nextTick(() => document.querySelector('.modal .field--error input, .modal .field--error select, .modal .field--error textarea, .modal .input--invalid')?.focus())
    return
  }
  const data = {
    name: form.name.trim(),
    emoji: form.emoji,
    image: form.image.trim(),
    description: form.description.trim(),
    category: form.category,
    prepTime: Number(form.prepTime),
    cookTime: Number(form.cookTime),
    servings: Number(form.servings),
    tags: [...form.tags],
    ingredients: form.ingredients.map((i) => ({ name: i.name.trim(), qty: Number(i.qty), unit: i.unit })),
    instructions: form.instructions.map((s) => s.trim()),
  }
  const saved = isEdit ? store.updateCustomRecipe(props.recipe.id, data) : store.addCustomRecipe(data)
  ui.toast(isEdit ? `"${saved.name}" updated.` : `"${saved.name}" added to your recipes.`)
  emit('saved', saved)
  emit('close')
}

onMounted(() => document.getElementById('rf-name')?.focus())
</script>

<template>
  <BaseModal :title="isEdit ? 'Edit recipe' : 'Add a custom recipe'" icon="👩‍🍳" size="lg" @close="emit('close')">
    <form id="recipe-form" novalidate @submit.prevent="save">
      <div class="recipe-form__top">
        <RecipeImage :recipe="previewRecipe" size="md" />
        <div class="recipe-form__top-fields">
          <FormField label="Recipe name" for-id="rf-name" required :error="err('name')">
            <input id="rf-name" v-model="form.name" class="input" :class="{ 'input--invalid': invalid('name') }" maxlength="60" placeholder="e.g. Grandma's Lentil Soup" @blur="touch('name')" />
          </FormField>
          <FormField label="Image URL (optional)" for-id="rf-image" :error="err('image')" hint="Leave empty to use the emoji artwork.">
            <input id="rf-image" v-model="form.image" type="url" class="input" :class="{ 'input--invalid': invalid('image') }" placeholder="https://…" @blur="touch('image')" />
          </FormField>
        </div>
      </div>

      <FormField label="Fallback emoji">
        <div class="emoji-picker" role="radiogroup" aria-label="Choose an emoji">
          <button
            v-for="e in FOOD_EMOJIS"
            :key="e"
            type="button"
            class="emoji-picker__item"
            :class="{ 'emoji-picker__item--active': form.emoji === e }"
            :aria-pressed="form.emoji === e"
            @click="form.emoji = e"
          >
            {{ e }}
          </button>
        </div>
      </FormField>

      <FormField label="Description" for-id="rf-desc" required :error="err('description')">
        <textarea id="rf-desc" v-model="form.description" rows="2" maxlength="300" class="input" :class="{ 'input--invalid': invalid('description') }" placeholder="What makes this recipe special?" @blur="touch('description')" />
        <span class="char-count">{{ form.description.length }}/300</span>
      </FormField>

      <div class="form-grid form-grid--4">
        <FormField label="Category" for-id="rf-cat" required :error="err('category')">
          <select id="rf-cat" v-model="form.category" class="input input--select" :class="{ 'input--invalid': invalid('category') }" @blur="touch('category')">
            <option value="" disabled>Select…</option>
            <option v-for="c in store.categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </FormField>
        <FormField label="Prep (min)" for-id="rf-prep" required :error="err('prepTime')">
          <input id="rf-prep" v-model="form.prepTime" type="number" min="0" class="input" :class="{ 'input--invalid': invalid('prepTime') }" inputmode="numeric" @blur="touch('prepTime')" />
        </FormField>
        <FormField label="Cook (min)" for-id="rf-cook" required :error="err('cookTime')">
          <input id="rf-cook" v-model="form.cookTime" type="number" min="0" class="input" :class="{ 'input--invalid': invalid('cookTime') }" inputmode="numeric" @blur="touch('cookTime')" />
        </FormField>
        <FormField label="Servings" for-id="rf-serv" required :error="err('servings')">
          <input id="rf-serv" v-model="form.servings" type="number" min="1" class="input" :class="{ 'input--invalid': invalid('servings') }" inputmode="numeric" @blur="touch('servings')" />
        </FormField>
      </div>

      <FormField label="Dietary tags">
        <div class="chip-row">
          <button v-for="t in store.dietaryTags" :key="t" type="button" class="chip chip--diet" :class="{ 'chip--active': form.tags.includes(t) }" :aria-pressed="form.tags.includes(t)" @click="toggleTag(t)">
            {{ t }}
          </button>
        </div>
      </FormField>

      <fieldset class="form-section">
        <legend>🧂 Ingredients <span class="field__req">*</span></legend>
        <p v-if="err('ingredients')" class="field__error" role="alert">⚠ {{ err('ingredients') }}</p>
        <TransitionGroup name="list" tag="div" class="row-list">
          <div v-for="(ing, idx) in form.ingredients" :key="idx" class="ingredient-row">
            <div>
              <input :id="`ing-name-${idx}`" v-model="ing.name" class="input" :class="{ 'input--invalid': invalid(`ingredient-${idx}-name`) }" placeholder="Ingredient name" :aria-label="`Ingredient ${idx + 1} name`" @blur="touch(`ingredient-${idx}-name`)" />
              <p v-if="err(`ingredient-${idx}-name`)" class="field__error">⚠ {{ err(`ingredient-${idx}-name`) }}</p>
            </div>
            <div>
              <input v-model="ing.qty" type="number" min="0" step="any" class="input" :class="{ 'input--invalid': invalid(`ingredient-${idx}-qty`) }" placeholder="Qty" :aria-label="`Ingredient ${idx + 1} quantity`" @blur="touch(`ingredient-${idx}-qty`)" />
              <p v-if="err(`ingredient-${idx}-qty`)" class="field__error">⚠ {{ err(`ingredient-${idx}-qty`) }}</p>
            </div>
            <select v-model="ing.unit" class="input input--select" :aria-label="`Ingredient ${idx + 1} unit`">
              <option v-for="u in UNITS" :key="u" :value="u">{{ u === 'pcs' ? 'pcs (count)' : u }}</option>
            </select>
            <button type="button" class="btn-icon btn-icon--sm" aria-label="Remove ingredient" @click="removeIngredient(idx)">🗑️</button>
          </div>
        </TransitionGroup>
        <button type="button" class="btn btn-ghost btn-sm" @click="addIngredient">＋ Add ingredient</button>
      </fieldset>

      <fieldset class="form-section">
        <legend>📝 Cooking instructions <span class="field__req">*</span></legend>
        <p v-if="err('instructions')" class="field__error" role="alert">⚠ {{ err('instructions') }}</p>
        <TransitionGroup name="list" tag="div" class="row-list">
          <div v-for="(step, idx) in form.instructions" :key="idx" class="step-row">
            <span class="step-row__num">{{ idx + 1 }}</span>
            <div class="step-row__field">
              <textarea :id="`step-${idx}`" v-model="form.instructions[idx]" rows="2" class="input" :class="{ 'input--invalid': invalid(`step-${idx}`) }" :placeholder="`Describe step ${idx + 1}…`" :aria-label="`Step ${idx + 1}`" @blur="touch(`step-${idx}`)" />
              <p v-if="err(`step-${idx}`)" class="field__error">⚠ {{ err(`step-${idx}`) }}</p>
            </div>
            <button type="button" class="btn-icon btn-icon--sm" aria-label="Remove step" @click="removeStep(idx)">🗑️</button>
          </div>
        </TransitionGroup>
        <button type="button" class="btn btn-ghost btn-sm" @click="addStep">＋ Add step</button>
      </fieldset>
    </form>

    <template #footer>
      <button type="button" class="btn btn-ghost" @click="emit('close')">Cancel</button>
      <button type="submit" form="recipe-form" class="btn btn-primary">{{ isEdit ? 'Save changes' : 'Save recipe' }}</button>
    </template>
  </BaseModal>
</template>
