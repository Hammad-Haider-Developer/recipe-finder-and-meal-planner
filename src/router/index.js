import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { loadUserData } from '../stores/session'

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/SignupView.vue'),
    meta: { guestOnly: true, title: 'Create account' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true, title: 'Log in' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Dashboard' },
  },
  {
    path: '/recipes',
    name: 'recipes',
    component: () => import('../views/DiscoverView.vue'),
    meta: { requiresAuth: true, title: 'Discover Recipes' },
  },
  {
    path: '/recipes/:id',
    name: 'recipe-details',
    component: () => import('../views/RecipeDetailsView.vue'),
    meta: { requiresAuth: true, title: 'Recipe Details' },
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('../views/FavoritesView.vue'),
    meta: { requiresAuth: true, title: 'Favorite Recipes' },
  },
  {
    path: '/planner',
    name: 'planner',
    component: () => import('../views/MealPlannerView.vue'),
    meta: { requiresAuth: true, title: 'Weekly Meal Planner' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: 'Page not found' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved ?? { top: 0 },
})

// Navigation guard: protects every route flagged with `requiresAuth`.
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  if (auth.isAuthenticated) {
    // Make sure the logged-in user's recipes / favourites / plan are loaded.
    loadUserData(auth.currentUser.id)
  }
})

router.afterEach((to) => {
  document.title = `${to.meta.title ?? 'Recipe Planner'} · Recipe Finder & Meal Planner`
})

export default router
