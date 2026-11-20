<script setup>
import { useAuthStore } from './stores/authStore'
import { useUiStore } from './stores/uiStore'
import AppHeader from './components/AppHeader.vue'
import ToastContainer from './components/ToastContainer.vue'
import ConfirmModal from './components/ConfirmModal.vue'

const auth = useAuthStore()
const ui = useUiStore()
</script>

<template>
  <div class="app-shell">
    <AppHeader v-if="auth.isAuthenticated" />

    <main class="app-main">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>

    <footer v-if="auth.isAuthenticated" class="app-footer">
      <span>🍲 Recipe Finder &amp; Meal Planner</span>
      <span>Built with Vue 3 · Pinia · Vue Router</span>
    </footer>

    <ToastContainer />
    <ConfirmModal v-if="ui.confirmState" />
  </div>
</template>
