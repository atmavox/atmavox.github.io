import { describe, expect, it } from 'vitest'
import {
  parseInstagramMedia,
  parsePodcastFeed,
  parseSocialFeed,
  parseSpotifyOembed,
  parseTikTokOembed,
  tiktokVideoId,
  parseYouTubeFeed,
  relativeTime,
  shortText,
  xmlText,
} from './feeds'

const YOUTUBE = `<?xml version="1.0"?><feed xmlns:media="http://search.yahoo.com/mrss/">
  <title>Atmavox</title>
  <entry>
    <title>Zerando o Dia: Como Encerrar o Dia com Consciência &amp; Gratidão</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=ykGeBqB7bXk"/>
    <published>2026-11-13T02:50:30+00:00</published>
    <media:group><media:thumbnail url="https://i2.ytimg.com/vi/ykGeBqB7bXk/hqdefault.jpg" width="480" height="360"/></media:group>
  </entry>
  <entry><title>Mais antigo</title><link rel="alternate" href="https://www.youtube.com/watch?v=x"/></entry>
</feed>`

const PODCAST = `<rss><channel><title>Atmavox</title><itunes:image href="https://img/capa.jpg"/>
  <item><title><![CDATA[Ep. 3 · O que o cansaço está tentando dizer]]></title>
  <link>https://open.spotify.com/episode/abc</link><pubDate>Mon, 16 Nov 2026 10:00:00 GMT</pubDate></item>
</channel></rss>`

describe('última publicação de cada rede', () => {
  it('YouTube: o vídeo mais novo do feed, com a capa', () => {
    expect(parseYouTubeFeed(YOUTUBE)).toEqual({
      network: 'youtube',
      url: 'https://www.youtube.com/watch?v=ykGeBqB7bXk',
      title: 'Zerando o Dia: Como Encerrar o Dia com Consciência & Gratidão',
      kind: 'video',
      publishedAt: '2026-11-13T02:50:30.000Z',
      remoteImage: 'https://i2.ytimg.com/vi/ykGeBqB7bXk/hqdefault.jpg',
    })
    expect(parseYouTubeFeed('<feed></feed>')).toBeNull()
  })

  it('podcast: o episódio mais novo, com a capa do programa', () => {
    expect(parsePodcastFeed(PODCAST)).toMatchObject({
      network: 'spotify',
      url: 'https://open.spotify.com/episode/abc',
      title: 'Ep. 3 · O que o cansaço está tentando dizer',
      kind: 'audio',
      remoteImage: 'https://img/capa.jpg',
    })
  })

  it('Instagram: a publicação mais nova; vídeo usa a miniatura; legenda longa é cortada', () => {
    const caption = 'Respire. '.repeat(40)
    const post = parseInstagramMedia({
      data: [
        {
          caption,
          media_type: 'VIDEO',
          media_url: 'https://cdn/video.mp4',
          thumbnail_url: 'https://cdn/thumb.jpg',
          permalink: 'https://www.instagram.com/p/abc/',
          timestamp: '2026-11-21T12:00:00+0000',
        },
      ],
    })
    expect(post).toMatchObject({ kind: 'video', remoteImage: 'https://cdn/thumb.jpg' })
    expect(post?.title.length).toBeLessThanOrEqual(141)
    expect(post?.title.endsWith('…')).toBe(true)
    expect(parseInstagramMedia({ data: [] })).toBeNull()
  })

  it('TikTok: o vídeo escolhido (fixado), com a capa do oEmbed', () => {
    const url = 'https://www.tiktok.com/@atmavox/video/123'
    expect(
      parseTikTokOembed(
        { title: 'Zerando o Dia ao vivo', thumbnail_url: 'https://p16/capa.jpg' },
        url,
      ),
    ).toEqual({
      network: 'tiktok',
      url,
      title: 'Zerando o Dia ao vivo',
      kind: 'video',
      pinned: true,
      remoteImage: 'https://p16/capa.jpg',
    })
  })

  it('Spotify: o link escolhido (playlist), com nome e capa do oEmbed', () => {
    const url = 'https://open.spotify.com/playlist/abc'
    expect(
      parseSpotifyOembed({ title: 'AtmaVox Songs', thumbnail_url: 'https://i.scdn/capa' }, url),
    ).toEqual({
      network: 'spotify',
      url,
      title: 'Playlist: AtmaVox Songs',
      kind: 'audio',
      pinned: true,
      remoteImage: 'https://i.scdn/capa',
    })
    expect(parseSpotifyOembed({}, 'https://open.spotify.com/episode/abc')?.title).toBe('No Spotify')
  })

  it('TikTok: acha o número do vídeo no link (para a capa guardada no projeto)', () => {
    expect(tiktokVideoId('https://www.tiktok.com/@atmavox/video/7652054784832228616?lang=pt')).toBe(
      '7652054784832228616',
    )
    expect(tiktokVideoId('https://www.tiktok.com/@atmavox')).toBeNull()
  })

  it('texto de XML sem CDATA nem entidades', () => {
    expect(xmlText(' <![CDATA[a &amp; b]]> &#233;  ')).toBe('a & b é')
    expect(shortText('curto')).toBe('curto')
  })
})

describe('social.json no site', () => {
  it('lê na ordem das redes, uma por rede, e deixa de fora o que vier quebrado', () => {
    const posts = parseSocialFeed({
      posts: [
        {
          network: 'youtube',
          url: 'https://y/1',
          title: 'Vídeo',
          kind: 'video',
          image: 'social/youtube.jpg',
        },
        { network: 'instagram', url: 'https://i/1', title: 'Foto', kind: 'image' },
        { network: 'youtube', url: 'https://y/2', title: 'Repetido', kind: 'video' },
        { network: 'tiktok', url: 'javascript:alert(1)', title: 'X', kind: 'video' },
        {
          network: 'spotify',
          url: 'https://s/1',
          title: 'Ep',
          kind: 'audio',
          image: '../fora.jpg',
        },
      ],
    })
    expect(posts.map((p) => p.network)).toEqual(['youtube', 'instagram', 'spotify'])
    expect(posts[0]?.image).toBe('social/youtube.jpg')
    expect(posts[2]).not.toHaveProperty('image')
    expect(parseSocialFeed(null)).toEqual([])
  })

  it('quando foi, em português', () => {
    const now = Date.parse('2026-11-23T12:00:00Z')
    expect(relativeTime('2026-11-23T08:00:00Z', now)).toBe('hoje')
    expect(relativeTime('2026-11-22T08:00:00Z', now)).toBe('ontem')
    expect(relativeTime('2026-11-13T02:50:30Z', now)).toBe('há 10 dias')
    expect(relativeTime('2026-10-20T00:00:00Z', now)).toBe('há 4 semanas')
    expect(relativeTime('2026-05-01T00:00:00Z', now)).toBe('há 6 meses')
  })
})
