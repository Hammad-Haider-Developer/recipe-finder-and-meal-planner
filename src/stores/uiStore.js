import { ref } from 'vue'
import { defineStore } from 'pinia'
import { readJSON, writeJSON } from '../utils/storage'

// Setup-style store: theme, toast notifications and a promise-based confirm dialog.
export const useUiStore = defineStore('ui', () => {
  /* ---------- theme ---------- */
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const theme = ref(readJSON('theme', null) ?? (prefersDark ? 'dark' : 'light'))

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    writeJSON('theme', theme.value)
    applyTheme()
  }

  /* ---------- toasts ---------- */
  const toasts = ref([])
  let toastId = 0

  function toast(message, type = 'success', duration = 3500) {
    const id = ++toastId
    toasts.value.push({ id, message, type })
    if (duration > 0) setTimeout(() => dismissToast(id), duration)
    return id
  }

  function dismissToast(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  /* ---------- confirm dialog ---------- */
  const confirmState = ref(null)

  /** Resolves true when confirmed and false when cancelled. */
  function confirm({ title = 'Are you sure?', message = '', confirmText = 'Confirm', tone = 'danger', icon = '⚠️' } = {}) {
    return new Promise((resolve) => {
      confirmState.value = { title, message, confirmText, tone, icon, resolve }
    })
  }

  function resolveConfirm(answer) {
    confirmState.value?.resolve(answer)
    confirmState.value = null
  }

  return { theme, toggleTheme, applyTheme, toasts, toast, dismissToast, confirmState, confirm, resolveConfirm }
})
