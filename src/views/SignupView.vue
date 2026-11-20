<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AuthCard from '../components/AuthCard.vue'
import FormField from '../components/FormField.vue'
import PasswordInput from '../components/PasswordInput.vue'
import { useAuthStore } from '../stores/authStore'
import { useUiStore } from '../stores/uiStore'
import { validateSignup, passwordStrength } from '../utils/validators'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const form = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const touched = reactive({})
const submitted = ref(false)
const duplicateEmailError = ref('')
const loading = ref(false)

// Validation re-runs automatically whenever a field changes.
const validation = computed(() => validateSignup(form))

function err(field) {
  if (!submitted.value && !touched[field]) return ''
  if (field === 'email') return validation.value.errors.email || duplicateEmailError.value
  return validation.value.errors[field] || ''
}

watch(() => form.email, () => (duplicateEmailError.value = ''))

const strength = computed(() => passwordStrength(form.password))
const strengthLabel = computed(() => ['', 'Weak', 'Fair', 'Good', 'Strong'][strength.value])

function onSubmit() {
  submitted.value = true
  if (loading.value || !validation.value.valid) return

  loading.value = true
  setTimeout(() => {
    const res = auth.signup(form)
    loading.value = false
    if (!res.ok) {
      duplicateEmailError.value = res.error
      return
    }
    ui.toast('Account created! Please log in to continue.')
    router.push({ name: 'login', query: { registered: '1', email: res.user.email } })
  }, 450)
}
</script>

<template>
  <AuthCard title="Create your account" subtitle="Join to save favourites and plan your meals.">
    <form novalidate class="auth-form" @submit.prevent="onSubmit">
      <FormField label="Full name" for-id="su-name" required :error="err('name')">
        <input id="su-name" v-model="form.name" class="input" :class="{ 'input--invalid': err('name') }" autocomplete="name" placeholder="e.g. Hammad Haider" @blur="touched.name = true" />
      </FormField>

      <FormField label="Email" for-id="su-email" required :error="err('email')">
        <input id="su-email" v-model="form.email" type="email" class="input" :class="{ 'input--invalid': err('email') }" autocomplete="email" placeholder="you@example.com" @blur="touched.email = true" />
      </FormField>

      <FormField label="Password" for-id="su-pass" required :error="err('password')">
        <PasswordInput id="su-pass" v-model="form.password" autocomplete="new-password" placeholder="At least 6 characters" :invalid="!!err('password')" @blur="touched.password = true" />
        <div v-if="form.password" class="strength" :data-level="strength" aria-live="polite">
          <div class="strength__bars"><span v-for="n in 4" :key="n" :class="{ on: n <= strength }"></span></div>
          <small>{{ strengthLabel }}</small>
        </div>
      </FormField>

      <FormField label="Confirm password" for-id="su-confirm" required :error="err('confirmPassword')">
        <PasswordInput id="su-confirm" v-model="form.confirmPassword" autocomplete="new-password" placeholder="Re-enter your password" :invalid="!!err('confirmPassword')" @blur="touched.confirmPassword = true" />
      </FormField>

      <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
        <span v-if="loading" class="spinner" aria-hidden="true"></span>{{ loading ? 'Creating account…' : 'Create account' }}
      </button>
    </form>

    <template #footer>
      Already have an account? <RouterLink to="/login">Log in</RouterLink>
    </template>
  </AuthCard>
</template>
