import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { installMatchMedia, setWideViewport } from './test/viewport'

// Sem `globals: true` no Vitest, a Testing Library não desmonta sozinha entre os testes.
afterEach(() => {
  cleanup()
  setWideViewport(false)
})

// O jsdom não implementa rolagem nem matchMedia.
window.scrollTo = () => {}
Element.prototype.scrollIntoView = () => {}
installMatchMedia()
