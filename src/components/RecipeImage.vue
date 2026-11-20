<script setup>
import { ref, computed, watch } from 'vue'
import { gradientFor } from '../utils/helpers'
import { CATEGORY_EMOJI } from '../data/recipes'

// Shows the recipe photo when available; otherwise (missing URL or a URL that
// fails to load) falls back to a coloured emoji "artwork" so the UI never breaks.
const props = defineProps({
  recipe: { type: Object, required: true },
  size: { type: String, default: 'md' }, // sm | md | lg | hero
})

const failed = ref(false)
watch(() => props.recipe.image, () => (failed.value = false))

const showImage = computed(() => !!props.recipe.image && !failed.value)
const emoji = computed(() => props.recipe.emoji || CATEGORY_EMOJI[props.recipe.category] || '🍽️')
const background = computed(() => gradientFor(props.recipe.id || props.recipe.name))
</script>

<template>
  <div class="recipe-visual" :class="`recipe-visual--${size}`" :style="{ background }">
    <img
      v-if="showImage"
      :src="recipe.image"
      :alt="recipe.name"
      loading="lazy"
      referrerpolicy="no-referrer"
      @error="failed = true"
    />
    <span v-else class="recipe-visual__emoji" role="img" :aria-label="recipe.name">{{ emoji }}</span>
  </div>
</template>
