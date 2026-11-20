<script setup>
import { computed } from 'vue'

const page = defineModel('page', { type: Number, default: 1 })
const props = defineProps({
  totalItems: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  noun: { type: String, default: 'items' },
})

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.pageSize)))
const from = computed(() => (props.totalItems === 0 ? 0 : (page.value - 1) * props.pageSize + 1))
const to = computed(() => Math.min(page.value * props.pageSize, props.totalItems))

// 1 … 4 5 [6] 7 8 … 20
const pages = computed(() => {
  const total = totalPages.value
  const current = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, current, current - 1, current + 1])
  if (current <= 3) [2, 3, 4].forEach((p) => set.add(p))
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => set.add(p))
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, idx) => {
    if (idx && p - sorted[idx - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
})

function go(p) {
  page.value = Math.min(totalPages.value, Math.max(1, p))
}
</script>

<template>
  <nav v-if="totalItems > 0" class="pagination" aria-label="Pagination">
    <p class="pagination__info">
      Showing <strong>{{ from }}–{{ to }}</strong> of <strong>{{ totalItems }}</strong> {{ noun }}
    </p>

    <div v-if="totalPages > 1" class="pagination__controls">
      <button type="button" class="page-btn" :disabled="page === 1" aria-label="First page" @click="go(1)">«</button>
      <button type="button" class="page-btn" :disabled="page === 1" aria-label="Previous page" @click="go(page - 1)">‹</button>

      <template v-for="(p, idx) in pages" :key="`${p}-${idx}`">
        <span v-if="p === '…'" class="page-gap">…</span>
        <button
          v-else
          type="button"
          class="page-btn"
          :class="{ 'page-btn--active': p === page }"
          :aria-current="p === page ? 'page' : undefined"
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>

      <button type="button" class="page-btn" :disabled="page === totalPages" aria-label="Next page" @click="go(page + 1)">›</button>
      <button type="button" class="page-btn" :disabled="page === totalPages" aria-label="Last page" @click="go(totalPages)">»</button>
    </div>
  </nav>
</template>
