<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: Number, required: true },
  icon: { type: String, default: '📈' },
  hint: { type: String, default: '' },
  tone: { type: String, default: 'orange' }, // orange | green | pink | blue
  to: { type: String, default: '' },
})

// Count-up animation whenever the underlying value changes.
const shown = ref(0)
let frame

function animate(from, to) {
  cancelAnimationFrame(frame)
  const start = performance.now()
  const duration = 600
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration)
    shown.value = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)))
    if (t < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

onMounted(() => animate(0, props.value))
watch(() => props.value, (to, from) => animate(from, to))
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <component :is="to ? 'RouterLink' : 'div'" :to="to || undefined" class="stat-card" :class="`stat-card--${tone}`">
    <span class="stat-card__icon" aria-hidden="true">{{ icon }}</span>
    <div>
      <p class="stat-card__value">{{ shown }}</p>
      <p class="stat-card__label">{{ label }}</p>
      <p v-if="hint" class="stat-card__hint">{{ hint }}</p>
    </div>
  </component>
</template>
