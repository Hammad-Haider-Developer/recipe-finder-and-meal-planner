<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RecipeCard from '../components/RecipeCard.vue'
import RecipeFilters from '../components/RecipeFilters.vue'
import PaginationBar from '../components/PaginationBar.vue'
import EmptyState from '../components/EmptyState.vue'
import PlanMealModal from '../components/PlanMealModal.vue'
import RecipeFormModal from '../components/RecipeFormModal.vue'
import { useRecipeStore } from '../stores/recipeStore'
import { useRecipeFilters } from '../composables/useRecipeFilters'
import { useRecipeActions } from '../composables/useRecipeActions'

const store = useRecipeStore()
const route = useRoute()
const router = useRouter()

const { search, searchIn, category, tags, sort, page, size, view, paginated, filtered, hasActiveFilters, toggleTag, clearFilters } =
  useRecipeFilters(() => store.allRecipes, { pageSize: 9 })

const { showPlan, planPreset, showForm, editingRecipe, toggleFavorite, openPlan, openAdd, openEdit, deleteRecipe } = useRecipeActions()

const resultsTop = ref(null)
watch(page, () => resultsTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))

// The dashboard "Add recipe" button links here with ?add=1
onMounted(() => {
  if (route.query.add) {
    openAdd()
    router.replace({ name: 'recipes' })
  }
})
</script>

<template>
  <div class="container page">
    <header class="page-head">
      <div>
        <h1>🔎 Discover recipes</h1>
        <p class="muted">Search by name or ingredient, filter by category or diet and sort the way you like.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openAdd">＋ Add custom recipe</button>
    </header>

    <RecipeFilters
      v-model:search="search"
      v-model:search-in="searchIn"
      v-model:category="category"
      v-model:sort="sort"
      v-model:size="size"
      v-model:view="view"
      :categories="store.categories"
      :tags="store.dietaryTags"
      :active-tags="tags"
      :has-active="hasActiveFilters"
      :result-count="filtered.length"
      @toggle-tag="toggleTag"
      @clear="clearFilters"
    />

    <div ref="resultsTop" class="scroll-anchor"></div>

    <template v-if="filtered.length">
      <TransitionGroup name="cards" tag="div" class="recipe-grid" :class="{ 'recipe-grid--list': view === 'list' }">
        <RecipeCard
          v-for="r in paginated"
          :key="r.id"
          :recipe="r"
          :view="view"
          :is-favorite="store.isFavorite(r.id)"
          @toggle-favorite="toggleFavorite"
          @plan="openPlan"
          @edit="openEdit"
          @delete="deleteRecipe"
        />
      </TransitionGroup>
      <PaginationBar v-model:page="page" :total-items="filtered.length" :page-size="size" noun="recipes" />
    </template>

    <EmptyState v-else icon="🔍" title="No recipes match your search" message="Try a different keyword, another ingredient, or remove some filters.">
      <button type="button" class="btn btn-primary" @click="clearFilters">Clear all filters</button>
    </EmptyState>

    <PlanMealModal v-if="showPlan" :preset="planPreset" @close="showPlan = false" />
    <RecipeFormModal v-if="showForm" :recipe="editingRecipe" @close="showForm = false" />
  </div>
</template>
