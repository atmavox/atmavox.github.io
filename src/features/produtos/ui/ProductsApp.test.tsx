import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../../../shared/auth/AuthContext'
import { InMemoryAuth } from '../../../shared/auth/InMemoryAuth'
import { createAuthSession } from '../../../shared/auth/session'
import { CatalogContext } from '../../../shared/catalog/CatalogContext'
import { createCatalogStore } from '../../../shared/catalog/catalogStore'
import { setWideViewport } from '../../../test/viewport'
import { createInMemoryProductsBackend } from '../infrastructure/productsBackend'
import { ProdutosEntry } from '../ProdutosEntry'
import { ProductsApp } from './ProductsApp'

function setup() {
  const backend = createInMemoryProductsBackend()
  const catalog = createCatalogStore({})
  return { backend, catalog }
}

describe('Modo Andreía de produtos no computador', () => {
  it('edita um produto, vê como fica no hub e salva', async () => {
    setWideViewport(true)
    const { backend, catalog } = setup()
    render(<ProductsApp backend={backend} catalog={catalog} />)

    fireEvent.click(screen.getByRole('button', { name: /A Chama Interna/ }))
    await screen.findByRole('radiogroup', { name: 'Grátis ou paga' })
    fireEvent.click(screen.getByRole('radio', { name: 'Paga' }))
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '97' } })

    fireEvent.click(screen.getByRole('button', { name: 'Ver como fica no hub' }))
    const preview = screen.getByRole('dialog', { name: 'Como fica no hub' })
    expect(within(preview).getAllByText('R$ 97').length).toBeGreaterThan(0)
    fireEvent.click(within(preview).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Salvo ✓'))
    expect(backend.free.get('chama-interna-21')).toBe(false)
    const saved = catalog.getSnapshot().find((p) => p.id === 'chama-interna-21')
    expect(saved?.pricing).toEqual({ type: 'paid', priceCents: 9700, accessMonths: 12 })
    setWideViewport(false)
  })

  it('formulário com erro não salva e aponta o campo', async () => {
    setWideViewport(true)
    const { backend, catalog } = setup()
    render(<ProductsApp backend={backend} catalog={catalog} />)
    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Dê um nome ao produto.')).toBeInTheDocument()
    expect(backend.catalog).toBeNull()
    setWideViewport(false)
  })
})

describe('Modo Andreía de produtos no celular', () => {
  it('cria uma meditação passo a passo, revisa e salva', async () => {
    setWideViewport(false)
    const { backend, catalog } = setup()
    render(<ProductsApp backend={backend} catalog={catalog} />)
    fireEvent.click(screen.getByRole('button', { name: 'Novo' }))

    expect(screen.getByText('Passo 1 de 5 · Tipo')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Meditação' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar →' }))

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Pausa da tarde' } })
    fireEvent.change(screen.getByLabelText('Link do áudio'), {
      target: { value: 'https://cdn.example/pausa.m4a' },
    })
    fireEvent.change(screen.getByLabelText('Duração (minutos)'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Grupo'), { target: { value: 'Durante o dia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar →' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar →' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar →' }))

    expect(screen.getByText('Passo 5 de 5 · Revisar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Voltar para arrumar/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(backend.catalog?.some((p) => p.id === 'pausa-da-tarde')).toBe(true))
    expect(backend.contents.get('pausa-da-tarde')).toEqual({
      audioUrl: 'https://cdn.example/pausa.m4a',
    })
  })
})

describe('porta de entrada do Modo Andreía', () => {
  it('quem não é admin vê o aviso', async () => {
    const auth = new InMemoryAuth()
    const session = createAuthSession({
      loadAuth: async () => auth,
      hint: { get: () => false, set: () => {} },
    })
    await session.signInWithGoogle()
    render(
      <AuthContext.Provider value={session}>
        <CatalogContext.Provider value={createCatalogStore({})}>
          <ProdutosEntry backend={createInMemoryProductsBackend(false)} />
        </CatalogContext.Provider>
      </AuthContext.Provider>,
    )
    expect(await screen.findByText('Esta área é só da Andreía.')).toBeInTheDocument()
  })
})
