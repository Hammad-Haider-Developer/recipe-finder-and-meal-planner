<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="auth-page">
    <aside class="auth-hero">
      <div class="auth-hero__inner">
        <span class="auth-hero__logo">🍲</span>
        <h1>Recipe Finder<br />&amp; Meal Planner</h1>
        <p>Discover delicious recipes, save your favourites and plan every meal of the week - all in one place.</p>
        <ul class="auth-hero__list">
          <li>🔎 Search 20+ recipes by name or ingredient</li>
          <li>❤️ Save favourites that stay after refresh</li>
          <li>🗓️ Build a weekly plan with a smart shopping list</li>
        </ul>
        <div class="auth-hero__emojis" aria-hidden="true">
          <span>🥞</span><span>🍛</span><span>🥗</span><span>🍝</span><span>🍰</span>
        </div>
      </div>
    </aside>

    <section class="auth-panel">
      <div class="auth-card">
        <header>
          <h2>{{ title }}</h2>
          <p v-if="subtitle">{{ subtitle }}</p>
        </header>
        <slot />
        <footer v-if="$slots.footer" class="auth-card__footer"><slot name="footer" /></footer>
      </div>
    </section>
  </div>
</template>
