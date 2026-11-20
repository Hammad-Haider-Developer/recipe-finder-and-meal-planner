<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

defineProps({
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg
})
const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

// Lifecycle hooks: listen for Esc and lock page scroll while the modal is open.
onMounted(() => {
  document.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @mousedown.self="emit('close')">
      <div class="modal" :class="`modal--${size}`" role="dialog" aria-modal="true" :aria-label="title">
        <header class="modal__header">
          <h3>
            <span v-if="icon" aria-hidden="true">{{ icon }}</span> {{ title }}
          </h3>
          <button type="button" class="btn-icon" aria-label="Close dialog" @click="emit('close')">✕</button>
        </header>
        <div class="modal__body"><slot /></div>
        <footer v-if="$slots.footer" class="modal__footer"><slot name="footer" /></footer>
      </div>
    </div>
  </Teleport>
</template>
