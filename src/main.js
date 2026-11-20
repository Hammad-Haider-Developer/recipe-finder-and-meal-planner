import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'
import { loadUserData } from './stores/session'
import { useUiStore } from './stores/uiStore'
import '@fontsource-variable/plus-jakarta-sans'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

// Pinia must be installed before the router so navigation guards can use stores.
app.use(pinia)
app.use(router)

const ui = useUiStore()
ui.applyTheme()

// Keep several browser tabs in sync (login / logout in another tab).
window.addEventListener('storage', (e) => {
  if (e.key !== 'currentUser' && e.key !== 'users') return
  const auth = useAuthStore()
  auth.syncFromStorage()
  if (auth.isAuthenticated) loadUserData(auth.currentUser.id)
  else if (router.currentRoute.value.meta.requiresAuth) router.replace({ name: 'login' })
})

app.mount('#app')
