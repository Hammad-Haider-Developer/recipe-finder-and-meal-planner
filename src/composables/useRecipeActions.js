import { ref } from 'vue'
import { useRecipeStore } from '../stores/recipeStore'
import { useUiStore } from '../stores/uiStore'

/**
 * Shared behaviour for any screen that lists recipes: favourite toggling,
 * the "add to plan" modal and the create / edit / delete custom-recipe flow.
 */
export function useRecipeActions({ afterDelete } = {}) {
  const store = useRecipeStore()
  const ui = useUiStore()

  const showPlan = ref(false)
  const planPreset = ref(null)
  const showForm = ref(false)
  const editingRecipe = ref(null)

  function toggleFavorite(recipe) {
    const added = store.toggleFavorite(recipe.id)
    ui.toast(added ? `Added "${recipe.name}" to your favorites.` : `Removed "${recipe.name}" from favorites.`, added ? 'success' : 'info')
  }

  function openPlan(recipe) {
    planPreset.value = { recipeId: recipe.id }
    showPlan.value = true
  }

  function openAdd() {
    editingRecipe.value = null
    showForm.value = true
  }

  function openEdit(recipe) {
    editingRecipe.value = recipe
    showForm.value = true
  }

  async function deleteRecipe(recipe) {
    const ok = await ui.confirm({
      title: 'Delete this recipe?',
      message: `"${recipe.name}" will be permanently deleted, together with any favorite or planned meal that uses it. This cannot be undone.`,
      confirmText: 'Delete recipe',
    })
    if (!ok) return false
    store.deleteCustomRecipe(recipe.id)
    ui.toast(`"${recipe.name}" was deleted.`, 'info')
    afterDelete?.(recipe)
    return true
  }

  return { showPlan, planPreset, showForm, editingRecipe, toggleFavorite, openPlan, openAdd, openEdit, deleteRecipe }
}
