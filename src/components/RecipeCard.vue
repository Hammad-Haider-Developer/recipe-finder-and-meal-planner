<script setup>
import { computed } from 'vue'
import RecipeImage from './RecipeImage.vue'
import { formatMinutes } from '../utils/helpers'

const props = defineProps({
  recipe: { type: Object, required: true },
  isFavorite: { type: Boolean, default: false },
  view: { type: String, default: 'grid' }, // grid | list
})
const emit = defineEmits(['toggle-favorite', 'plan', 'edit', 'delete'])

const totalTime = computed(() => formatMinutes(props.recipe.prepTime + props.recipe.cookTime))
</script>

<template>
  <article class="recipe-card" :class="{ 'recipe-card--list': view === 'list' }">
    <div class="recipe-card__media">
      <RouterLink :to="`/recipes/${recipe.id}`" :aria-label="`View ${recipe.name}`">
        <RecipeImage :recipe="recipe" :size="view === 'list' ? 'sm' : 'md'" />
      </RouterLink>
      <button
        type="button"
        class="fav-btn"
        :class="{ 'fav-btn--active': isFavorite }"
        :aria-pressed="isFavorite"
        :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
        @click="emit('toggle-favorite', recipe)"
      >
        {{ isFavorite ? '❤️' : '🤍' }}
      </button>
      <span v-if="recipe.isCustom" class="badge badge--custom recipe-card__custom">✨ Custom</span>
    </div>

    <div class="recipe-card__body">
      <div class="recipe-card__top">
        <span class="badge">{{ recipe.category }}</span>
        <span class="recipe-card__time" title="Prep + cook time">⏱ {{ totalTime }}</span>
      </div>

      <h3 class="recipe-card__title">
        <RouterLink :to="`/recipes/${recipe.id}`">{{ recipe.name }}</RouterLink>
      </h3>
      <p class="recipe-card__desc">{{ recipe.description }}</p>

      <ul class="meta-row">
        <li title="Preparation time">🔪 {{ formatMinutes(recipe.prepTime) }} prep</li>
        <li title="Cooking time">🔥 {{ formatMinutes(recipe.cookTime) }} cook</li>
        <li title="Servings">👥 {{ recipe.servings }}</li>
      </ul>

      <div v-if="recipe.tags.length" class="tag-row">
        <span v-for="t in recipe.tags.slice(0, 3)" :key="t" class="tag">{{ t }}</span>
        <span v-if="recipe.tags.length > 3" class="tag tag--more">+{{ recipe.tags.length - 3 }}</span>
      </div>

      <div class="recipe-card__actions">
        <RouterLink :to="`/recipes/${recipe.id}`" class="btn btn-ghost btn-sm">View</RouterLink>
        <button type="button" class="btn btn-primary btn-sm" @click="emit('plan', recipe)">🗓️ Add to plan</button>
        <template v-if="recipe.isCustom">
          <button type="button" class="btn-icon btn-icon--sm" title="Edit recipe" aria-label="Edit recipe" @click="emit('edit', recipe)">
            ✏️
          </button>
          <button type="button" class="btn-icon btn-icon--sm" title="Delete recipe" aria-label="Delete recipe" @click="emit('delete', recipe)">
            🗑️
          </button>
        </template>
      </div>
    </div>
  </article>
</template>
