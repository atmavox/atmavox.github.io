import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { JourneysHub } from './JourneysHub'

beforeEach(() => localStorage.clear())

describe('hub de jornadas no computador', () => {
  it('abre na visão expandida, com os filtros abertos e as jornadas por território', () => {
    render(<JourneysHub layout="wide" />)
    expect(screen.getByRole('button', { name: 'Expandida' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('complementary', { name: 'Filtros' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Estado Cinza/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'A Chama Interna' })).toBeInTheDocument()
  })

  it('sem login não mostra preço; a grátis fica sem tag', () => {
    render(<JourneysHub layout="wide" />)
    expect(document.body.textContent).not.toMatch(/R\$|Grátis/)
  })

  it('a busca filtra e, sem resultado, oferece limpar os filtros', () => {
    render(<JourneysHub layout="wide" />)
    const search = screen.getByRole('searchbox', { name: 'Buscar jornada ou tema' })
    fireEvent.change(search, { target: { value: 'ritual' } })
    expect(screen.queryByRole('heading', { name: 'A Chama Interna' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Ritual Matinal' })).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'nada disso' } })
    expect(screen.getByText('Nenhuma jornada com esses filtros.')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0]!)
    expect(screen.getByRole('heading', { name: 'A Chama Interna' })).toBeInTheDocument()
  })

  it('filtra por "Em breve" e por território', () => {
    render(<JourneysHub layout="wide" />)
    const aside = screen.getByRole('complementary', { name: 'Filtros' })
    fireEvent.click(within(aside).getByRole('button', { name: 'Em breve' }))
    expect(screen.queryByRole('heading', { name: 'A Chama Interna' })).toBeNull()
    fireEvent.click(within(aside).getByRole('button', { name: 'Todas' }))
    fireEvent.click(within(aside).getByRole('button', { name: /^Estado Cinza/ }))
    expect(screen.queryByRole('heading', { name: 'Ritual Matinal' })).toBeNull()
  })

  it('recolhe os filtros e leva a busca para a barra', () => {
    render(<JourneysHub layout="wide" />)
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar filtros' }))
    expect(screen.queryByRole('complementary', { name: 'Filtros' })).toBeNull()
    expect(screen.getByRole('searchbox', { name: 'Buscar jornada ou tema' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mostrar filtros' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('troca para a compacta e lembra a escolha no aparelho', () => {
    const { unmount } = render(<JourneysHub layout="wide" />)
    fireEvent.click(screen.getByRole('button', { name: 'Compacta' }))
    expect(screen.getByRole('button', { name: 'Compacta' })).toHaveAttribute('aria-pressed', 'true')
    unmount()
    render(<JourneysHub layout="wide" />)
    expect(screen.getByRole('button', { name: 'Compacta' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('hub de jornadas no celular', () => {
  it('abre na compacta e o botão Filtros esconde a busca e os filtros', () => {
    render(<JourneysHub layout="narrow" />)
    expect(screen.getByRole('button', { name: 'Compacta' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }))
    expect(screen.queryByRole('searchbox')).toBeNull()
  })

  it('a expandida agrupa por território', () => {
    render(<JourneysHub layout="narrow" />)
    fireEvent.click(screen.getByRole('button', { name: 'Expandida' }))
    expect(screen.getByRole('heading', { level: 2, name: /Presença/ })).toBeInTheDocument()
  })
})
