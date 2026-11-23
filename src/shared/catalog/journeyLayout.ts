// Como os dias de uma jornada se agrupam (semanas, partes ou temas), lido do produto do catálogo. Serve
// ao hub (cartões do banner), ao perfil (trilha) e à jornada (o esqueleto de uma jornada nova).
import { toRoman } from '../lib/roman'
import type { JourneyProduct, JourneyStructure, JourneyTheme } from './product'

export const DAYS_PER_WEEK = 7
export const MAX_DAY_COUNT = 99
/** Sem número de dias em lugar nenhum, começa com uma semana. */
const DEFAULT_DAY_COUNT = 7
/** Quantos títulos de dia viram cartões no banner. */
export const PREVIEW_DAY_COUNT = 3

type LayoutSource = Pick<JourneyProduct, 'structure' | 'themes' | 'durationLabel' | 'dayCount'>

export const clampDayCount = (n: number) =>
  Math.min(MAX_DAY_COUNT, Math.max(1, Math.round(Number.isFinite(n) ? n : DEFAULT_DAY_COUNT)))

/** Quantos dias a jornada tem (por tema: quantos temas, cada um é um conteúdo). */
export function dayCountOf(journey: LayoutSource): number {
  if (journey.structure === 'themes') return journey.themes.length
  if (journey.dayCount) return clampDayCount(journey.dayCount)
  const match = /\d+/.exec(journey.durationLabel)
  return clampDayCount(match ? Number(match[0]) : DEFAULT_DAY_COUNT)
}

export const weekCountOf = (dayCount: number) => Math.ceil(dayCount / DAYS_PER_WEEK)

/** Um trecho de dias: uma semana, uma parte, um tema (um dia só) ou todos os dias corridos. */
export interface DayGroup {
  /** "I" (semana), "1" (parte ou tema) ou "" (dias corridos). */
  label: string
  title: string
  firstDay: number
  lastDay: number
}

/**
 * As faixas das partes: cada uma termina no `lastDay` dela (com pelo menos um dia) e a última vai até
 * o fim. Faixas impossíveis (mais partes que dias) ficam de fora.
 */
function partGroups(themes: readonly JourneyTheme[], dayCount: number): DayGroup[] {
  if (themes.length === 0) return [{ label: '1', title: '', firstDay: 1, lastDay: dayCount }]
  let first = 1
  const groups: DayGroup[] = []
  themes.forEach((theme, index) => {
    const remaining = themes.length - 1 - index
    const lastDay =
      remaining === 0
        ? dayCount
        : Math.min(dayCount - remaining, Math.max(first, theme.lastDay ?? first))
    if (first <= lastDay) {
      groups.push({
        label: String(groups.length + 1),
        title: theme.title,
        firstDay: first,
        lastDay,
      })
    }
    first = lastDay + 1
  })
  return groups
}

export function dayGroups(journey: LayoutSource): DayGroup[] {
  const count = dayCountOf(journey)
  switch (journey.structure) {
    case 'themes':
      return journey.themes.map((theme, i) => ({
        label: String(i + 1),
        title: theme.title,
        firstDay: i + 1,
        lastDay: i + 1,
      }))
    case 'days':
      return [{ label: '', title: '', firstDay: 1, lastDay: count }]
    case 'weeks':
      return Array.from({ length: weekCountOf(count) }, (_, i) => ({
        label: toRoman(i + 1),
        title: journey.themes[i]?.title ?? '',
        firstDay: i * DAYS_PER_WEEK + 1,
        lastDay: Math.min(count, (i + 1) * DAYS_PER_WEEK),
      }))
    case 'parts':
      return partGroups(journey.themes, count)
  }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "21 dias" ou "4 temas". */
export function durationLabelOf(
  structure: JourneyStructure,
  dayCount: number,
  themeCount: number,
): string {
  return structure === 'themes'
    ? plural(themeCount, 'tema', 'temas')
    : plural(dayCount, 'dia', 'dias')
}

const GROUP_NAME: Record<JourneyStructure, string> = {
  days: 'Dia',
  weeks: 'Semana',
  parts: 'Parte',
  themes: 'Tema',
}

/** "Semana II", "Parte 1", "Tema 3". */
export function groupName(structure: JourneyStructure, label: string): string {
  return `${GROUP_NAME[structure]} ${label}`
}

/**
 * Os cartões do banner: os 3 primeiros dias com título (I, II, III); sem eles, as semanas, partes ou
 * temas. Jornada de dias corridos sem títulos não tem cartões.
 */
export function cardTiles(
  journey: LayoutSource & Pick<JourneyProduct, 'previewDays'>,
): JourneyTheme[] {
  const preview = (journey.previewDays ?? [])
    .filter((title) => title.trim() !== '')
    .slice(0, PREVIEW_DAY_COUNT)
  if (journey.structure !== 'themes' && preview.length > 0) {
    return preview.map((title, i) => ({ label: toRoman(i + 1), title }))
  }
  if (journey.structure === 'days') return []
  return dayGroups(journey).map((group) => ({
    label: group.label,
    title: group.title.trim() || groupName(journey.structure, group.label),
  }))
}
