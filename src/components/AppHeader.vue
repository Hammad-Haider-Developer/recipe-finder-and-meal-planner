<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useRecipeStore } from '../stores/recipeStore'
import { useUiStore } from '../stores/uiStore'

const auth = useAuthStore()
const recipes = useRecipeStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const menuOpen = ref(false)
const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/recipes', label: 'Discover', icon: '🔎' },
  { to: '/favorites', label: 'Favorites', icon: '❤️' },
  { to: '/planner', label: 'Meal Planner', icon: '🗓️' },
]

// Close the mobile menu after every navigation.
watch(() => route.fullPath, () => (menuOpen.value = false))

function logout() {
  auth.logout() // removes currentUser session from localStorage
  ui.toast('You have been logged out.', 'info')
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="app-header">
    <div class="container app-header__inner">
      <RouterLink to="/dashboard" class="brand" aria-label="Recipe Planner home">
        <span class="brand__logo">🍲</span>
        <span class="brand__name">Recipe<strong>Planner</strong></span>
      </RouterLink>

      <button
        type="button"
        class="btn-icon nav-toggle"
        :aria-expanded="menuOpen"
        aria-label="Toggle navigation"
        @click="menuOpen = !menuOpen"
      >
        {{ menuOpen ? '✕' : '☰' }}
      </button>

      <nav class="nav" :class="{ 'nav--open': menuOpen }" aria-label="Main navigation">
        <RouterLink v-for="l in links" :key="l.to" :to="l.to" class="nav__link" active-class="nav__link--active">
          <span aria-hidden="true">{{ l.icon }}</span>
          {{ l.label }}
          <span v-if="l.to === '/favorites' && recipes.favoriteIds.length" class="nav__badge">
            {{ recipes.favoriteIds.length }}
          </span>
        </RouterLink>

        <div class="nav__user">
          <button
            type="button"
            class="btn-icon"
            :title="ui.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            :aria-label="ui.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="ui.toggleTheme()"
          >
            {{ ui.theme === 'dark' ? '☀️' : '🌙' }}
          </button>
          <div class="user-chip" :title="auth.currentUser?.email">
            <span class="avatar">{{ auth.userInitials }}</span>
            <span class="user-chip__name">{{ auth.firstName }}</span>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" @click="logout">Logout</button>
        </div>
      </nav>
    </div>
  </header>
</template>
