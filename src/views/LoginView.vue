<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthCard from '../components/AuthCard.vue'
import FormField from '../components/FormField.vue'
import PasswordInput from '../components/PasswordInput.vue'
import { useAuthStore, DEMO_ACCOUNT } from '../stores/authStore'
import { useUiStore } from '../stores/uiStore'
import { validateLogin } from '../utils/validators'

const auth = useAuthStore()
const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ email: String(route.query.email ?? ''), password: '' })
const touched = reactive({})
const submitted = ref(false)
const loginError = ref('')
const loading = ref(false)
const justRegistered = computed(() => route.query.registered === '1')

const validation = computed(() => validateLogin(form))
const err = (f) => (submitted.value || touched[f] ? validation.value.errors[f] || '' : '')

// Hide the "invalid credentials" banner as soon as the user edits a field.
watch(form, () => (loginError.value = ''))

function useDemo() {
  form.email = DEMO_ACCOUNT.email
  form.password = DEMO_ACCOUNT.password
}

function onSubmit() {
  submitted.value = true
  if (loading.value || !validation.value.valid) return

  loading.value = true
  // Short delay so the loading indicator is visible (the "server" is just localStorage).
  setTimeout(() => {
    const res = auth.login(form)
    loading.value = false
    if (!res.ok) {
      loginError.value = res.error
      return
    }
    ui.toast(`Welcome back, ${auth.firstName}!`)
    router.push({ name: 'dashboard' }) // after login the user always lands on the Dashboard
  }, 450)
}
</script>

<template>
  <AuthCard title="Welcome back" subtitle="Log in to continue to your recipes.">
    <p v-if="justRegistered" class="banner banner--success" role="status">🎉 Account created successfully - you can log in now.</p>
    <p v-if="route.query.redirect && !justRegistered" class="banner banner--info" role="status">🔒 Please log in to access that page.</p>
    <p v-if="loginError" class="banner banner--error" role="alert">⛔ {{ loginError }}</p>

    <form novalidate class="auth-form" @submit.prevent="onSubmit">
      <FormField label="Email" for-id="li-email" required :error="err('email')">
        <input id="li-email" v-model="form.email" type="email" class="input" :class="{ 'input--invalid': err('email') }" autocomplete="email" placeholder="you@example.com" @blur="touched.email = true" />
      </FormField>

      <FormField label="Password" for-id="li-pass" required :error="err('password')">
        <PasswordInput id="li-pass" v-model="form.password" placeholder="Your password" :invalid="!!err('password')" @blur="touched.password = true" />
      </FormField>

      <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
        <span v-if="loading" class="spinner" aria-hidden="true"></span>{{ loading ? 'Logging in…' : 'Log in' }}
      </button>
    </form>

    <div class="demo-box">
      <p><strong>Demo account</strong> · {{ DEMO_ACCOUNT.email }} / {{ DEMO_ACCOUNT.password }}</p>
      <button type="button" class="btn btn-ghost btn-sm" @click="useDemo">Fill demo credentials</button>
    </div>

    <template #footer>
      New here? <RouterLink to="/signup">Create an account</RouterLink>
    </template>
  </AuthCard>
</template>
