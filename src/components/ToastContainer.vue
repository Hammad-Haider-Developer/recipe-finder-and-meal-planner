<script setup>
import { useUiStore } from '../stores/uiStore'

const ui = useUiStore()
const icons = { success: '✅', error: '⛔', info: 'ℹ️', warning: '⚠️' }
</script>

<template>
  <div class="toast-stack" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="`toast--${t.type}`" role="status">
        <span aria-hidden="true">{{ icons[t.type] }}</span>
        <p>{{ t.message }}</p>
        <button type="button" class="toast__close" aria-label="Dismiss" @click="ui.dismissToast(t.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>
