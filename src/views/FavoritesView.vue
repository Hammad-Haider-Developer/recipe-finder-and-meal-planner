<script setup>
import { ref, watch } from 'vue'
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

const { search, searchIn, category, tags, sort, page, size, view, paginated, filtered, hasActiveFilters, toggleTag, clearFilters } =
  useRecipeFilters(() => store.favoriteRecipes, { pageSize: 6 })

const { showPlan, planPreset, showForm, editingRecipe, toggleFavorite, openPlan, openEdit, deleteRecipe } = useRecipeActions()

const resultsTop = ref(null)
watch(page, () => resultsTop.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
</script>

<template>
  <div class="container page">
    <header class="page-head">
      <div>
        <h1>❤️ Favorite recipes</h1>
        <p class="muted">Your saved recipes - {{ store.favoriteRecipes.length }} in total.</p>
      </div>
      <RouterLink to="/recipes" class="btn btn-ghost">🔎 Find more recipes</RouterLink>
    </header>

    <EmptyState
      v-if="!store.favoriteRecipes.length"
      icon="💔"
      title="You haven't saved any favorites yet"
      message="Tap the heart on any recipe and it will appear here - even after you refresh the page."
    >
      <RouterLink to="/recipes" class="btn btn-primary">Discover recipes</RouterLink>
    </EmptyState>

    <template v-else>
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
        :page-sizes="[6, 12, 18]"
        placeholder="Search your favorites by name or ingredient…"
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
            :is-favorite="true"
            @toggle-favorite="toggleFavorite"
            @plan="openPlan"
            @edit="openEdit"
            @delete="deleteRecipe"
          />
        </TransitionGroup>
        <PaginationBar v-model:page="page" :total-items="filtered.length" :page-size="size" noun="favorites" />
      </template>

      <EmptyState v-else icon="🔍" title="No favorites match your filters" message="Try a different search or clear the filters.">
        <button type="button" class="btn btn-primary" @click="clearFilters">Clear all filters</button>
      </EmptyState>
    </template>

    <PlanMealModal v-if="showPlan" :preset="planPreset" @close="showPlan = false" />
    <RecipeFormModal v-if="showForm" :recipe="editingRecipe" @close="showForm = false" />
  </div>
</template>
