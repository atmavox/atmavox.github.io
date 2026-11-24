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
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import {
  parseInstagramMedia,
  parsePodcastFeed,
  parseSpotifyOembed,
  parseTikTokOembed,
  tiktokVideoId,
  parseYouTubeFeed,
  type SocialFeed,
  type SocialNetwork,
  type SocialPost,
} from '../src/shared/social/feeds.ts'

/** Canal @atmavox (o feed do YouTube pede o id, não o @). */
const YOUTUBE_CHANNEL_ID = process.env.SOCIAL_YOUTUBE_CHANNEL || 'UCHASefs-qyG_f-hK-qr7Bcg'
const PUBLIC_DIR = new URL('../public/', import.meta.url)
const TIMEOUT_MS = 15_000

/** Capa vinda da rede (baixada no deploy) ou guardada no projeto, em `scripts/pinned/`. */
type Found = (SocialPost & { remoteImage?: string; localImage?: string }) | null

/**
 * Capa e título dos vídeos fixados do TikTok, pelo número do vídeo: o TikTok parou de mandar a capa
 * pela incorporação pública (2026-11) e bloqueia quem lê a página. Trocou o vídeo em
 * `SOCIAL_TIKTOK_URL`? Ponha a capa nova em `scripts/pinned/` e uma linha aqui; sem linha, o cartão
 * aparece sem capa.
 */
const TIKTOK_PINNED: Record<string, { title: string; cover: string }> = {
  '7652054784832228616': {
    title: 'Empatia sem limite vira autodestruição.',
    cover: 'tiktok-7652054784832228616.png',
  },
}

/**
 * Publicação fixada do Instagram, enquanto a última não puder ser lida (sem `INSTAGRAM_TOKEN` ou com
 * erro): um reels escolhido pela Andreía (2026-11-24), com a capa guardada no projeto.
 */
const INSTAGRAM_PINNED: NonNullable<Found> = {
  network: 'instagram',
  url: 'https://www.instagram.com/atmavox/reel/DbKClL_xgrJ/',
  title: 'Práticas (simples) que adotei desde que saí do Estado Cinza',
  kind: 'video',
  pinned: true,
  localImage: 'instagram-DbKClL_xgrJ.png',
}

/** A última publicação pela API oficial da Meta (`null` sem token). */
async function loadInstagramLatest(): Promise<Found> {
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
}

async function get(url: string): Promise<Response> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) throw new Error(`${response.status} em ${new URL(url).host}`)
  return response
}

const SOURCES: { network: SocialNetwork; load: () => Promise<Found> }[] = [
  {
    network: 'instagram',
    load: async () => {
      try {
        const latest = await loadInstagramLatest()
        if (latest) return latest
      } catch (error) {
        console.warn(`  instagram: última publicação falhou (${String(error)}); usando a fixada`)
      }
      return INSTAGRAM_PINNED
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
      const pinned = TIKTOK_PINNED[tiktokVideoId(video) ?? '']
      const oembed = `https://www.tiktok.com/oembed?url=${encodeURIComponent(video)}`
      const found = await get(oembed)
        .then((response) => response.json())
        .then((json) => parseTikTokOembed(json, video))
        .catch((error: unknown) => {
          if (!pinned) throw error
          return parseTikTokOembed({}, video)
        })
      if (!found || !pinned || found.remoteImage) return found
      return { ...found, title: pinned.title, localImage: pinned.cover }
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

/** Copia uma capa guardada no projeto (`scripts/pinned/`) para o site. */
async function copyPinned(name: string): Promise<string | undefined> {
  try {
    await copyFile(
      new URL(`pinned/${name}`, import.meta.url),
      new URL(`social/${name}`, PUBLIC_DIR),
    )
    return `social/${name}`
  } catch (error) {
    console.warn(`  capa ${name} não copiou: ${String(error)}`)
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
      const { remoteImage, localImage, ...post } = found
      const image = remoteImage
        ? await saveImage(network, remoteImage)
        : localImage
          ? await copyPinned(localImage)
          : undefined
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
