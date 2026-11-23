// Resumo do progresso de uma jornada para o perfil (`users/{uid}/journeys/{id}`), lido por REST com o
// login. Só os números que o perfil mostra: o conteúdo das reflexões nunca sai da jornada.
import type { JourneyProduct } from '../catalog/product'
import {
  documentsUrl,
  fieldsOf,
  getJson,
  type FetchFn,
  type RestConfig,
} from '../firebase/firestoreRest'

export interface ProgressSummary {
  completedDays: number[]
  reflections: number
  victories: number
}

type Value = Record<string, unknown>

const arrayValues = (field: unknown): unknown[] => {
  if (typeof field !== 'object' || field === null || !('arrayValue' in field)) return []
  const array = (field as { arrayValue: { values?: unknown } }).arrayValue
  return Array.isArray(array.values) ? array.values : []
}

const mapFields = (field: unknown): Record<string, unknown> => {
  if (typeof field !== 'object' || field === null || !('mapValue' in field)) return {}
  const map = (field as { mapValue: { fields?: unknown } }).mapValue
  return typeof map.fields === 'object' && map.fields !== null
    ? (map.fields as Record<string, unknown>)
    : {}
}

/** Um documento de progresso no formato REST do Firestore; `null` se não houver. */
export function parseProgressDocument(document: unknown): ProgressSummary | null {
  const fields = fieldsOf(document)
  if (!fields) return null
  const completedDays = arrayValues(fields.completedDays)
    .map((v) => Number((v as Value).integerValue))
    .filter((n) => Number.isInteger(n) && n > 0)
  const reflections = Object.values(mapFields(fields.entries)).filter((v) => {
    const text = (v as Value).stringValue
    return typeof text === 'string' && text.trim() !== ''
  }).length
  return {
    completedDays: [...new Set(completedDays)].sort((a, b) => a - b),
    reflections,
    victories: arrayValues(fields.victories).length,
  }
}

export type ProgressLoader = (
  uid: string,
  token: string,
  journeyId: string,
) => Promise<ProgressSummary | null>

export function createRestProgressLoader(config: RestConfig, fetchFn?: FetchFn): ProgressLoader {
  return async (uid, token, journeyId) =>
    parseProgressDocument(
      await getJson(documentsUrl(config, `users/${uid}/journeys/${journeyId}`), token, fetchFn),
    )
}

export type StepState = 'done' | 'next' | 'later'

export interface TrailStep {
  label: string
  title: string
  state: StepState
  /** Dias do trecho (ex.: 1 a 7). */
  firstDay: number
  lastDay: number
  doneDays: number
}

export interface Trail {
  steps: TrailStep[]
  totalDays: number
  doneDays: number
  /** Próximo dia a fazer; `null` quando concluída. */
  nextDay: number | null
  /** Índice (1…) do trecho em andamento, para o link "Continuar". */
  nextStep: number | null
}

/** "21 dias" → 21; sem número, 0. */
const daysOf = (label: string) => Number(/(\d+)\s*dias?/i.exec(label)?.[1] ?? 0)

/**
 * A trilha de uma jornada (perfil, mock aprovado): os temas do catálogo viram trechos com dias iguais
 * (21 dias em 3 semanas = 7 cada). Feito, o próximo (onde está o primeiro dia não feito) e os depois.
 */
export function journeyTrail(journey: JourneyProduct, progress: ProgressSummary): Trail {
  const totalDays = daysOf(journey.durationLabel)
  const done = new Set(progress.completedDays.filter((d) => d <= totalDays))
  let nextDay: number | null = null
  for (let day = 1; day <= totalDays; day += 1) {
    if (!done.has(day)) {
      nextDay = day
      break
    }
  }
  const themes = journey.themes.length > 0 ? journey.themes : [{ label: '', title: journey.title }]
  const perStep = Math.max(1, Math.ceil(totalDays / themes.length))
  let nextStep: number | null = null
  const steps = themes.map((theme, index) => {
    const firstDay = index * perStep + 1
    const lastDay = Math.min(totalDays, (index + 1) * perStep)
    let doneDays = 0
    for (let day = firstDay; day <= lastDay; day += 1) if (done.has(day)) doneDays += 1
    const isNext = nextDay !== null && nextDay >= firstDay && nextDay <= lastDay
    if (isNext) nextStep = index + 1
    const state: StepState =
      doneDays === lastDay - firstDay + 1 ? 'done' : isNext ? 'next' : 'later'
    return { label: theme.label, title: theme.title, state, firstDay, lastDay, doneDays }
  })
  return { steps, totalDays, doneDays: done.size, nextDay, nextStep }
}
