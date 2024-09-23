import { ref, type Ref } from 'vue'

/**
 * Reactively track window focus with `window.onfocus` and `window.onblur`.
 *
 * @see https://vueuse.org/useWindowFocus for original
 */
export function useWindowFocus(): Ref<boolean> {
  const focused = ref(window.document.hasFocus())

  // @ts-ignore
  window.addEventListener('blur', () => {
    focused.value = false
  })

  // @ts-ignore
  window.addEventListener('focus', () => {
    focused.value = true
  })

  return focused
}
