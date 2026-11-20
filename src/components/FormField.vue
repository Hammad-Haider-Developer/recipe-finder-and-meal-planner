<script setup>
// Wraps any input with a label, optional hint and an accessible error message.
defineProps({
  label: { type: String, required: true },
  forId: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
})
</script>

<template>
  <div class="field" :class="{ 'field--error': error }">
    <label v-if="label" :for="forId" class="field__label">
      {{ label }} <span v-if="required" class="field__req" aria-hidden="true">*</span>
    </label>
    <slot />
    <p v-if="hint && !error" class="field__hint">{{ hint }}</p>
    <p v-if="error" class="field__error" role="alert">⚠ {{ error }}</p>
  </div>
</template>
