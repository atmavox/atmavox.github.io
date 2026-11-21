// Formato da jornada como dados. O conteúdo concreto fica em content/; aqui só a forma e as constantes.

export const TOTAL_DAYS = 21
export const DAYS_PER_WEEK = 7
export const REVIEW_DAYS = [7, 14, 21] as const

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

export type DaySection =
  | { type: 'checkin' }
  | { type: 'ritual'; label: string; text: string }
  | {
      type: 'prompt'
      fieldId: FieldId
      label: string
      question?: string
      placeholder: string
      editable?: boolean
      size?: 'short' | 'regular'
    }
  | { type: 'affirmation'; fieldId: FieldId; label: string; text: string; hint?: string }
  | {
      type: 'closing'
      fieldId: FieldId
      label: string
      question?: string
      moodHint?: string
      placeholder: string
    }

export interface JourneyDay {
  number: number
  title: string
  subtitle: string
  isReview: boolean
  sections: readonly DaySection[]
}

export interface JourneyWeek {
  number: 1 | 2 | 3
  roman: 'I' | 'II' | 'III'
  theme: string
  days: readonly JourneyDay[]
}

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
  weeks: readonly JourneyWeek[]
  reviews: readonly WeeklyReview[]
  closingQuestions: readonly Question[]
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
