<script setup>
import { useAuthStore } from '../stores/authStore'
import EmptyState from '../components/EmptyState.vue'

const auth = useAuthStore()
</script>

<template>
  <div class="container page">
    <EmptyState icon="🧭" title="404 - Page not found" message="The page you are looking for does not exist.">
      <RouterLink :to="auth.isAuthenticated ? '/dashboard' : '/login'" class="btn btn-primary">
        {{ auth.isAuthenticated ? 'Go to dashboard' : 'Go to login' }}
      </RouterLink>
    </EmptyState>
  </div>
</template>
