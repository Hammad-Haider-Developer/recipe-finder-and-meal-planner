<script setup>
import BaseModal from './BaseModal.vue'
import { useUiStore } from '../stores/uiStore'

const ui = useUiStore()
</script>

<template>
  <BaseModal :title="ui.confirmState.title" :icon="ui.confirmState.icon" size="sm" @close="ui.resolveConfirm(false)">
    <p class="confirm-message">{{ ui.confirmState.message }}</p>
    <template #footer>
      <button type="button" class="btn btn-ghost" @click="ui.resolveConfirm(false)">Cancel</button>
      <button
        type="button"
        class="btn"
        :class="ui.confirmState.tone === 'danger' ? 'btn-danger' : 'btn-primary'"
        @click="ui.resolveConfirm(true)"
      >
        {{ ui.confirmState.confirmText }}
      </button>
    </template>
  </BaseModal>
</template>
