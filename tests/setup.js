import { beforeEach } from 'vitest'

// jsdom does not implement these browser APIs.
Element.prototype.scrollIntoView = () => {}
window.scrollTo = () => {}

beforeEach(() => {
  localStorage.clear()
})
