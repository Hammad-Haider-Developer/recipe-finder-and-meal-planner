<script setup>
import { ref } from 'vue'

const model = defineModel({ type: String, default: '' })
defineProps({
  id: { type: String, required: true },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'current-password' },
  invalid: { type: Boolean, default: false },
})
defineEmits(['blur'])

const visible = ref(false)
</script>

<template>
  <div class="password-input">
    <input
      :id="id"
      v-model="model"
      class="input"
      :class="{ 'input--invalid': invalid }"
      :type="visible ? 'text' : 'password'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :aria-invalid="invalid"
      @blur="$emit('blur')"
    />
    <button
      type="button"
      class="password-input__toggle"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      @click="visible = !visible"
    >
      {{ visible ? '🙈' : '👁️' }}
    </button>
  </div>
</template>
