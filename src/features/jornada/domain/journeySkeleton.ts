// O ponto de partida de uma jornada nova no Modo Andreía: as partes já montadas pela estrutura do
// produto, com os dias (ou temas) vazios, prontos para ela preencher.
import { toRoman, type Journey, type JourneyDay, type JourneyStructure } from './journey'

export const DAYS_PER_WEEK = 7
/** Sem número na duração ("Jornada em áudio"), começa com uma semana de dias. */
const DEFAULT_DAY_COUNT = 7
const MAX_DAY_COUNT = 99

interface SkeletonSpec {
  id: string
  structure: JourneyStructure
  /** "21 dias", "14 dias"… (a duração escrita no produto). */
  durationLabel: string
  /** Nomes dos temas do produto (por tema: um por aba; por semana: o tema de cada semana). */
  themeTitles: readonly string[]
}

/** O número de dias escrito na duração do produto ("21 dias" → 21), dentro de um limite. */
export function dayCountFromLabel(label: string): number {
  const match = /\d+/.exec(label)
  const count = match ? Number(match[0]) : DEFAULT_DAY_COUNT
  return Math.min(MAX_DAY_COUNT, Math.max(1, count))
}

const emptyDay = (number: number, title: string): JourneyDay => ({
  number,
  title,
  subtitle: '',
  isReview: false,
  sections: [],
})

export function createJourneySkeleton({
  id,
  structure,
  durationLabel,
  themeTitles,
}: SkeletonSpec): Journey {
  const base = { id, structure, reviews: [], closingQuestions: [] }

  if (structure === 'themes') {
    const titles = themeTitles.length > 0 ? themeTitles : ['Tema 1']
    return {
      ...base,
      weeks: titles.map((theme, i) => ({
        number: i + 1,
        roman: toRoman(i + 1),
        theme,
        days: [emptyDay(i + 1, theme)],
      })),
    }
  }

  const count = dayCountFromLabel(durationLabel)
  const days = Array.from({ length: count }, (_, i) => emptyDay(i + 1, `Dia ${i + 1}`))

  if (structure === 'days') {
    return { ...base, weeks: [{ number: 1, roman: 'I', theme: '', days }] }
  }

  const weekCount = Math.ceil(count / DAYS_PER_WEEK)
  return {
    ...base,
    weeks: Array.from({ length: weekCount }, (_, i) => ({
      number: i + 1,
      roman: toRoman(i + 1),
      theme: themeTitles[i] ?? '',
      days: days.slice(i * DAYS_PER_WEEK, (i + 1) * DAYS_PER_WEEK),
    })),
  }
}
