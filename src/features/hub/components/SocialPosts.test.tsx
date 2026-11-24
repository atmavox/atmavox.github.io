import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const FEED = {
  generatedAt: '2026-11-23T12:00:00Z',
  posts: [
    {
      network: 'youtube',
      url: 'https://www.youtube.com/watch?v=ykGeBqB7bXk',
      title: 'Zerando o Dia',
      kind: 'video',
      publishedAt: '2026-11-13T02:50:30Z',
      image: 'social/youtube.jpg',
    },
    {
      network: 'tiktok',
      url: 'https://www.tiktok.com/@atmavox/video/1',
      title: 'Ao vivo',
      kind: 'video',
      pinned: true,
    },
    {
      network: 'instagram',
      url: 'https://www.instagram.com/atmavox/reel/x/',
      title: 'Práticas simples',
      kind: 'video',
      pinned: true,
    },
  ],
}

// O hook guarda o `social.json` da visita: cada teste importa o módulo de novo.
async function renderPosts(layout: 'wide' | 'narrow', response: Response) {
  vi.resetModules()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => response),
  )
  const { SocialPosts } = await import('./SocialPosts')
  return render(<SocialPosts layout={layout} />)
}

describe('últimas publicações das redes', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('mostra um cartão por rede, abrindo na própria rede', async () => {
    await renderPosts('wide', new Response(JSON.stringify(FEED)))
    const youtube = await screen.findByRole('link', { name: /Zerando o Dia \(YouTube/ })
    expect(youtube).toHaveAttribute('href', FEED.posts[0]!.url)
    expect(youtube).toHaveAttribute('target', '_blank')
    expect(screen.getAllByText('Em destaque')).toHaveLength(2)
  })

  it('o convite segue o tipo: um reels do Instagram também é "Assistir"', async () => {
    await renderPosts('wide', new Response(JSON.stringify(FEED)))
    const reels = await screen.findByRole('link', { name: /Práticas simples \(Instagram/ })
    expect(reels).toHaveTextContent('Assistir')
    expect(reels).not.toHaveTextContent(/\bVer\b/)
  })

  it('sem o arquivo, não mostra nada (ficam só os ícones)', async () => {
    const { container } = await renderPosts('narrow', new Response('', { status: 404 }))
    await Promise.resolve()
    expect(container).toBeEmptyDOMElement()
  })
})
