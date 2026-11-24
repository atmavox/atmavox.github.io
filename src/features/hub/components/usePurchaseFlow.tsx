import { useState, type ReactNode } from 'react'
import type { Product } from '../../../shared/catalog/product'
import { PriceDialog } from './PriceDialog'
import { useAccessGate } from './useAccessGate'

const hrefOf = (product: Product) =>
  product.kind === 'journey' ? '#/jornadas' : `#/meditacao/${product.id}`

/**
 * Fluxo de um produto pago no hub (F9, ADR-020): antes do preço, as travas (entrar, confirmar o e-mail
 * e completar o cadastro: `useAccessGate`); depois, a janela de preço. Grátis não passa por aqui.
 */
export function usePurchaseFlow(): {
  isLogged: boolean
  /** Já passa pelas travas (entrou, confirmou o e-mail e completou o cadastro). */
  passes: boolean
  start: (product: Product) => void
  /** Grátis que pede as travas (meditação fora da página inicial): só as travas, sem preço. */
  unlock: (product: Product) => void
  dialogs: ReactNode
} {
  const gate = useAccessGate()
  const [priced, setPriced] = useState<Product | null>(null)
  const close = () => setPriced(null)
  const start = (product: Product) => gate.start(product, hrefOf(product), () => setPriced(product))

  return {
    isLogged: gate.isLogged,
    passes: gate.passes,
    start,
    unlock: (product: Product) => gate.start(product, hrefOf(product), () => {}),
    dialogs: (
      <>
        {gate.dialogs}
        {priced && <PriceDialog product={priced} onClose={close} />}
      </>
    ),
  }
}
