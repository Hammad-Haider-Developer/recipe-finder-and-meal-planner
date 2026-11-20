import { defineStore } from 'pinia'
import { readJSON, writeJSON, removeKey } from '../utils/storage'
import { uid, initials } from '../utils/helpers'
import { clearUserData } from './session'
import { DEMO_USER_ID } from '../utils/demoData'

// localStorage
// ├── users        -> every registered (demo) account
// └── currentUser  -> the active login session  { id, name, email }
//
// NOTE: storing passwords in localStorage is NOT secure. This is a frontend
// simulation for the assignment and must never be used in production.

const USERS_KEY = 'users'
const SESSION_KEY = 'currentUser'

export const DEMO_ACCOUNT = { name: 'Demo User', email: 'demo@recipes.app', password: 'demo123' }

function loadUsers() {
  const users = readJSON(USERS_KEY, null)
  if (Array.isArray(users) && users.length) return users
  // First run: seed one demo account so the app can be explored immediately.
  const seeded = [{ id: DEMO_USER_ID, createdAt: new Date().toISOString(), ...DEMO_ACCOUNT }]
  writeJSON(USERS_KEY, seeded)
  return seeded
}

function loadSession(users) {
  const session = readJSON(SESSION_KEY, null)
  // Drop stale sessions whose account no longer exists.
  if (session && users.some((u) => u.id === session.id)) return session
  removeKey(SESSION_KEY)
  return null
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const users = loadUsers()
    return { users, currentUser: loadSession(users) }
  },

  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    firstName: (state) => state.currentUser?.name?.split(' ')[0] ?? '',
    userInitials: (state) => initials(state.currentUser?.name),
  },

  actions: {
    signup({ name, email, password }) {
      const normalized = email.trim().toLowerCase()
      if (this.users.some((u) => u.email === normalized)) {
        return { ok: false, field: 'email', error: 'An account with this email already exists.' }
      }
      const user = { id: uid('u'), name: name.trim(), email: normalized, password, createdAt: new Date().toISOString() }
      this.users.push(user)
      writeJSON(USERS_KEY, this.users)
      return { ok: true, user }
    },

    login({ email, password }) {
      const normalized = email.trim().toLowerCase()
      const user = this.users.find((u) => u.email === normalized)
      if (!user) return { ok: false, error: 'No account found with this email address.' }
      if (user.password !== password) return { ok: false, error: 'Incorrect password. Please try again.' }
      this.currentUser = { id: user.id, name: user.name, email: user.email }
      writeJSON(SESSION_KEY, this.currentUser)
      return { ok: true }
    },

    logout() {
      this.currentUser = null
      removeKey(SESSION_KEY)
      clearUserData()
    },

    /** Called when another browser tab changes the session. */
    syncFromStorage() {
      this.users = readJSON(USERS_KEY, this.users)
      this.currentUser = loadSession(this.users)
      if (!this.currentUser) clearUserData()
    },
  },
})
