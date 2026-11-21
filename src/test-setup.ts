import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Sem `globals: true` no Vitest, a Testing Library não desmonta sozinha entre os testes.
afterEach(cleanup)

// O jsdom não implementa rolagem; as telas rolam ao topo quando a aba muda.
window.scrollTo = () => {}
