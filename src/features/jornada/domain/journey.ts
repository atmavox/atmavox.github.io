// Formato da jornada como dados. O conteúdo concreto fica em content/; aqui só a forma e as constantes.

export const EMOTIONS = [
  'Pesada',
  'Ansiosa',
  'Dispersa',
  'Neutra',
  'Esperançosa',
  'Presente',
] as const
export type Emotion = (typeof EMOTIONS)[number]

export const MOODS = [
  { value: 1, symbol: '😶', label: 'Anestesiada' },
  { value: 2, symbol: '🌑', label: 'Lua nova' },
  { value: 3, symbol: '🌓', label: 'Crescendo' },
  { value: 4, symbol: '🌕', label: 'Lua cheia' },
  { value: 5, symbol: '🔥', label: 'Chama acesa' },
] as const
export type Mood = (typeof MOODS)[number]['value']

/**
 * Chave estável de cada resposta: `d{dia}:{chave}`, `r{7|14|21}:q{n}`, `enc:{q{n}|intencao}`.
 * Depois de publicada, nunca muda (as respostas das pessoas são salvas por ela).
 */
export type FieldId = `d${number}:${string}` | `r${7 | 14 | 21}:q${number}` | `enc:${string}`

/**
 * Uma seção (bloco) do dia. Todo bloco tem um `id` fixo: é por ele que o "Feito" da etapa fica salvo.
 * Nos blocos com resposta escrita, `id` e `fieldId` são o mesmo valor (e nunca mudam depois de publicados).
 */
export type DaySection =
  | { type: 'checkin'; id: string }
  | { type: 'ritual'; id: string; label: string; text: string }
  | {
      type: 'prompt'
      id: string
      fieldId: FieldId
      label: string
      question?: string
      placeholder: string
      editable?: boolean
      size?: 'short' | 'regular'
    }
  | {
      type: 'affirmation'
      id: string
      fieldId: FieldId
      label: string
      text: string
      hint?: string
    }
  | {
      type: 'closing'
      id: string
      fieldId: FieldId
      label: string
      question?: string
      moodHint?: string
      placeholder: string
    }
  // Blocos novos do modo Andreía (Fase 4).
  | { type: 'text'; id: string; text: string }
  | { type: 'quote'; id: string; text: string }
  | { type: 'divider'; id: string }
  | { type: 'image'; id: string; mediaId: string; alt: string; caption?: string }
  | { type: 'video'; id: string; label: string; title: string; url: string }
  | { type: 'audio'; id: string; label: string; title: string; url: string }

export type SectionType = DaySection['type']

/** Blocos só de leitura não são etapas: não pedem "Feito" e não seguram o avanço. */
const READING_ONLY: ReadonlySet<SectionType> = new Set(['text', 'quote', 'divider', 'image'])

export function isStepSection(section: DaySection): boolean {
  return !READING_ONLY.has(section.type)
}

type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never
/** Seção escrita no código, antes de ganhar id (o id sai do campo ou do tipo). */
export type DaySectionInput = WithoutId<DaySection>
export interface JourneyDayInput extends Omit<JourneyDay, 'sections'> {
  sections: readonly DaySectionInput[]
}

/**
 * Dá a cada seção o id fixo usado pelo "Feito": o `fieldId` quando existe, senão `d{dia}:{tipo}`
 * (`d1:checkin`, `d1:ritual`), que é o formato já gravado no progresso de quem começou a jornada.
 */
export function withSectionIds(day: JourneyDayInput): JourneyDay {
  const used = new Set<string>()
  const sections = day.sections.map((section) => {
    const base = 'fieldId' in section ? section.fieldId : `d${day.number}:${section.type}`
    let id = base
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`
    used.add(id)
    return { ...section, id } as DaySection
  })
  return { ...day, sections }
}

export interface JourneyDay {
  number: number
  title: string
  subtitle: string
  isReview: boolean
  sections: readonly DaySection[]
}

/**
 * Uma parte da jornada, que vira uma aba: uma semana (`weeks`), um tema (`themes`) ou o bloco único
 * de dias (`days`). No tema não há dias: o conteúdo dele é uma única unidade em `days[0]` (guardada
 * como dia só para reaproveitar etapas e respostas `d{n}:…`), e a tela nunca mostra "Dia".
 */
export interface JourneyWeek {
  number: number
  roman: string
  theme: string
  days: readonly JourneyDay[]
}

/** Como a jornada se divide e abre (ADR-024): semanas e dias pelo calendário; temas por conclusão. */
export type JourneyStructure = 'weeks' | 'themes' | 'days'

export const JOURNEY_STRUCTURES: readonly JourneyStructure[] = ['weeks', 'themes', 'days']

export interface Question {
  fieldId: FieldId
  label: string
  text: string
  placeholder: string
  editable?: boolean
}

export interface WeeklyReview {
  id: 'r7' | 'r14' | 'r21'
  tabLabel: string
  questions: readonly Question[]
}

export interface Journey {
  id: string
  /** Sem ela, `weeks` (a Chama Interna, de antes das estruturas). */
  structure?: JourneyStructure
  weeks: readonly JourneyWeek[]
  reviews: readonly WeeklyReview[]
  closingQuestions: readonly Question[]
  /**
   * Números de dias apagados no Modo Andreía. Nunca são reusados: as respostas das pessoas são salvas
   * por `d{número}:…`, e um dia novo com o mesmo número mostraria respostas de outro dia.
   */
  retiredDays?: readonly number[]
}

export function structureOf(journey: Journey): JourneyStructure {
  return journey.structure ?? 'weeks'
}

/** Algarismo romano das semanas (I, II, III, IV…). */
export function toRoman(n: number): string {
  const table: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let rest = n
  let out = ''
  for (const [value, symbol] of table) {
    while (rest >= value) {
      out += symbol
      rest -= value
    }
  }
  return out
}

export function allDays(journey: Journey): JourneyDay[] {
  return journey.weeks.flatMap((week) => week.days)
}

/** Todos os campos de texto da jornada, na ordem em que aparecem. */
export function allFieldIds(journey: Journey): FieldId[] {
  const dayFields = allDays(journey).flatMap((day) =>
    day.sections.flatMap((section) => ('fieldId' in section ? [section.fieldId] : [])),
  )
  const reviewFields = journey.reviews.flatMap((review) => review.questions.map((q) => q.fieldId))
  const closingFields = journey.closingQuestions.map((q) => q.fieldId)
  return [...dayFields, ...reviewFields, ...closingFields]
}
