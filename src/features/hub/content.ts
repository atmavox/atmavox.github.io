// Textos e listas do hub (F1). O que ainda não existe fica `undefined` ou fora da lista: a tela esconde
// ou mostra uma alternativa, nunca um marcador "[...]". Pendências com a Andreía: .ai/features.md (F1).
import {
  BRAND_PERSON,
  BRAND_SIGNATURE,
  BRAND_SLOGAN,
  brandLinks,
  whatsAppMessage,
} from '../../shared/brand/links'
import {
  featuredProducts,
  visibleProducts,
  type JourneyProduct,
  type Product,
} from '../../shared/catalog/product'
import { seedCatalog } from '../../shared/catalog/seedCatalog'

export interface HubAudio {
  id: string
  kind: 'audio' | 'video' | 'encontro'
  title: string
  meta: string
  /** MP3 em public/audio/. Sem ele, o item toca o vídeo do YouTube. */
  audioSrc?: string
  youtubeId?: string
}

export interface Encounter {
  id: string
  name: string
  theme: string
  question: string
}

export interface Testimonial {
  text: string
  /** Nome e cidade, como a pessoa autorizou. */
  who: string
}

export interface HubVideo {
  id: string
  title: string
  youtubeId: string
}

export type SocialId =
  'instagram' | 'youtube' | 'facebook' | 'whatsapp' | 'tiktok' | 'threads' | 'telegram'

export interface SocialLink {
  id: SocialId
  name: string
  handle: string
  href: string
}

const principleLead = 'Não estamos aqui para ensinar você a viver.'
const principleRest =
  'Estamos aqui para explorar tudo aquilo que você ainda não descobriu sobre estar vivo.'

export const hero = {
  slogan: BRAND_SLOGAN,
  /** Princípio editorial da marca (PDF de posicionamento). */
  principle: `${principleLead} ${principleRest}`,
  principleLead,
  principleRest,
  question: 'E se a vida estiver apresentando possibilidades que você ainda não percebeu?',
  intro: `Um espaço para perceber, questionar e experimentar. Com ${BRAND_PERSON}.`,
} as const

/**
 * Áudio curto de boas-vindas da tela inicial: introdutório e estimulante, tocado no player do site.
 * (Os vídeos, como "Retorne ao Seu Centro", ficam para a jornada.) Título provisório: confirmar com a Andreía.
 */
export const introAudio: HubAudio = {
  id: 'boas-vindas',
  kind: 'audio',
  title: 'Boas-vindas',
  meta: 'Áudio · 48 s',
  audioSrc: '/audio/atmavox-boas-vindas.m4a',
}

/**
 * Meditações grátis da vitrine e da aba Meditações (mock aprovado em 2026-11-22). As pagas e o hub de
 * meditações vêm do catálogo (ADR-019, Etapa D). Encontros gravados entram aqui quando forem publicados.
 */
export const listenItems: readonly HubAudio[] = [
  introAudio,
  {
    id: 'retorne-ao-seu-centro',
    kind: 'video',
    title: 'Retorne ao Seu Centro',
    meta: 'Vídeo · 5 min',
    youtubeId: 'jKuKSAQUTCA',
  },
]

export const meditationsIntro = {
  title: 'Pausas guiadas para voltar ao centro',
} as const

export const journeysIntro = {
  title: 'Caminhos para atravessar o Estado Cinza',
} as const

export const encounters: readonly Encounter[] = [
  {
    id: 'zerando-o-dia',
    name: 'Zerando o Dia',
    theme: 'Consciência e perspectiva',
    question: 'O que hoje merece ser percebido de outra maneira?',
  },
  {
    id: 'pausa-sagrada',
    name: 'Pausa Sagrada',
    theme: 'Presença e experiência',
    question:
      'O que você consegue perceber quando deixa de tentar resolver tudo por alguns instantes?',
  },
]

const isJourney = (product: Product): product is JourneyProduct => product.kind === 'journey'

/**
 * Jornadas da vitrine (destaques) e da aba Jornadas, do catálogo do código por enquanto. A leitura do
 * catálogo no Firestore entra junto com o Modo Andreía de produtos (Etapa D).
 */
export const showcaseJourneys = featuredProducts(seedCatalog).filter(isJourney)
export const allJourneys = visibleProducts(seedCatalog).filter(isJourney)

/** Os encontros não têm horário fixo: quando acontecem, são um quadro ao vivo no TikTok (ADR-021). */
export const encountersInfo = {
  note: 'Sem programação fixa: quando acontece, é um quadro ao vivo no TikTok.',
  cta: 'Seguir no TikTok',
  href: brandLinks.tiktok,
} as const

/**
 * Depoimentos reais, com nome autorizado. Vazio: a seção "Quem já viveu" não aparece (o briefing pede
 * não inventar depoimentos; o do mock era só exemplo).
 */
export const testimonials: readonly Testimonial[] = []

/** "Quero ser avisada" enquanto não há conta para guardar o interesse: vai para o WhatsApp. */
export function notifyMeHref(productTitle: string): string {
  return whatsAppMessage(`Quero ser avisada quando ${productTitle} abrir.`)
}

export const individualSession = {
  label: 'Ativação individual',
  href: whatsAppMessage('Quero saber mais sobre a sessão individual de 45 minutos.'),
} as const

/** Práticas da Andreía (aparecem em "A Ativadora"). */
export const specialties: readonly string[] = [
  'Barras de Access',
  'PNL',
  'Metáforas Ericksonianas',
  'Neurociência',
  'Radiestesia',
  'Reiki',
  'Aromaterapia',
  'Fitoenergética',
]

/** Vídeos em destaque. Vazio: a seção não aparece. */
export const videos: readonly HubVideo[] = []

/**
 * Retrato da Andreía (o do Keepo, com a definição recuperada por IA: Real-ESRGAN misturado ao original),
 * em três larguras: o navegador baixa a que precisa (1800 para celulares e telas de alta densidade).
 */
export const portrait = {
  src: '/images/andreia-1200.webp',
  srcSet:
    '/images/andreia-600.webp 600w, /images/andreia-1200.webp 1200w, /images/andreia-1800.webp 1800w',
  width: 1200,
  height: 900,
  alt: `${BRAND_PERSON} sorrindo, com anéis de luz dourada ao redor`,
}

export const about = {
  name: BRAND_PERSON,
  role: 'Ativadora de consciência e possibilidades.',
  /** Sem foto, o símbolo da marca ocupa o lugar. */
  photoSrc: '/images/andreia-600.webp' as string | undefined,
  text: undefined as string | undefined,
}

/** Só redes com link confirmado (Threads e Telegram aguardam a Andreía). */
export const socials: readonly SocialLink[] = [
  { id: 'instagram', name: 'Instagram', handle: '@atmavox', href: brandLinks.instagram },
  { id: 'youtube', name: 'YouTube', handle: '@atmavox', href: brandLinks.youtube },
  { id: 'tiktok', name: 'TikTok', handle: '@atmavox', href: brandLinks.tiktok },
  { id: 'facebook', name: 'Facebook', handle: 'atmavox', href: brandLinks.facebook },
  { id: 'whatsapp', name: 'WhatsApp', handle: 'Conversar', href: brandLinks.whatsapp },
]

export const contactCta = {
  label: 'Conversar no WhatsApp',
  href: whatsAppMessage('Vim pelo site.'),
}

export const signature = BRAND_SIGNATURE
