// Lê uma jornada vinda de fora (Firestore). Se algo não tiver a forma esperada, devolve null e o
// site segue com a versão que vem no código: conteúdo quebrado nunca chega à tela da participante.
import type {
  DaySection,
  FieldId,
  Journey,
  JourneyDay,
  JourneyWeek,
  Question,
  WeeklyReview,
} from './journey'

type Raw = Record<string, unknown>

const isObject = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)
const FIELD_ID = /^(d\d+:[\w-]+|r(7|14|21):q\d+|enc:[\w-]+)$/
const fieldId = (value: unknown): FieldId | undefined =>
  typeof value === 'string' && FIELD_ID.test(value) ? (value as FieldId) : undefined
const optional = <K extends string>(key: K, value: string | undefined) =>
  value === undefined ? {} : ({ [key]: value } as Record<K, string>)

/** Lê todos os itens ou nenhum: um item inválido invalida a lista. */
function every<T>(value: unknown, parse: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null
  const items: T[] = []
  for (const item of value) {
    const parsed = parse(item)
    if (parsed === null) return null
    items.push(parsed)
  }
  return items
}

/** Só links http(s): nada de `javascript:` vindo do banco. */
const safeUrl = (value: unknown): string | undefined => {
  const url = str(value)
  return url && /^https?:\/\//i.test(url) ? url : undefined
}

function parseSection(raw: unknown): DaySection | null {
  if (!isObject(raw)) return null
  const id = str(raw.id)
  if (!id) return null
  const label = str(raw.label)
  const text = str(raw.text)
  const question = str(raw.question)
  const placeholder = str(raw.placeholder) ?? ''

  switch (raw.type) {
    case 'checkin':
      return { type: 'checkin', id }
    case 'divider':
      return { type: 'divider', id }
    case 'ritual':
      return label !== undefined && text !== undefined ? { type: 'ritual', id, label, text } : null
    case 'text':
    case 'quote':
      return text !== undefined ? { type: raw.type, id, text } : null
    case 'prompt': {
      const field = fieldId(raw.fieldId)
      if (!field || field !== id || label === undefined) return null
      return {
        type: 'prompt',
        id,
        fieldId: field,
        label,
        placeholder,
        ...optional('question', question),
        ...(raw.editable === true ? { editable: true } : {}),
        ...(raw.size === 'short' || raw.size === 'regular' ? { size: raw.size } : {}),
      }
    }
    case 'affirmation': {
      const field = fieldId(raw.fieldId)
      if (!field || field !== id || label === undefined || text === undefined) return null
      return {
        type: 'affirmation',
        id,
        fieldId: field,
        label,
        text,
        ...optional('hint', str(raw.hint)),
      }
    }
    case 'closing': {
      const field = fieldId(raw.fieldId)
      if (!field || field !== id || label === undefined) return null
      return {
        type: 'closing',
        id,
        fieldId: field,
        label,
        placeholder,
        ...optional('question', question),
        ...optional('moodHint', str(raw.moodHint)),
      }
    }
    case 'image': {
      const mediaId = str(raw.mediaId)
      if (!mediaId) return null
      return {
        type: 'image',
        id,
        mediaId,
        alt: str(raw.alt) ?? '',
        ...optional('caption', str(raw.caption)),
      }
    }
    case 'video':
    case 'audio': {
      const url = safeUrl(raw.url)
      if (!url) return null
      return { type: raw.type, id, url, label: label ?? '', title: str(raw.title) ?? '' }
    }
    default:
      return null
  }
}

function parseDay(raw: unknown): JourneyDay | null {
  if (!isObject(raw)) return null
  const number = raw.number
  const title = str(raw.title)
  if (typeof number !== 'number' || !Number.isInteger(number) || number < 1 || !title) return null
  const sections = every(raw.sections, parseSection)
  if (!sections) return null
  return {
    number,
    title,
    subtitle: str(raw.subtitle) ?? '',
    isReview: raw.isReview === true,
    sections,
  }
}

const WEEK_ROMANS = { 1: 'I', 2: 'II', 3: 'III' } as const

function parseWeek(raw: unknown): JourneyWeek | null {
  if (!isObject(raw)) return null
  const number = raw.number
  if (number !== 1 && number !== 2 && number !== 3) return null
  const days = every(raw.days, parseDay)
  if (!days) return null
  return { number, roman: WEEK_ROMANS[number], theme: str(raw.theme) ?? '', days }
}

function parseQuestion(raw: unknown): Question | null {
  if (!isObject(raw)) return null
  const field = fieldId(raw.fieldId)
  const label = str(raw.label)
  if (!field || label === undefined) return null
  return {
    fieldId: field,
    label,
    text: str(raw.text) ?? '',
    placeholder: str(raw.placeholder) ?? '',
    ...(raw.editable === true ? { editable: true } : {}),
  }
}

function parseReview(raw: unknown): WeeklyReview | null {
  if (!isObject(raw)) return null
  const id = raw.id
  if (id !== 'r7' && id !== 'r14' && id !== 'r21') return null
  const questions = every(raw.questions, parseQuestion)
  if (!questions) return null
  return { id, tabLabel: str(raw.tabLabel) ?? '', questions }
}

/** Ids repetidos fariam duas etapas ou dois campos dividirem a mesma resposta. */
function hasUniqueIds(journey: Journey): boolean {
  const days = journey.weeks.flatMap((week) => week.days)
  const dayNumbers = days.map((day) => day.number)
  const ids = [
    ...days.flatMap((day) => day.sections.map((section) => section.id)),
    ...journey.reviews.flatMap((review) => review.questions.map((q) => q.fieldId)),
    ...journey.closingQuestions.map((q) => q.fieldId),
  ]
  return new Set(dayNumbers).size === dayNumbers.length && new Set(ids).size === ids.length
}

export function parseJourney(raw: unknown): Journey | null {
  if (!isObject(raw)) return null
  const id = str(raw.id)
  const weeks = every(raw.weeks, parseWeek)
  const reviews = every(raw.reviews, parseReview)
  const closingQuestions = every(raw.closingQuestions, parseQuestion)
  if (!id || !weeks || weeks.length === 0 || !reviews || !closingQuestions) return null
  const retiredDays = Array.isArray(raw.retiredDays)
    ? raw.retiredDays.filter(
        (day): day is number => typeof day === 'number' && Number.isInteger(day) && day >= 1,
      )
    : []
  const journey: Journey = {
    id,
    weeks,
    reviews,
    closingQuestions,
    ...(retiredDays.length > 0 ? { retiredDays } : {}),
  }
  return hasUniqueIds(journey) ? journey : null
}
