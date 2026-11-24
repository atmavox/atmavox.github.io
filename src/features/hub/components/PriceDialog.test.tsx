import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '../../../shared/catalog/product'
import { seedCatalog } from '../../../shared/catalog/seedCatalog'
import { PriceDialog } from './PriceDialog'

const paid: Product = {
  ...seedCatalog[0]!,
  id: 'raizes',
  title: 'Raízes',
  pricing: { type: 'paid', priceCents: 6700, accessMonths: 12 },
}

describe('janela de preço: simular pagamento (só admins)', () => {
  it('quem não é admin não vê a caixinha', () => {
    render(<PriceDialog product={paid} onClose={() => {}} canSimulate={false} />)
    expect(screen.queryByRole('checkbox', { name: /Simular pagamento/ })).toBeNull()
  })

  it('a admin marca, simula e cai na tela de pagamento aprovado, sem passar pelo Mercado Pago', async () => {
    window.location.hash = '#/jornadas'
    const simulate = vi.fn(async () => {})
    render(<PriceDialog product={paid} onClose={() => {}} canSimulate simulate={simulate} />)
    // Desmarcada, segue o pagamento de sempre.
    expect(screen.queryByRole('button', { name: 'Simular pagamento' })).toBeNull()

    fireEvent.click(screen.getByRole('checkbox', { name: /Simular pagamento/ }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Simular pagamento' }))
    })
    expect(simulate).toHaveBeenCalledWith(paid)
    expect(window.location.hash).toBe('#/pagamento/aprovado/raizes')
  })

  it('se não der para simular, avisa e fica na janela', async () => {
    const simulate = vi.fn(async () => {
      throw new Error('403')
    })
    render(<PriceDialog product={paid} onClose={() => {}} canSimulate simulate={simulate} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /Simular pagamento/ }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Simular pagamento' }))
    })
    expect(screen.getByRole('alert')).toHaveTextContent('Não deu para simular o pagamento')
  })
})
