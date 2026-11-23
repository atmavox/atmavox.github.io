// Terapias da ativação individual (ADR-029): cadastradas no Modo Andreía e lidas pelo site em
// `catalog/therapies`. A ordem da lista é a ordem em que aparecem para a pessoa.
import { BANNER_TONES, type BannerTone } from '../catalog/territories'

export const THERAPY_ICONS = ['hands', 'head', 'pendulum', 'spark', 'leaf', 'wave'] as const
export type TherapyIconName = (typeof THERAPY_ICONS)[number]

export const THERAPY_ICON_LABELS: Record<TherapyIconName, string> = {
  hands: 'Mãos',
  head: 'Cabeça',
  pendulum: 'Pêndulo',
  spark: 'Faísca',
  leaf: 'Folha',
  wave: 'Onda',
}

export const THERAPY_MODALITIES = ['remote', 'in-person', 'both'] as const
export type TherapyModality = (typeof THERAPY_MODALITIES)[number]

export const MODALITY_LABELS: Record<TherapyModality, string> = {
  remote: 'A distância',
  'in-person': 'Presencial',
  both: 'Presencial ou a distância',
}

/** Pergunta só daquela terapia, feita depois que a pessoa a escolhe. */
export const EXTRA_QUESTION_TYPES = ['yesno', 'single', 'short'] as const
export type ExtraQuestionType = (typeof EXTRA_QUESTION_TYPES)[number]

export interface ExtraQuestion {
  /** Imutável depois de salva: as respostas são guardadas por ele. */
  id: string
  label: string
  type: ExtraQuestionType
  /** Só para "uma opção". */
  options: string[]
}

export interface Therapy {
  /** Slug imutável: chave dos pedidos e da agenda. */
  id: string
  name: string
  description: string
  icon: TherapyIconName
  tone: BannerTone
  modality: TherapyModality
  durationMin: number
  /** Em centavos (inteiro), como no catálogo. 0 = ainda sem preço (não pode ficar ativa). */
  priceCents: number
  /** Ativa = aparece para a pessoa escolher. */
  active: boolean
  questions: ExtraQuestion[]
}

export const MIN_THERAPY_MINUTES = 10
export const MAX_THERAPY_MINUTES = 240

/**
 * As quatro terapias da conversa com a Andreía (2026-11-23). Começam desativadas e sem preço: ela
 * confere os textos, põe o preço e ativa.
 */
export const DEFAULT_THERAPIES: readonly Therapy[] = [
  {
    id: 'reiki-a-distancia',
    name: 'Reiki a distância',
    description:
      'Energia de equilíbrio enviada a você onde estiver. Basta um lugar tranquilo para se deitar.',
    icon: 'hands',
    tone: 'dawn',
    modality: 'remote',
    durationMin: 50,
    priceCents: 0,
    active: false,
    questions: [
      {
        id: 'onde-vai-estar',
        label: 'Onde você vai estar durante a sessão?',
        type: 'single',
        options: ['Em casa', 'No trabalho', 'Outro lugar'],
      },
    ],
  },
  {
    id: 'barras-de-access',
    name: 'Barras de Access',
    description:
      'Toques leves em 32 pontos da cabeça, para soltar pensamentos e padrões acumulados.',
    icon: 'head',
    tone: 'wine',
    modality: 'in-person',
    durationMin: 60,
    priceCents: 0,
    active: false,
    questions: [
      {
        id: 'sensibilidade-toque',
        label: 'Sensibilidade ao toque na cabeça ou no pescoço?',
        type: 'yesno',
        options: [],
      },
    ],
  },
  {
    id: 'avaliacao-energetica-radiestesia',
    name: 'Avaliação energética com radiestesia',
    description:
      'Leitura do seu campo energético com pêndulo e gráficos, com devolutiva e indicações.',
    icon: 'pendulum',
    tone: 'sea',
    modality: 'remote',
    durationMin: 40,
    priceCents: 0,
    active: false,
    questions: [
      {
        id: 'incluir-ambiente',
        label: 'Quer incluir um ambiente na avaliação (casa, trabalho)?',
        type: 'yesno',
        options: [],
      },
    ],
  },
  {
    id: 'ativacao-reprogramacao-individual',
    name: 'Ativação com reprogramação individual',
    description:
      'Um encontro com PNL e reprogramação de crenças, a partir do que você quer ativar agora.',
    icon: 'spark',
    tone: 'flame',
    modality: 'both',
    durationMin: 90,
    priceCents: 0,
    active: false,
    questions: [
      {
        id: 'presencial-ou-distancia',
        label: 'Prefere presencial ou a distância?',
        type: 'single',
        options: ['Presencial', 'A distância'],
      },
    ],
  },
]

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

function oneOf<T extends string>(list: readonly T[], value: unknown): T | undefined {
  return list.find((item) => item === value)
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

function parseExtraQuestion(raw: unknown): ExtraQuestion | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const type = oneOf(EXTRA_QUESTION_TYPES, r.type)
  const id = text(r.id)
  const label = text(r.label)
  if (!type || !id || !label) return null
  const options = Array.isArray(r.options) ? r.options.map(text).filter(Boolean) : []
  return { id, label, type, options: type === 'single' ? options : [] }
}

function parseTherapy(raw: unknown): Therapy | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const id = text(r.id)
  const name = text(r.name)
  const icon = oneOf(THERAPY_ICONS, r.icon) ?? 'spark'
  const tone = oneOf(BANNER_TONES, r.tone) ?? 'dusk'
  const modality = oneOf(THERAPY_MODALITIES, r.modality)
  const duration = Number(r.durationMin)
  const price = Number(r.priceCents)
  if (!SLUG.test(id) || !name || !modality) return null
  if (!Number.isInteger(duration) || duration < MIN_THERAPY_MINUTES) return null
  if (duration > MAX_THERAPY_MINUTES) return null
  const priceCents = Number.isInteger(price) && price > 0 ? price : 0
  const questions = Array.isArray(r.questions)
    ? r.questions.map(parseExtraQuestion).filter((q): q is ExtraQuestion => q !== null)
    : []
  return {
    id,
    name,
    description: text(r.description),
    icon,
    tone,
    modality,
    durationMin: duration,
    priceCents,
    // Sem preço, a terapia não pode aparecer para a pessoa.
    active: r.active === true && priceCents > 0,
    questions,
  }
}

/** O `content` de `catalog/therapies`; itens quebrados ou repetidos ficam de fora. */
export function parseTherapies(raw: unknown): Therapy[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const list: Therapy[] = []
  for (const item of raw) {
    const therapy = parseTherapy(item)
    if (!therapy || seen.has(therapy.id)) continue
    seen.add(therapy.id)
    list.push(therapy)
  }
  return list
}

/** 50 → "50 min"; 90 → "1 h 30 min"; 60 → "1 h". */
export function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}
