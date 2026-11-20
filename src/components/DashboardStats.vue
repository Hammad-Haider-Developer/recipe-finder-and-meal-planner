<script setup>
import { computed } from 'vue'
import StatCard from './StatCard.vue'

const props = defineProps({
  stats: { type: Object, required: true },
})

const cards = computed(() => [
  {
    label: 'Total Available Recipes',
    value: props.stats.totalRecipes,
    icon: '📖',
    tone: 'orange',
    hint: props.stats.customCount ? `${props.stats.customCount} created by you` : '20 sample recipes included',
    to: '/recipes',
  },
  {
    label: 'Favorite Recipes',
    value: props.stats.favorites,
    icon: '❤️',
    tone: 'pink',
    hint: props.stats.favorites ? 'View your saved recipes' : 'Tap the heart on any recipe',
    to: '/favorites',
  },
  {
    label: 'Planned Meals',
    value: props.stats.planned,
    icon: '🍽️',
    tone: 'green',
    hint: 'Across all weeks',
    to: '/planner',
  },
  {
    label: 'Meals This Week',
    value: props.stats.thisWeek,
    icon: '🗓️',
    tone: 'blue',
    hint: `${props.stats.slotsFilled} of ${props.stats.slotsTotal} meal slots filled`,
    to: '/planner',
  },
])
</script>

<template>
  <section class="stats-grid" aria-label="Summary statistics">
    <StatCard v-for="c in cards" :key="c.label" v-bind="c" />
  </section>
</template>
