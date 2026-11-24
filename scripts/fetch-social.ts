// Busca a última publicação de cada rede e grava `public/social.json` + as capas em `public/social/`
// (ADR-028). Roda no deploy do GitHub Actions (a cada push e a cada 6 horas), com Node 24 (que roda
// TypeScript direto). Uma rede que falhar fica de fora; as outras seguem. Sem rede nenhuma, grava a
// lista vazia e a página inicial mostra só os ícones.
//
// Configuração (Settings > Secrets and variables > Actions do repositório):
// - SOCIAL_TIKTOK_URL (variable): link do vídeo do TikTok escolhido pela Andreía (fixado).
// - SOCIAL_SPOTIFY_URL (variable): link do Spotify escolhido pela Andreía (hoje, a playlist).
// - SOCIAL_SPOTIFY_RSS (variable): feed RSS do podcast, quando existir (usado se não houver o link).
// - INSTAGRAM_TOKEN (secret): chave da API do Instagram (guia em `.ai/processos-manuais.md`).
// - INSTAGRAM_USER_ID (variable): número da conta do Instagram, para o token do login unificado (EAA…).
import { mkdir, writeFile } from 'node:fs/promises'
import {
  parseInstagramMedia,
  parsePodcastFeed,
  parseSpotifyOembed,
  parseTikTokOembed,
  parseYouTubeFeed,
  type SocialFeed,
  type SocialNetwork,
  type SocialPost,
} from '../src/shared/social/feeds.ts'

/** Canal @atmavox (o feed do YouTube pede o id, não o @). */
const YOUTUBE_CHANNEL_ID = process.env.SOCIAL_YOUTUBE_CHANNEL || 'UCHASefs-qyG_f-hK-qr7Bcg'
const PUBLIC_DIR = new URL('../public/', import.meta.url)
const TIMEOUT_MS = 15_000

type Found = (SocialPost & { remoteImage?: string }) | null

async function get(url: string): Promise<Response> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) throw new Error(`${response.status} em ${new URL(url).host}`)
  return response
}

const SOURCES: { network: SocialNetwork; load: () => Promise<Found> }[] = [
  {
    network: 'instagram',
    load: async () => {
      const token = process.env.INSTAGRAM_TOKEN
      if (!token) return null
      const fields = 'caption,media_type,media_url,thumbnail_url,permalink,timestamp'
      const query = `fields=${fields}&limit=1&access_token=${encodeURIComponent(token)}`
      // Token "IG…" (login do Instagram) lê a própria conta; token "EAA…" (login unificado, usuário do
      // sistema, o único disponível para apps novos desde 2026-11) precisa do número da conta.
      if (token.startsWith('IG')) {
        return parseInstagramMedia(
          await (await get(`https://graph.instagram.com/me/media?${query}`)).json(),
        )
      }
      const account = process.env.INSTAGRAM_USER_ID
      if (!account)
        throw new Error('falta a variable INSTAGRAM_USER_ID para o token do login unificado')
      const url = `https://graph.facebook.com/${encodeURIComponent(account)}/media?${query}`
      return parseInstagramMedia(await (await get(url)).json())
    },
  },
  {
    network: 'youtube',
    load: async () =>
      parseYouTubeFeed(
        await (
          await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`)
        ).text(),
      ),
  },
  {
    network: 'spotify',
    load: async () => {
      const link = process.env.SOCIAL_SPOTIFY_URL
      if (link) {
        const oembed = `https://open.spotify.com/oembed?url=${encodeURIComponent(link)}`
        return parseSpotifyOembed(await (await get(oembed)).json(), link)
      }
      const rss = process.env.SOCIAL_SPOTIFY_RSS
      return rss ? parsePodcastFeed(await (await get(rss)).text()) : null
    },
  },
  {
    network: 'tiktok',
    load: async () => {
      const video = process.env.SOCIAL_TIKTOK_URL
      if (!video) return null
      const oembed = `https://www.tiktok.com/oembed?url=${encodeURIComponent(video)}`
      return parseTikTokOembed(await (await get(oembed)).json(), video)
    },
  },
]

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** Baixa a capa para o site (as do Instagram e do TikTok vencem em poucos dias). */
async function saveImage(network: SocialNetwork, remote: string): Promise<string | undefined> {
  try {
    const response = await get(remote)
    const type = response.headers.get('content-type')?.split(';')[0] ?? ''
    const extension = EXTENSIONS[type] ?? 'jpg'
    const name = `social/${network}.${extension}`
    await writeFile(new URL(name, PUBLIC_DIR), Buffer.from(await response.arrayBuffer()))
    return name
  } catch (error) {
    console.warn(`  capa de ${network} não baixou: ${String(error)}`)
    return undefined
  }
}

async function main() {
  await mkdir(new URL('social/', PUBLIC_DIR), { recursive: true })
  const posts: SocialPost[] = []
  for (const { network, load } of SOURCES) {
    try {
      const found = await load()
      if (!found) {
        console.log(`- ${network}: nada configurado ou nada publicado`)
        continue
      }
      const { remoteImage, ...post } = found
      const image = remoteImage ? await saveImage(network, remoteImage) : undefined
      posts.push({ ...post, ...(image ? { image } : {}) })
      console.log(`- ${network}: ${post.title}`)
    } catch (error) {
      console.warn(`- ${network}: falhou (${String(error)}); fica de fora`)
    }
  }
  const feed: SocialFeed = { generatedAt: new Date().toISOString(), posts }
  await writeFile(new URL('social.json', PUBLIC_DIR), `${JSON.stringify(feed, null, 2)}\n`)
  console.log(`social.json com ${posts.length} publicação(ões).`)
}

await main()
