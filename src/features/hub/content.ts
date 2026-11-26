// Textos e listas do hub (F1). O que ainda não existe fica `undefined` ou fora da lista: a tela esconde
// ou mostra uma alternativa, nunca um marcador "[...]". Pendências com a Andreía: .ai/features.md (F1).
import {
  BRAND_PERSON,
  BRAND_SIGNATURE,
  BRAND_SLOGAN,
  brandLinks,
  whatsAppMessage,
} from '../../shared/brand/links'

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
  'instagram' | 'youtube' | 'facebook' | 'whatsapp' | 'tiktok' | 'threads' | 'telegram' | 'spotify'

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
 * Não é uma meditação (pedido de 2026-11-25): fica só aqui, fora do catálogo. Título provisório:
 * confirmar com a Andreía.
 */
export const introAudio: HubAudio = {
  id: 'boas-vindas',
  kind: 'audio',
  title: 'Boas-vindas',
  meta: 'Áudio · 1 min',
  audioSrc: '/audio/atmavox-boas-vindas.m4a',
}

export const meditationsIntro = {
  title: 'Pausas guiadas para voltar ao centro',
} as const

export const journeysIntro = {
  title: 'Caminhos para atravessar o Estado Cinza',
} as const

/**
 * Hub de ativações (mock aprovado `atmavox-hub-ativacao.html`, D, 2026-11-24). Textos provisórios,
 * para a Andreía ajustar; as terapias vêm do Modo Andreía.
 */
export const activationsIntro = {
  eyebrow: 'Ativação individual',
  titleStart: 'Um encontro ',
  titleAccent: 'só seu',
  titleEnd: ', com a Andreía',
  intro:
    'Presencial ou a distância, no seu tempo. Você escolhe a prática, ela prepara o encontro a partir do que você quer ativar agora.',
  introShort: 'Presencial ou a distância, no seu tempo.',
  cta: 'Agendar minha ativação',
  steps: [
    { title: 'Entre na sua conta', detail: 'Com o Google ou com e-mail e senha.' },
    { title: 'Conte um pouco sobre você', detail: 'Algumas perguntas para a Andreía se preparar.' },
    { title: 'Escolha a prática e o horário', detail: 'Nos horários livres da agenda dela.' },
    { title: 'Pague e avise a Andreía', detail: 'Ela confirma o horário com você.' },
  ],
  empty: 'As práticas aparecem aqui em breve. Enquanto isso, fale com a Andreía pelo WhatsApp.',
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

/** Os encontros são um quadro recorrente, ao vivo no TikTok (ADR-021); o horário não aparece no site. */
export const encountersInfo = {
  note: 'Um quadro recorrente, ao vivo no TikTok.',
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

/** Práticas da Andreía (aparecem em "A Ativadora"). */
export const specialties: readonly string[] = [
  'Barras de Access',
  'PNL',
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
  { id: 'spotify', name: 'Spotify', handle: 'AtmaVox Songs', href: brandLinks.spotify },
  { id: 'facebook', name: 'Facebook', handle: 'atmavox', href: brandLinks.facebook },
  { id: 'whatsapp', name: 'WhatsApp', handle: 'Conversar', href: brandLinks.whatsapp },
]

export const contactCta = {
  label: 'Conversar no WhatsApp',
  href: whatsAppMessage('Vim pelo site.'),
}

export const signature = BRAND_SIGNATURE
