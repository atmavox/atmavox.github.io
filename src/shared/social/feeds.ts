// A última publicação de cada rede (ADR-028). Funções puras, sem rede: o script do deploy
// (`scripts/fetch-social.ts`) busca e chama estas leituras; o site lê o resultado (`social.json`).
// Sem imports: o mesmo arquivo roda no Node do deploy e no navegador.

export const SOCIAL_NETWORKS = ['instagram', 'youtube', 'spotify', 'tiktok'] as const
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]

export interface SocialPost {
  network: SocialNetwork
  /** Onde a publicação abre (na própria rede). */
  url: string
  /** Título ou começo da legenda. */
  title: string
  /** Data da publicação (ISO); o TikTok fixado não tem. */
  publishedAt?: string
  /** Capa: caminho no site (`social/youtube.jpg`), baixada no deploy. */
  image?: string
  kind: 'video' | 'audio' | 'image'
  /** Vídeo escolhido pela Andreía (TikTok), não o último. */
  pinned?: boolean
}

export interface SocialFeed {
  generatedAt: string
  posts: SocialPost[]
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}

/** Texto de XML: tira CDATA, decodifica entidades e junta espaços. */
export function xmlText(raw: string | undefined): string {
  if (!raw) return ''
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&(\w+);/g, (match, name: string) => ENTITIES[name] ?? match)
    .replace(/\s+/g, ' ')
    .trim()
}

const tag = (block: string, name: string) =>
  new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(block)?.[1]
const attr = (block: string, name: string, attribute: string) =>
  new RegExp(`<${name}\\s[^>]*${attribute}="([^"]+)"`).exec(block)?.[1]

const isoDate = (text: string): string | undefined => {
  const time = Date.parse(text)
  return Number.isNaN(time) ? undefined : new Date(time).toISOString()
}

/** Até 140 letras, cortando numa palavra (legendas longas do Instagram). */
export function shortText(text: string, max = 140): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).trimEnd()}…`
}

/** O feed público de um canal do YouTube (`/feeds/videos.xml?channel_id=…`): o vídeo mais novo. */
export function parseYouTubeFeed(xml: string): (SocialPost & { remoteImage?: string }) | null {
  const entry = tag(xml, 'entry')
  if (!entry) return null
  const url = attr(entry, 'link', 'href')
  const title = xmlText(tag(entry, 'title'))
  if (!url || !title) return null
  const publishedAt = isoDate(xmlText(tag(entry, 'published')))
  const remoteImage = attr(entry, 'media:thumbnail', 'url')
  return {
    network: 'youtube',
    url,
    title,
    kind: 'video',
    ...(publishedAt ? { publishedAt } : {}),
    ...(remoteImage ? { remoteImage } : {}),
  }
}

/** O feed de um podcast (Spotify for Creators): o episódio mais novo. */
export function parsePodcastFeed(xml: string): (SocialPost & { remoteImage?: string }) | null {
  const item = tag(xml, 'item')
  if (!item) return null
  const title = xmlText(tag(item, 'title'))
  const url = xmlText(tag(item, 'link')) || attr(item, 'enclosure', 'url')
  if (!url || !title) return null
  const publishedAt = isoDate(xmlText(tag(item, 'pubDate')))
  const remoteImage = attr(item, 'itunes:image', 'href') ?? attr(xml, 'itunes:image', 'href')
  return {
    network: 'spotify',
    url,
    title,
    kind: 'audio',
    ...(publishedAt ? { publishedAt } : {}),
    ...(remoteImage ? { remoteImage } : {}),
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const str = (value: unknown) => (typeof value === 'string' && value.trim() ? value : undefined)

/** A resposta da API do Instagram (`/me/media?fields=…&limit=1`): a publicação mais nova. */
export function parseInstagramMedia(json: unknown): (SocialPost & { remoteImage?: string }) | null {
  const first = isObject(json) && Array.isArray(json.data) ? json.data[0] : undefined
  if (!isObject(first)) return null
  const url = str(first.permalink)
  if (!url) return null
  const isVideo = first.media_type === 'VIDEO'
  const remoteImage = str(isVideo ? first.thumbnail_url : first.media_url) ?? str(first.media_url)
  const publishedAt = str(first.timestamp) ? isoDate(String(first.timestamp)) : undefined
  return {
    network: 'instagram',
    url,
    title: shortText(str(first.caption) ?? 'Nova publicação no Instagram'),
    kind: isVideo ? 'video' : 'image',
    ...(publishedAt ? { publishedAt } : {}),
    ...(remoteImage ? { remoteImage } : {}),
  }
}

/** O oEmbed público do TikTok (`/oembed?url=…`) de um vídeo escolhido (fixado). */
export function parseTikTokOembed(
  json: unknown,
  url: string,
): (SocialPost & { remoteImage?: string }) | null {
  if (!isObject(json)) return null
  const remoteImage = str(json.thumbnail_url)
  return {
    network: 'tiktok',
    url,
    title: shortText(str(json.title) ?? 'Vídeo no TikTok'),
    kind: 'video',
    pinned: true,
    ...(remoteImage ? { remoteImage } : {}),
  }
}

/**
 * O oEmbed público do Spotify (`open.spotify.com/oembed?url=…`) de um link escolhido pela Andreía
 * (playlist, álbum, programa ou episódio): capa e nome, sem chave.
 */
export function parseSpotifyOembed(
  json: unknown,
  url: string,
): (SocialPost & { remoteImage?: string }) | null {
  if (!isObject(json)) return null
  const remoteImage = str(json.thumbnail_url)
  return {
    network: 'spotify',
    url,
    title: shortText(str(json.title) ?? 'No Spotify'),
    kind: 'audio',
    pinned: true,
    ...(remoteImage ? { remoteImage } : {}),
  }
}

/** O `social.json` lido pelo site: o que vier quebrado fica de fora, na ordem das redes. */
export function parseSocialFeed(raw: unknown): SocialPost[] {
  if (!isObject(raw) || !Array.isArray(raw.posts)) return []
  const posts: SocialPost[] = []
  for (const item of raw.posts) {
    if (!isObject(item)) continue
    const network = SOCIAL_NETWORKS.find((n) => n === item.network)
    const url = str(item.url)
    const title = str(item.title)
    const kind = (['video', 'audio', 'image'] as const).find((k) => k === item.kind)
    if (!network || !url || !/^https:\/\//.test(url) || !title || !kind) continue
    if (posts.some((p) => p.network === network)) continue
    const image = str(item.image)
    const publishedAt = str(item.publishedAt)
    posts.push({
      network,
      url,
      title,
      kind,
      ...(image && /^social\/[\w.-]+$/.test(image) ? { image } : {}),
      ...(publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? { publishedAt } : {}),
      ...(item.pinned === true ? { pinned: true } : {}),
    })
  }
  return SOCIAL_NETWORKS.flatMap((n) => posts.filter((p) => p.network === n))
}

/** "hoje", "ontem", "há 3 dias", "há 2 semanas", "há 5 meses". */
export function relativeTime(iso: string, now: number): string {
  const days = Math.floor((now - Date.parse(iso)) / 86_400_000)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'ontem'
  if (days < 14) return `há ${days} dias`
  if (days < 60) return `há ${Math.floor(days / 7)} semanas`
  const months = Math.floor(days / 30)
  return months < 12
    ? `há ${months} meses`
    : `há ${Math.floor(months / 12)} ${months < 24 ? 'ano' : 'anos'}`
}
