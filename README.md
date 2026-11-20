# 🍲 Recipe Finder & Meal Planner

## Project description

A recipe discovery and weekly meal-planning app. Users create an account, browse **20 sample recipes**, search by name or
ingredient, filter, sort, save favourites, add their own recipes and organise breakfast / lunch / dinner into a weekly plan
that generates a combined shopping list. Everything is stored in `localStorage`, so data survives a browser refresh.

## Main features

| Area | What it does |
|---|---|
| **Auth** | Signup (full name, email, password, confirm) and Login with validation, duplicate-email check, error/success messages, Logout. Session kept in `localStorage`. |
| **Route protection** | Vue Router navigation guard – unauthenticated users are redirected to `/login`; logged-in users are kept out of `/login` and `/signup`. |
| **Dashboard** | Total recipes, favourite recipes, planned meals, meals planned this week (+ today's menu, upcoming meals, category/meal-type bars, slot progress). All values are computed from real data and update live. |
| **Discover** | Search by name **or** ingredient (with “search in” mode), category chips, dietary chips (multi-select), sort (name A–Z/Z–A, prep time, total time, recently added), grid/list view, **pagination** with selectable page size, empty state. |
| **Recipe details** | Image, times, servings, tags, ingredients (tick-off), numbered steps (tick-off + progress), **servings scaler**, favourite, add to plan, related recipes, print. |
| **Favourites** | Separate page with its own search / filter / sort / **pagination**; remove with the heart. |
| **Custom recipes** | Create / edit / delete (with confirmation) through a validated form – dynamic ingredient and step lists, image URL with graceful fallback. |
| **Weekly planner** | Week navigation, day × meal-type grid, add / edit / remove meals (with servings), **drag & drop** between slots, duplicate protection, clear week, tabbed “All planned meals” table (search, filter, sort, **pagination**). |
| **Shopping list** | Combined ingredient list for the selected week, scaled by servings, ticks persisted, copy / print, **pagination**. |
| **UX** | Toasts, confirmation dialogs, loading spinners on login/signup, empty states, dark mode, responsive layout (desktop / tablet / mobile). |

## Technologies used

Vue 3 (Composition API, `<script setup>`) · Pinia · Vue Router 4 · Vite 6 · plain CSS (custom properties, dark mode) ·
Vitest + jsdom (unit tests). Fonts are bundled locally (`@fontsource-variable/plus-jakarta-sans`) – no CDN needed.

## Installation & running

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # serve the production build (http://localhost:4173)
npm test           # 26 unit tests
```

Requires Node 18+ (tested on Node 22).

### Demo account

`demo@recipes.app` / `demo123` – comes with favourites and a pre-filled plan for the current week.
Newly registered users start with an empty plan (to show the empty states).

> ⚠️ Passwords are stored in `localStorage` in plain text. This is a **frontend simulation** for the assignment and must
> never be used for real authentication.

## Data source (API details)

**No API is used.** The 20 recipes live in `src/data/recipes.js` (name, emoji artwork, description, ingredients with
quantity/unit, instructions, prep/cook time, servings, category, dietary tags). `image` is empty by default – the UI shows a
coloured emoji artwork; if a custom recipe has an image URL that fails to load, the same artwork is shown (missing-image handling).

## Folder structure

```
src/
├── components/   AppHeader, RecipeCard, RecipeFilters, PaginationBar, DashboardStats, StatCard, WeekGrid,
│                 PlanMealModal, RecipeFormModal, ShoppingList, PlannedMealsTable, BaseModal, ConfirmModal,
│                 ToastContainer, EmptyState, FormField, PasswordInput, AuthCard, RecipeImage
├── views/        SignupView, LoginView, DashboardView, DiscoverView, RecipeDetailsView, FavoritesView,
│                 MealPlannerView, NotFoundView
├── router/       index.js            routes + navigation guards
├── stores/       authStore.js        users + current session
│                 recipeStore.js      recipes, custom recipes, favourites
│                 plannerStore.js     meal plan, shopping-list ticks, planner stats
│                 uiStore.js          theme, toasts, promise-based confirm dialog
│                 session.js          loads / clears per-user stores
├── composables/  useRecipeFilters.js (search + filter + sort + pagination), useRecipeActions.js
├── utils/        storage.js, validators.js, helpers.js (dates/formatting), ingredients.js, demoData.js
├── data/         recipes.js          20 sample recipes
├── App.vue · main.js · style.css
```

## localStorage layout

```
users                        registered (demo) users
currentUser                  current login session { id, name, email }
recipes:<userId>:custom      the user's custom recipes
recipes:<userId>:favorites   favourite recipe ids
recipes:<userId>:plan        planned meals { id, recipeId, date, mealType, servings }
recipes:<userId>:checked     ticked shopping-list items
theme                        light | dark
```

## Important calculations

* **Total time** = preparation time + cooking time.
* **Servings scaler (details page)** – each ingredient quantity × (selected servings ÷ recipe servings); quantities are formatted to at most 2 decimals.
* **Combined shopping list** – for every planned meal of the selected week, each ingredient is scaled by
  `planned servings ÷ recipe servings`; ingredients with the same name and unit are summed. `kg` is merged into `g` and `l`
  into `ml`, then shown in the friendlier unit (e.g. 1 800 g → **1.8 kg**).
* **Dashboard** – *Planned Meals* = all planned meals across weeks; *Meals This Week* = meals dated Monday–Sunday of the current
  week; *Slots filled* = distinct (day, meal-type) slots used this week out of 21.
* **Search** – case-insensitive; matches the recipe name or any ingredient name; results update as you type (200 ms debounce).
* **Pagination** – `totalPages = ceil(items ÷ pageSize)`; the page is clamped when items disappear and resets to 1 when a filter changes.

## Requirement checklist (from the assignment PDF)

| Requirement | Where |
|---|---|
| Vue 3 + Pinia, reusable components, not one big component | `components/`, `views/`, `stores/` |
| Frontend only, localStorage persistence | `utils/storage.js`, stores |
| Signup / Login / Logout + validation | `SignupView`, `LoginView`, `AppHeader`, `utils/validators.js`, `authStore` |
| Route protection with navigation guards | `router/index.js` |
| CRUD (recipes + meal plan), delete confirmation | `recipeStore`, `plannerStore`, `ConfirmModal` |
| Dashboard with dynamic statistics | `DashboardView`, `DashboardStats` |
| Search, filters, sorting | `useRecipeFilters`, `RecipeFilters` |
| Form validation with clear messages | `validators.js`, `FormField` |
| Vue concepts: props, events, `v-model`, `v-for/if/else`, `ref`/`reactive`, computed, methods, watchers, lifecycle hooks | see “Demo guide” |
| Pinia: stores, state, getters, actions, shared state, localStorage sync | `stores/` |
| Vue Router with `/signup`, `/login`, `/dashboard` + project routes | `router/index.js` |
| Responsive, empty states, loading indicators, success feedback | `style.css`, `EmptyState`, toasts |
| Recipe fields, favourites, weekly planner, ingredient list, missing-image / no-results handling | `data/recipes.js`, planner components, `RecipeImage` |

Routes: `/signup` · `/login` · `/dashboard` · `/recipes` · `/recipes/:id` · `/favorites` · `/planner`

## Demo guide (how to explain the project)

* **How it works** – `main.js` installs Pinia + Router; `App.vue` is only a shell (header, `<RouterView>`, toasts, confirm dialog).
* **Components, props, events** – `RecipeCard` receives `recipe` / `isFavorite` props and emits `toggle-favorite`, `plan`, `edit`, `delete`; `PaginationBar` uses `defineModel` (`v-model:page`).
* **Pinia** – options stores (state/getters/actions) for auth, recipes and planner; setup store for UI. Components read the same state (header badge, dashboard, favourites page all react to one `favoriteIds` array). Actions write to `localStorage` after each change.
* **localStorage** – `utils/storage.js` wraps JSON read/write in try/catch; per-user keys are loaded by the router guard via `stores/session.js`.
* **Validation** – pure functions in `utils/validators.js` return `{ valid, errors }`; forms show messages after blur or submit.
* **Route protection** – `router.beforeEach` checks `meta.requiresAuth` / `meta.guestOnly` against `authStore.isAuthenticated`.
* **Vue concepts** – watchers: debounced search, page clamping, servings pre-fill; lifecycle: modal Esc handler (`onMounted`/`onBeforeUnmount`), count-up animation; `reactive` forms, `ref` state, `computed` filtering/sorting/stats, `v-if/v-else` empty & loading states.
* **No API** – everything is local sample data, so there is no API error handling to demonstrate; image-load failures are handled instead.

## Screenshots

See the [`screenshots/`](./screenshots) folder – signup (validation), login (error), dashboard, discover (grid, filters, empty search),
recipe details, favourites, weekly planner, add-meal modal, shopping list, all planned meals, recipe form validation, dark mode,
and mobile views.

## Testing

* `npm test` – 26 unit tests (stores, validators, filters/pagination, ingredient combining).
* The app was also verified end-to-end in a real browser (signup → login → search/filter/sort/pagination → favourites → custom
  recipe CRUD → planner → shopping list → logout, route guards, persistence after reload, no horizontal overflow on tablet/mobile).
