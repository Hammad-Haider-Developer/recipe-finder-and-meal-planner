<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DashboardStats from '../components/DashboardStats.vue'
import EmptyState from '../components/EmptyState.vue'
import RecipeImage from '../components/RecipeImage.vue'
import PlanMealModal from '../components/PlanMealModal.vue'
import { useAuthStore } from '../stores/authStore'
import { useRecipeStore } from '../stores/recipeStore'
import { usePlannerStore } from '../stores/plannerStore'
import { MEAL_TYPES, greeting, formatLongDate, formatShortDate, toISODate, formatMinutes, DAYS, dayIndexOf } from '../utils/helpers'

const auth = useAuthStore()
const store = useRecipeStore()
const planner = usePlannerStore()
const router = useRouter()

// Recipe numbers come from the recipe store, planner numbers from the planner store.
const stats = computed(() => ({ ...store.stats, ...planner.stats }))
const todayISO = toISODate(new Date())

const showPlan = ref(false)
const planPreset = ref(null)

const todayMenu = computed(() =>
  MEAL_TYPES.map((t) => ({ ...t, meals: stats.value.todayMeals.filter((m) => m.mealType === t.value) })),
)

const maxCategory = computed(() => Math.max(1, ...stats.value.byCategory.map((c) => c.count)))
const maxMealType = computed(() => Math.max(1, ...stats.value.byMealType.map((c) => c.count)))

const favoritePreview = computed(() => store.favoriteRecipes.slice(0, 4))
const quickPicks = computed(() =>
  [...store.allRecipes].sort((a, b) => a.prepTime + a.cookTime - (b.prepTime + b.cookTime) || a.name.localeCompare(b.name)).slice(0, 4),
)

function planFor(mealType) {
  planPreset.value = { date: todayISO, mealType }
  showPlan.value = true
}

function surprise() {
  const list = store.allRecipes
  router.push(`/recipes/${list[Math.floor(Math.random() * list.length)].id}`)
}
</script>

<template>
  <div class="container page">
    <section class="hero-banner">
      <div>
        <p class="hero-banner__date">{{ formatLongDate(todayISO) }}</p>
        <h1>{{ greeting() }}, {{ auth.firstName }}! 👋</h1>
        <p>What's cooking today? Browse recipes, save favourites and fill your week with delicious plans.</p>
        <div class="hero-banner__actions">
          <RouterLink to="/recipes" class="btn btn-light">🔎 Discover recipes</RouterLink>
          <button type="button" class="btn btn-glass" @click="planFor('dinner')">🗓️ Plan a meal</button>
          <RouterLink :to="{ name: 'recipes', query: { add: 1 } }" class="btn btn-glass">＋ Add recipe</RouterLink>
          <button type="button" class="btn btn-glass" @click="surprise">🎲 Surprise me</button>
        </div>
      </div>
      <div class="hero-banner__art" aria-hidden="true"><span>🍳</span><span>🥗</span><span>🍰</span></div>
    </section>

    <DashboardStats :stats="stats" />

    <div class="dash-grid">
      <section class="card">
        <header class="card__head">
          <h2>🍽️ Today's menu</h2>
          <RouterLink to="/planner" class="link">Open planner →</RouterLink>
        </header>
        <ul class="today-list">
          <li v-for="t in todayMenu" :key="t.value">
            <span class="today-list__type">{{ t.emoji }} {{ t.label }}</span>
            <div v-if="t.meals.length" class="today-list__meals">
              <RouterLink v-for="m in t.meals" :key="m.id" :to="`/recipes/${m.recipe.id}`" class="mini-recipe">
                <RecipeImage :recipe="m.recipe" size="xs" />
                <span>{{ m.recipe.name }}</span>
              </RouterLink>
            </div>
            <button v-else type="button" class="btn btn-ghost btn-sm" @click="planFor(t.value)">＋ Plan {{ t.label.toLowerCase() }}</button>
          </li>
        </ul>
      </section>

      <section class="card">
        <header class="card__head">
          <h2>⏭️ Upcoming meals</h2>
          <RouterLink to="/planner" class="link">View all →</RouterLink>
        </header>
        <ul v-if="stats.upcoming.length" class="upcoming-list">
          <li v-for="m in stats.upcoming" :key="m.id">
            <span class="upcoming-list__date">
              <strong>{{ DAYS[dayIndexOf(m.date)].slice(0, 3) }}</strong>
              {{ formatShortDate(m.date) }}
            </span>
            <RouterLink :to="`/recipes/${m.recipe.id}`">{{ m.recipe.emoji }} {{ m.recipe.name }}</RouterLink>
            <span class="badge">{{ m.mealType }}</span>
          </li>
        </ul>
        <EmptyState v-else icon="📅" title="No upcoming meals" message="Plan a few meals and they will show up here.">
          <button type="button" class="btn btn-primary btn-sm" @click="planFor('lunch')">Plan a meal</button>
        </EmptyState>
      </section>

      <section class="card">
        <header class="card__head"><h2>📚 Recipes by category</h2></header>
        <ul class="bars">
          <li v-for="c in stats.byCategory" :key="c.category">
            <span class="bars__label">{{ c.emoji }} {{ c.category }}</span>
            <div class="bars__track"><div class="bars__fill" :style="{ width: (c.count / maxCategory) * 100 + '%' }"></div></div>
            <span class="bars__value">{{ c.count }}</span>
          </li>
        </ul>
      </section>

      <section class="card">
        <header class="card__head"><h2>🥄 Planned meals by type</h2></header>
        <ul class="bars bars--green">
          <li v-for="t in stats.byMealType" :key="t.value">
            <span class="bars__label">{{ t.emoji }} {{ t.label }}</span>
            <div class="bars__track"><div class="bars__fill" :style="{ width: (t.count / maxMealType) * 100 + '%' }"></div></div>
            <span class="bars__value">{{ t.count }}</span>
          </li>
        </ul>
        <p class="muted small">
          This week: <strong>{{ stats.slotsFilled }}/{{ stats.slotsTotal }}</strong> meal slots filled
        </p>
        <div class="progress"><div class="progress__bar" :style="{ width: (stats.slotsFilled / stats.slotsTotal) * 100 + '%' }"></div></div>
      </section>

      <section class="card">
        <header class="card__head">
          <h2>❤️ Your favorites</h2>
          <RouterLink to="/favorites" class="link">See all →</RouterLink>
        </header>
        <ul v-if="favoritePreview.length" class="mini-list">
          <li v-for="r in favoritePreview" :key="r.id">
            <RouterLink :to="`/recipes/${r.id}`" class="mini-recipe">
              <RecipeImage :recipe="r" size="xs" />
              <span>{{ r.name }}<small class="muted"> · {{ formatMinutes(r.prepTime + r.cookTime) }}</small></span>
            </RouterLink>
          </li>
        </ul>
        <EmptyState v-else icon="🤍" title="No favorites yet" message="Tap the heart on a recipe to save it here.">
          <RouterLink to="/recipes" class="btn btn-primary btn-sm">Find recipes</RouterLink>
        </EmptyState>
      </section>

      <section class="card">
        <header class="card__head"><h2>⚡ Quick &amp; easy</h2></header>
        <ul class="mini-list">
          <li v-for="r in quickPicks" :key="r.id">
            <RouterLink :to="`/recipes/${r.id}`" class="mini-recipe">
              <RecipeImage :recipe="r" size="xs" />
              <span>{{ r.name }}<small class="muted"> · {{ formatMinutes(r.prepTime + r.cookTime) }}</small></span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>

    <PlanMealModal v-if="showPlan" :preset="planPreset" @close="showPlan = false" />
  </div>
</template>
