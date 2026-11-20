<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RecipeImage from '../components/RecipeImage.vue'
import RecipeCard from '../components/RecipeCard.vue'
import EmptyState from '../components/EmptyState.vue'
import PlanMealModal from '../components/PlanMealModal.vue'
import RecipeFormModal from '../components/RecipeFormModal.vue'
import { useRecipeStore } from '../stores/recipeStore'
import { useRecipeActions } from '../composables/useRecipeActions'
import { formatMinutes, formatIngredient } from '../utils/helpers'

const route = useRoute()
const router = useRouter()
const store = useRecipeStore()

const { showPlan, planPreset, showForm, editingRecipe, toggleFavorite, openPlan, openEdit, deleteRecipe } = useRecipeActions({
  afterDelete: () => router.replace('/recipes'),
})

const recipe = computed(() => store.getRecipeById(route.params.id))

// Servings stepper scales every ingredient quantity.
const servings = ref(1)
const doneSteps = ref([])
const gotIngredients = ref([])

watch(
  recipe,
  (r) => {
    if (r) servings.value = r.servings
  },
  { immediate: true },
)

const factor = computed(() => (recipe.value ? servings.value / recipe.value.servings : 1))
const totalTime = computed(() => (recipe.value ? recipe.value.prepTime + recipe.value.cookTime : 0))
const progress = computed(() =>
  recipe.value?.instructions.length ? Math.round((doneSteps.value.length / recipe.value.instructions.length) * 100) : 0,
)
const related = computed(() =>
  recipe.value ? store.allRecipes.filter((r) => r.id !== recipe.value.id && r.category === recipe.value.category).slice(0, 3) : [],
)

function changeServings(delta) {
  servings.value = Math.min(50, Math.max(1, servings.value + delta))
}
function toggleIn(list, value) {
  const i = list.value.indexOf(value)
  i === -1 ? list.value.push(value) : list.value.splice(i, 1)
}
function goBack() {
  window.history.length > 1 ? router.back() : router.push('/recipes')
}
function printRecipe() {
  window.print()
}
</script>

<template>
  <div class="container page">
    <EmptyState v-if="!recipe" icon="🫥" title="Recipe not found" message="This recipe may have been deleted or the link is incorrect.">
      <RouterLink to="/recipes" class="btn btn-primary">Back to recipes</RouterLink>
    </EmptyState>

    <template v-else>
      <button type="button" class="btn btn-ghost btn-sm back-btn" @click="goBack">← Back</button>

      <article class="detail-hero card">
        <RecipeImage :recipe="recipe" size="hero" />
        <div class="detail-hero__info">
          <div class="detail-hero__badges">
            <span class="badge">{{ recipe.category }}</span>
            <span v-if="recipe.isCustom" class="badge badge--custom">✨ Custom recipe</span>
          </div>
          <h1>{{ recipe.name }}</h1>
          <p class="detail-hero__desc">{{ recipe.description }}</p>

          <dl class="facts">
            <div><dt>🔪 Prep</dt><dd>{{ formatMinutes(recipe.prepTime) }}</dd></div>
            <div><dt>🔥 Cook</dt><dd>{{ formatMinutes(recipe.cookTime) }}</dd></div>
            <div><dt>⏱ Total</dt><dd>{{ formatMinutes(totalTime) }}</dd></div>
            <div><dt>👥 Serves</dt><dd>{{ recipe.servings }}</dd></div>
          </dl>

          <div v-if="recipe.tags.length" class="tag-row">
            <span v-for="t in recipe.tags" :key="t" class="tag">{{ t }}</span>
          </div>

          <div class="detail-hero__actions">
            <button type="button" class="btn" :class="store.isFavorite(recipe.id) ? 'btn-fav-active' : 'btn-ghost'" @click="toggleFavorite(recipe)">
              {{ store.isFavorite(recipe.id) ? '❤️ Saved to favorites' : '🤍 Add to favorites' }}
            </button>
            <button type="button" class="btn btn-primary" @click="openPlan(recipe)">🗓️ Add to meal plan</button>
            <button type="button" class="btn btn-ghost" @click="printRecipe">🖨️ Print</button>
            <template v-if="recipe.isCustom">
              <button type="button" class="btn btn-ghost" @click="openEdit(recipe)">✏️ Edit</button>
              <button type="button" class="btn btn-ghost btn-ghost--danger" @click="deleteRecipe(recipe)">🗑️ Delete</button>
            </template>
          </div>
        </div>
      </article>

      <div class="detail-grid">
        <section class="card">
          <header class="card__head">
            <h2>🧂 Ingredients</h2>
            <span class="muted small">{{ gotIngredients.length }}/{{ recipe.ingredients.length }} ready</span>
          </header>

          <div class="servings-stepper">
            <span>Servings</span>
            <div>
              <button type="button" class="btn-icon btn-icon--sm" aria-label="Decrease servings" :disabled="servings <= 1" @click="changeServings(-1)">−</button>
              <strong aria-live="polite">{{ servings }}</strong>
              <button type="button" class="btn-icon btn-icon--sm" aria-label="Increase servings" :disabled="servings >= 50" @click="changeServings(1)">＋</button>
            </div>
            <button v-if="servings !== recipe.servings" type="button" class="btn btn-ghost btn-sm" @click="servings = recipe.servings">Reset</button>
          </div>

          <ul class="check-list">
            <li v-for="(ing, i) in recipe.ingredients" :key="i" :class="{ 'is-done': gotIngredients.includes(i) }">
              <label>
                <input type="checkbox" :checked="gotIngredients.includes(i)" @change="toggleIn(gotIngredients, i)" />
                <span>{{ formatIngredient(ing, factor) }}</span>
              </label>
            </li>
          </ul>
        </section>

        <section class="card">
          <header class="card__head">
            <h2>👩‍🍳 Cooking instructions</h2>
            <span class="muted small">{{ progress }}% complete</span>
          </header>
          <div class="progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
            <div class="progress__bar" :style="{ width: progress + '%' }"></div>
          </div>

          <ol class="steps">
            <li v-for="(step, i) in recipe.instructions" :key="i" :class="{ 'is-done': doneSteps.includes(i) }">
              <button type="button" class="steps__num" :aria-pressed="doneSteps.includes(i)" :aria-label="`Mark step ${i + 1} as done`" @click="toggleIn(doneSteps, i)">
                {{ doneSteps.includes(i) ? '✓' : i + 1 }}
              </button>
              <p>{{ step }}</p>
            </li>
          </ol>
          <p v-if="progress === 100" class="banner banner--success">🎉 All steps done - enjoy your meal!</p>
        </section>
      </div>

      <section v-if="related.length" class="related">
        <h2>More {{ recipe.category.toLowerCase() }} ideas</h2>
        <div class="recipe-grid">
          <RecipeCard
            v-for="r in related"
            :key="r.id"
            :recipe="r"
            :is-favorite="store.isFavorite(r.id)"
            @toggle-favorite="toggleFavorite"
            @plan="openPlan"
            @edit="openEdit"
            @delete="deleteRecipe"
          />
        </div>
      </section>
    </template>

    <PlanMealModal v-if="showPlan" :preset="planPreset" @close="showPlan = false" />
    <RecipeFormModal v-if="showForm" :recipe="editingRecipe" @close="showForm = false" />
  </div>
</template>
