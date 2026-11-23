import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { installMatchMedia, setWideViewport } from './test/viewport'

// Sem `globals: true` no Vitest, a Testing Library não desmonta sozinha entre os testes.
afterEach(() => {
  if (typeof window === 'undefined') return
  cleanup()
  setWideViewport(false)
})

// O jsdom não implementa rolagem nem matchMedia. (Os testes do Worker rodam no Node, sem `window`.)
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
  installMatchMedia()
}
