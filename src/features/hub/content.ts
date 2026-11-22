// Textos e listas do hub (F1). O que ainda não existe fica `undefined` ou fora da lista: a tela esconde
// ou mostra uma alternativa, nunca um marcador "[...]". Pendências com a Andreía: .ai/features.md (F1).
import {
  BRAND_FIRST_NAME,
  BRAND_PERSON,
  BRAND_SIGNATURE,
  BRAND_SLOGAN,
  brandLinks,
  whatsAppMessage,
} from '../../shared/brand/links'

export interface HubAudio {
  id: string
  kind: 'audio' | 'encontro'
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
  /** Ex.: "Domingos · 20h". Sem ele, a tela aponta para o Instagram. */
  schedule?: string
}

export interface JourneyLink {
  id: string
  title: string
  badge: string
  description: string
  cta: string
  href: string
  isExternal: boolean
  tone: 'accent' | 'gold' | 'wine'
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

/** Tudo o que aparece em "Ouvir". Encontros gravados entram aqui quando forem publicados. */
export const listenItems: readonly HubAudio[] = [introAudio]

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

export const encountersFallback = { label: 'Horários no Instagram', href: brandLinks.instagram }

export const journeys: readonly JourneyLink[] = [
  {
    id: 'chama-interna',
    title: 'A Chama Interna',
    badge: '21 dias · grátis',
    description: '21 dias de rituais, escrita e presença, no seu ritmo. Seu progresso fica salvo.',
    cta: 'Começar a jornada',
    href: '#/jornada',
    isExternal: false,
    tone: 'accent',
  },
  {
    id: 'ritual-matinal',
    title: 'Ritual Matinal',
    badge: '7 dias · em breve',
    description: 'Uma semana de manhãs com presença. Entre na lista de espera.',
    cta: 'Entrar na lista de espera',
    href: whatsAppMessage('Quero entrar na lista de espera do Ritual Matinal de 7 dias.'),
    isExternal: true,
    tone: 'gold',
  },
  {
    id: 'sessao-individual',
    title: 'Sessão individual',
    badge: '45 min',
    description: `Um encontro só seu com a ${BRAND_FIRST_NAME}.`,
    cta: 'Conversar no WhatsApp',
    href: whatsAppMessage('Quero saber mais sobre a sessão individual de 45 minutos.'),
    isExternal: true,
    tone: 'wine',
  },
]

/** Vídeos em destaque. Vazio: a seção não aparece. */
export const videos: readonly HubVideo[] = []

/** Retrato da Andreía (o mesmo do Keepo), em duas larguras: o navegador baixa a que precisa. */
export const portrait = {
  src: '/images/andreia-1200.webp',
  srcSet: '/images/andreia-600.webp 600w, /images/andreia-1200.webp 1200w',
  width: 1200,
  height: 900,
  alt: `${BRAND_PERSON} sorrindo, com anéis de luz dourada ao redor`,
}

export const about = {
  name: BRAND_PERSON,
  role: 'Ativadora de consciência e possibilidades.',
  /** Sem foto, os anéis da marca ocupam o lugar. */
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
