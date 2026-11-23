import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createAudioPlayer } from '../../shared/media/audioPlayer'
import { FakeAudio } from '../../shared/media/FakeAudio'
import { setAudioPlayerForTests } from '../../shared/media/useAudioPlayer'
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
    expect(hubSectionFromPath('/meditacoes')).toBe('meditacoes')
    expect(hubSectionFromPath('/ouvir')).toBe('meditacoes')
    expect(hubSectionFromPath('/qualquer')).toBe('inicio')
  })

  it('no celular, "encontros" abre a aba Início (onde eles ficam)', () => {
    expect(tabOfSection('encontros')).toBe('inicio')
    expect(tabOfSection('sobre')).toBe('contato')
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
    expect(within(tabs).getByRole('link', { name: 'Meditações' })).toHaveAttribute(
      'href',
      '#/meditacoes',
    )
    expectNoPlaceholders()
  })

  it('abre com o retrato da Andreía e a mensagem com o nome dela', () => {
    render(<HubPage path="/" />)
    expect(screen.getByRole('img', { name: /Andreía Oliveirà sorrindo/ })).toHaveAttribute(
      'srcset',
      expect.stringContaining('andreia-600.webp 600w'),
    )
    expect(screen.getByText(/Com Andreía Oliveirà\./)).toBeInTheDocument()
  })

  it('os encontros não têm horário: a faixa leva para o TikTok', () => {
    render(<HubPage path="/" />)
    expect(screen.getByRole('link', { name: 'Seguir no TikTok' })).toHaveAttribute(
      'href',
      'https://www.tiktok.com/@atmavox',
    )
    expect(screen.getByText(/Sem programação fixa/)).toBeInTheDocument()
  })

  it('a vitrine não mostra preço e não inventa depoimento', () => {
    render(<HubPage path="/" />)
    expect(document.body.textContent).not.toMatch(/R\$/)
    expect(screen.queryByText('Quem já viveu')).toBeNull()
  })

  it('o áudio de boas-vindas toca no player do site, sem YouTube', () => {
    const audio = new FakeAudio()
    const player = createAudioPlayer(audio)
    setAudioPlayerForTests(player)
    render(<HubPage path="/" />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Ouvir Boas-vindas' })[0]!)

    expect(audio.src).toBe('/audio/atmavox-boas-vindas.m4a')
    expect(player.getSnapshot()).toMatchObject({ status: 'playing' })
    expect(screen.getAllByRole('button', { name: 'Pausar Boas-vindas' }).length).toBeGreaterThan(0)
    expect(document.querySelector('iframe')).toBeNull()
    setAudioPlayerForTests(null)
  })

  it('na vitrine, "Conhecer" leva ao hub de jornadas', () => {
    render(<HubPage path="/" />)
    expect(screen.getByRole('link', { name: 'Conhecer A Chama Interna' })).toHaveAttribute(
      'href',
      '#/jornadas',
    )
  })

  it('a aba Jornadas é o hub: começar abre a jornada e "Em breve" avisa pelo WhatsApp', () => {
    render(<HubPage path="/jornadas" />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Caminhos para atravessar o Estado Cinza' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Começar jornada: A Chama Interna' })).toHaveAttribute(
      'href',
      '#/jornada/chama-interna-21',
    )
    expect(
      screen.getByRole('link', { name: 'Quero ser avisada: Ritual Matinal' }).getAttribute('href'),
    ).toContain('wa.me')
  })

  it('a aba Meditações é o hub: filtra por áudio e vídeo e leva à página de cada uma', () => {
    render(<HubPage path="/meditacoes" />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Pausas guiadas para voltar ao centro' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Vídeo' }))
    expect(screen.queryByRole('link', { name: 'Boas-vindas' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Retorne ao Seu Centro' })).toHaveAttribute(
      'href',
      '#/meditacao/retorne-ao-seu-centro',
    )
    expect(screen.queryByRole('button', { name: 'Com e-book' })).toBeNull()
  })

  it('a página da meditação toca o áudio no player do site', () => {
    render(<HubPage path="/meditacao/boas-vindas" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Boas-vindas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ouvir Boas-vindas' })).toBeInTheDocument()
    const tabs = screen.getByRole('navigation', { name: 'Seções' })
    expect(within(tabs).getByRole('link', { name: 'Meditações' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('meditação que não existe avisa e volta para a lista', () => {
    render(<HubPage path="/meditacao/nao-existe" />)
    expect(screen.getByRole('heading', { name: 'Meditação não encontrada' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Meditações' }),
    ).toHaveAttribute('href', '#/meditacoes')
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
    for (const name of [
      'Caminhos para atravessar o Estado Cinza',
      'Pausas guiadas para voltar ao centro',
      'Encontros',
      'Nas redes sociais',
      'Andreía Oliveirà',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Conhecer as jornadas' })).toHaveAttribute(
      'href',
      '#/jornadas',
    )
    expect(document.body.textContent).not.toMatch(/R\$/)
    expectNoPlaceholders()
  })

  it('destaca no menu a seção do link aberto', () => {
    setWideViewport(true)
    render(<HubPage path="/jornadas" />)
    const menu = screen.getByRole('navigation', { name: 'Seções' })
    expect(within(menu).getByRole('link', { name: 'Jornadas' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('Encontros, Sobre e Contato são trechos do início: "Início" continua marcado', () => {
    setWideViewport(true)
    render(<HubPage path="/encontros" />)
    const menu = screen.getByRole('navigation', { name: 'Seções' })
    expect(within(menu).getByRole('link', { name: 'Início' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(menu).getByRole('link', { name: 'Encontros' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
