import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../../../shared/auth/AuthContext'
import { InMemoryAuth } from '../../../shared/auth/InMemoryAuth'
import { createAuthSession } from '../../../shared/auth/session'
import { CatalogContext } from '../../../shared/catalog/CatalogContext'
import { createCatalogStore } from '../../../shared/catalog/catalogStore'
import { TerritoryContext } from '../../../shared/catalog/TerritoryContext'
import { createTerritoryStore } from '../../../shared/catalog/territoryStore'
import { setWideViewport } from '../../../test/viewport'
import { seedCatalog } from '../../../shared/catalog/seedCatalog'
import { createInMemoryAccessAdmin } from '../infrastructure/accessAdmin'
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

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Salvo'))
    expect(backend.free.get('chama-interna-21')).toBe(false)
    const saved = catalog.getSnapshot().find((p) => p.id === 'chama-interna-21')
    expect(saved?.pricing).toEqual({ type: 'paid', priceCents: 9700, accessMonths: 12 })
    setWideViewport(false)
  })

  it('jornada nova em partes, com títulos dos dias: catálogo com 3 cartões e títulos no rascunho', async () => {
    setWideViewport(true)
    const { backend, catalog } = setup()
    render(<ProductsApp backend={backend} catalog={catalog} />)
    fireEvent.click(screen.getByRole('button', { name: 'Novo produto' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Florescer' } })

    fireEvent.click(screen.getByRole('radio', { name: 'Em partes' }))
    fireEvent.click(screen.getByRole('button', { name: '+ Parte' }))
    fireEvent.change(screen.getByLabelText('Nome: Parte 1'), { target: { value: 'Descobrindo' } })
    fireEvent.change(screen.getByLabelText('Nome: Parte 2'), { target: { value: 'Desabrochando' } })
    fireEvent.click(screen.getByRole('button', { name: 'Parte 1 termina um dia antes' }))
    // As setas trocam os nomes de lugar; as faixas de dias ficam.
    fireEvent.click(screen.getByRole('button', { name: 'Mover Parte 2 para cima' }))

    fireEvent.click(screen.getByRole('button', { name: /Títulos dos dias/ }))
    fireEvent.change(screen.getByLabelText('Nome: Dia 2'), { target: { value: 'Chegada' } })
    fireEvent.change(screen.getByLabelText('Nome: Dia 12'), { target: { value: 'Raiz' } })

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Salvo'))
    expect(catalog.getSnapshot().find((p) => p.id === 'florescer')).toMatchObject({
      structure: 'parts',
      dayCount: 21,
      themes: [
        { label: '1', title: 'Desabrochando', lastDay: 9 },
        { label: '2', title: 'Descobrindo' },
      ],
      previewDays: ['Chegada', 'Raiz'],
    })
    expect(backend.dayTitles.get('florescer')?.slice(0, 2)).toEqual(['', 'Chegada'])
    setWideViewport(false)
  })

  it('jornada com conteúdo salvo no editor: a estrutura fica travada', async () => {
    setWideViewport(true)
    const { backend, catalog } = setup()
    backend.draftJourneys.add('ritual-matinal')
    render(<ProductsApp backend={backend} catalog={catalog} />)
    fireEvent.click(screen.getByRole('button', { name: /Ritual Matinal/ }))
    expect(await screen.findByText('Esta jornada já tem conteúdo salvo.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Um dia a mais' })).toBeDisabled()
    setWideViewport(false)
  })

  it('descarta um produto que não está publicado (e a Chama, publicada, não tem o botão)', async () => {
    setWideViewport(true)
    const { backend, catalog } = setup()
    backend.dayTitles.set('ritual-matinal', ['Chegada'])
    render(<ProductsApp backend={backend} catalog={catalog} />)

    fireEvent.click(screen.getByRole('button', { name: /A Chama Interna/ }))
    await screen.findByRole('radiogroup', { name: 'Grátis ou paga' })
    expect(screen.queryByRole('button', { name: 'Descartar' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Ritual Matinal/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Descartar' }))
    const dialog = screen.getByRole('dialog', { name: 'Descartar "Ritual Matinal"?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Descartar' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('foi descartado'))
    expect(catalog.getSnapshot().some((p) => p.id === 'ritual-matinal')).toBe(false)
    expect(backend.dayTitles.has('ritual-matinal')).toBe(false)
    setWideViewport(false)
  })

  it('território: busca que cria um novo, com a cor, e já escolhe', async () => {
    localStorage.clear()
    setWideViewport(true)
    const { backend, catalog } = setup()
    const territories = createTerritoryStore({})
    render(
      <TerritoryContext.Provider value={territories}>
        <ProductsApp backend={backend} catalog={catalog} />
      </TerritoryContext.Provider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /A Chama Interna/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Estado Cinza/ }))
    const search = screen.getByRole('combobox', { name: 'Buscar ou criar território' })
    expect(search).toHaveFocus()
    fireEvent.change(search, { target: { value: 'Corpo' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Mar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Criar e escolher' }))

    await waitFor(() =>
      expect(backend.territories).toEqual([{ id: 'corpo', name: 'Corpo', tone: 'sea' }]),
    )
    expect(territories.getSnapshot().at(-1)?.id).toBe('corpo')
    expect(screen.getByRole('button', { name: /Corpo/ })).toBeInTheDocument()
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

describe('território no celular', () => {
  it('a lista sobe; "Novo território" desliza para o segundo passo e cria', async () => {
    localStorage.clear()
    setWideViewport(false)
    const { backend, catalog } = setup()
    render(
      <TerritoryContext.Provider value={createTerritoryStore({})}>
        <ProductsApp backend={backend} catalog={catalog} />
      </TerritoryContext.Provider>,
    )
    fireEvent.click(screen.getByRole('button', { name: /Ritual Matinal/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Presença/ }))
    expect(screen.getByRole('dialog', { name: 'Território' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Novo território' }))
    fireEvent.change(screen.getByLabelText('Nome do território'), { target: { value: 'Raiz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar território' }))
    await waitFor(() => expect(backend.territories?.[0]?.id).toBe('raiz'))
    expect(screen.queryByRole('dialog')).toBeNull()
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

describe('duplicar no editor do produto', () => {
  it('cria a cópia como rascunho, com o conteúdo do código, e já abre ela', async () => {
    setWideViewport(true)
    const { backend, catalog } = setup()
    render(
      <ProductsApp
        backend={backend}
        catalog={catalog}
        loadBuiltInJourney={async (id) => JSON.stringify({ id, weeks: [] })}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /A Chama Interna/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Duplicar' }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('criada como rascunho'),
    )
    const copy = catalog.getSnapshot().find((p) => p.title.endsWith(' - Cópia'))
    expect(copy?.status).toBe('draft')
    expect(JSON.parse(backend.journeyDrafts.get(copy!.id)!).id).toBe(copy!.id)
    expect(screen.getByLabelText('Nome')).toHaveValue(copy!.title)
    setWideViewport(false)
  })
})

describe('inativar produto (Disponível e Indisponível)', () => {
  it('mostra quem acessou, confirma, vai para o grupo Indisponíveis e volta ao ar', async () => {
    setWideViewport(true)
    const { backend, catalog } = setup()
    catalog.replace(
      seedCatalog.map((p) =>
        p.id === 'chama-interna-21'
          ? { ...p, pricing: { type: 'paid' as const, priceCents: 9700, accessMonths: 12 } }
          : p,
      ),
    )
    const accessAdmin = createInMemoryAccessAdmin()
    const nextYear = Date.now() + 365 * 24 * 60 * 60 * 1000
    await accessAdmin.grant('ana', 'chama-interna-21', nextYear)
    accessAdmin.opened.push({ uid: 'ana', productId: 'chama-interna-21', lastOpenedAt: 1 })
    render(<ProductsApp backend={backend} catalog={catalog} accessAdmin={accessAdmin} />)

    fireEvent.click(screen.getByRole('button', { name: /A Chama Interna/ }))
    // Conta quem de fato abriu, não quem só tem o acesso liberado.
    expect(await screen.findByText('pessoa já acessou')).toBeInTheDocument()
    expect(screen.getByText('último acesso vence')).toBeInTheDocument()
    const situation = screen.getByRole('radiogroup', { name: 'Situação' })
    expect(within(situation).getByRole('radio', { name: 'Rascunho' })).toBeDisabled()
    expect(within(situation).getByRole('radio', { name: 'Em breve' })).toBeDisabled()
    // Publicada e com acesso: não se descarta, só se inativa.
    expect(screen.queryByRole('button', { name: 'Descartar' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Inativar produto' }))
    const dialog = screen.getByRole('dialog', { name: 'Inativar "A Chama Interna"?' })
    expect(dialog).toHaveTextContent('1 pessoa ainda tem acesso')
    expect(dialog).toHaveTextContent('Em recolhimento')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Inativar produto' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('ficou indisponível'))
    const retired = catalog.getSnapshot().find((p) => p.id === 'chama-interna-21')
    expect(retired?.status).toBe('retired')
    expect(retired?.retiredAt).toBeTypeOf('number')
    expect(screen.getByRole('button', { name: /Indisponíveis · 1/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Publicar de novo' }))
    await waitFor(() =>
      expect(catalog.getSnapshot().find((p) => p.id === 'chama-interna-21')?.status).toBe(
        'published',
      ),
    )
    expect(screen.queryByRole('button', { name: /Indisponíveis/ })).toBeNull()
    setWideViewport(false)
  })
})

describe('descartar um Indisponível', () => {
  it('só aparece se ninguém nunca acessou', async () => {
    setWideViewport(true)
    const { backend, catalog } = setup()
    const paid = { type: 'paid' as const, priceCents: 9700, accessMonths: 12 }
    catalog.replace(
      seedCatalog.map((p) =>
        p.id === 'ritual-matinal' || p.id === 'retorne-ao-seu-centro'
          ? { ...p, status: 'retired' as const, pricing: paid }
          : p,
      ),
    )
    const accessAdmin = createInMemoryAccessAdmin()
    await accessAdmin.grant('ana', 'retorne-ao-seu-centro', null)
    render(<ProductsApp backend={backend} catalog={catalog} accessAdmin={accessAdmin} />)
    fireEvent.click(screen.getByRole('button', { name: /Indisponíveis · 2/ }))

    fireEvent.click(screen.getByRole('button', { name: /Retorne ao seu centro/i }))
    await screen.findByRole('button', { name: 'Publicar de novo' })
    expect(screen.queryByRole('button', { name: 'Descartar' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Ritual Matinal/ }))
    expect(await screen.findByRole('button', { name: 'Descartar' })).toBeInTheDocument()
    setWideViewport(false)
  })
})

describe('barra dos botões do editor', () => {
  it('avisa "Alterações não salvas" até salvar', async () => {
    setWideViewport(true)
    const { backend, catalog } = setup()
    render(<ProductsApp backend={backend} catalog={catalog} />)
    fireEvent.click(screen.getByRole('button', { name: /A Chama Interna/ }))
    const name = await screen.findByLabelText('Nome')
    expect(screen.queryByText('Alterações não salvas')).toBeNull()
    fireEvent.change(name, { target: { value: 'A Chama Interna!' } })
    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(screen.queryByText('Alterações não salvas')).toBeNull())
    setWideViewport(false)
  })
})
