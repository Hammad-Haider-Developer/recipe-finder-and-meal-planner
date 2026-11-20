<script setup>
import { computed, ref, watch } from 'vue'
import EmptyState from './EmptyState.vue'
import PaginationBar from './PaginationBar.vue'
import { useUiStore } from '../stores/uiStore'

const props = defineProps({
  items: { type: Array, required: true },
  checked: { type: Array, default: () => [] }, // keys of ticked items
  weekLabel: { type: String, default: '' },
})
const emit = defineEmits(['toggle'])
const ui = useUiStore()

// Long lists are paginated (ticking items still counts across every page).
const page = ref(1)
const pageSize = 16
const paged = computed(() => props.items.slice((page.value - 1) * pageSize, page.value * pageSize))
watch(
  () => props.items.length,
  (len) => {
    page.value = Math.min(page.value, Math.max(1, Math.ceil(len / pageSize)))
  },
)

const doneCount = computed(() => props.items.filter((i) => props.checked.includes(i.key)).length)
const percent = computed(() => (props.items.length ? Math.round((doneCount.value / props.items.length) * 100) : 0))

function line(i) {
  return `${i.qtyLabel}${i.unit === 'pcs' ? '' : ' ' + i.unit} ${i.name}`
}

function printList() {
  window.print()
}

async function copyList() {
  const text = [`Shopping list - ${props.weekLabel}`, ...props.items.map((i) => `${props.checked.includes(i.key) ? '[x]' : '[ ]'} ${line(i)}`)].join('\n')
  try {
    await navigator.clipboard.writeText(text)
    ui.toast('Shopping list copied to clipboard.')
  } catch {
    ui.toast('Could not copy automatically - please select and copy the list manually.', 'warning')
  }
}
</script>

<template>
  <section class="card shopping">
    <template v-if="items.length">
      <header class="shopping__head">
        <div>
          <h3>🛒 Combined ingredient list</h3>
          <p class="muted">{{ doneCount }} of {{ items.length }} items collected</p>
        </div>
        <div class="shopping__actions">
          <button type="button" class="btn btn-ghost btn-sm" @click="copyList">📋 Copy</button>
          <button type="button" class="btn btn-ghost btn-sm" @click="printList">🖨️ Print</button>
        </div>
      </header>

      <div class="progress" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100">
        <div class="progress__bar" :style="{ width: percent + '%' }"></div>
      </div>

      <TransitionGroup name="list" tag="ul" class="shopping__list">
        <li v-for="i in paged" :key="i.key" :class="{ 'is-done': checked.includes(i.key) }">
          <label>
            <input type="checkbox" :checked="checked.includes(i.key)" @change="emit('toggle', i.key)" />
            <span class="shopping__qty">{{ i.qtyLabel }}{{ i.unit === 'pcs' ? '' : ' ' + i.unit }}</span>
            <span class="shopping__name">{{ i.name }}</span>
          </label>
          <small class="muted" :title="i.recipes.join(', ')">{{ i.recipes.length === 1 ? i.recipes[0] : `${i.recipes.length} recipes` }}</small>
        </li>
      </TransitionGroup>
      <PaginationBar v-model:page="page" :total-items="items.length" :page-size="pageSize" noun="ingredients" />
    </template>

    <EmptyState v-else icon="🛒" title="Nothing to shop for yet" message="Plan some meals for this week and the ingredients will be combined here automatically." />
  </section>
</template>
