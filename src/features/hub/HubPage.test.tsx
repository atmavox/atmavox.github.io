import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setWideViewport } from '../../test/viewport'
import { HubPage } from './HubPage'
import { hubSectionFromPath, tabOfSection } from './navigation'

/** Nenhum marcador de conteúdo faltando ("[FOTO]", "[DIA · HORA]"…) pode chegar ao site publicado. */
function expectNoPlaceholders() {
  expect(document.body.textContent).not.toMatch(/\[[^\]]*\]/)
}

describe('navegação do hub', () => {
  it('lê a seção do caminho e cai no início quando não conhece', () => {
    expect(hubSectionFromPath('/')).toBe('inicio')
    expect(hubSectionFromPath('/ouvir')).toBe('ouvir')
    expect(hubSectionFromPath('/qualquer')).toBe('inicio')
  })

  it('no celular, "encontros" abre a aba Início (onde eles ficam)', () => {
    expect(tabOfSection('encontros')).toBe('inicio')
    expect(tabOfSection('jornadas')).toBe('jornadas')
  })
})

describe('hub no celular (abas)', () => {
  it('mostra o slogan, a barra de abas e marca a aba atual', () => {
    render(<HubPage path="/" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Consciência, presença e expansão.',
    )
    const tabs = screen.getByRole('navigation', { name: 'Seções' })
    expect(within(tabs).getByRole('link', { name: 'Início' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(tabs).getByRole('link', { name: 'Ouvir' })).toHaveAttribute('href', '#/ouvir')
    expectNoPlaceholders()
  })

  it('sem horário definido, os encontros apontam para o Instagram', () => {
    render(<HubPage path="/" />)
    expect(screen.getAllByRole('link', { name: 'Horários no Instagram' })).toHaveLength(2)
  })

  it('sem MP3, o play do áudio grátis abre o vídeo do YouTube', () => {
    render(<HubPage path="/" />)
    fireEvent.click(screen.getByRole('button', { name: 'Ouvir Retorne ao Seu Centro' }))
    expect(document.querySelector('iframe')?.getAttribute('src')).toContain(
      'youtube-nocookie.com/embed/jKuKSAQUTCA',
    )
  })

  it('a aba Jornadas leva à jornada e ao WhatsApp', () => {
    render(<HubPage path="/jornadas" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Jornadas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /A Chama Interna/ })).toHaveAttribute(
      'href',
      '#/jornada',
    )
    expect(screen.getByRole('link', { name: /Ritual Matinal/ }).getAttribute('href')).toContain(
      'wa.me',
    )
  })

  it('a aba Contato mostra o nome oficial e a assinatura', () => {
    render(<HubPage path="/contato" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Andreía Oliveirà' })).toBeInTheDocument()
    expect(screen.getByText('Com presença — Andreía Oliveirà')).toBeInTheDocument()
    expectNoPlaceholders()
  })
})

describe('hub no computador (revista)', () => {
  it('mostra o menu no topo e todas as seções numa página só', () => {
    setWideViewport(true)
    render(<HubPage path="/" />)

    const menu = screen.getByRole('navigation', { name: 'Seções' })
    expect(within(menu).getByRole('link', { name: 'Encontros' })).toHaveAttribute(
      'href',
      '#/encontros',
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'E se a vida estiver apresentando possibilidades',
    )
    for (const name of ['Encontros ao vivo', 'Jornadas', 'Contato']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
    expect(screen.queryByRole('heading', { name: 'Conversas em vídeo' })).toBeNull()
    expectNoPlaceholders()
  })

  it('destaca no menu a seção do link aberto', () => {
    setWideViewport(true)
    render(<HubPage path="/jornadas" />)
    const menu = screen.getByRole('navigation', { name: 'Seções' })
    expect(within(menu).getByRole('link', { name: 'Jornadas' })).toHaveAttribute(
      'aria-current',
      'location',
    )
  })
})
