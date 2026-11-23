// A estrutura de uma jornada no formulário do Modo Andreía (mock aprovado, ADR-025): por dias (sem
// divisão, em semanas ou em partes) ou por temas. A numeração segue a posição; a ordem muda arrastando.
import {
  clampDayCount,
  dayGroups,
  durationLabelOf,
  PREVIEW_DAY_COUNT,
  weekCountOf,
  type DayGroup,
} from '../../../shared/catalog/journeyLayout'
import type { JourneyStructure, JourneyTheme } from '../../../shared/catalog/product'
import { toRoman } from '../../../shared/lib/roman'

export type JourneyLayout = 'days' | 'themes'
export type DaySplit = 'none' | 'weeks' | 'parts'

/** Um item da lista (semana, tema ou título de dia): o id só serve para a tela e o arrastar. */
export interface ListItem {
  id: string
  title: string
}

/** Uma parte: o nome e o último dia dela (a última vai até o fim). */
export interface PartItem extends ListItem {
  lastDay: number
}

export interface StructureForm {
  layout: JourneyLayout
  split: DaySplit
  dayCount: number
  /** Pode ter mais semanas que as visíveis: o nome volta se a duração voltar a crescer. */
  weeks: ListItem[]
  parts: PartItem[]
  themes: ListItem[]
  /** Na ordem dos dias; pode ter mais que a duração, pelo mesmo motivo das semanas. */
  dayTitles: ListItem[]
}

let sequence = 0
const newId = () => `item-${(sequence += 1)}`
export const listItem = (title = ''): ListItem => ({ id: newId(), title })
const partItem = (title: string, lastDay: number): PartItem => ({ id: newId(), title, lastDay })

export function structureOf(form: StructureForm): JourneyStructure {
  if (form.layout === 'themes') return 'themes'
  return form.split === 'none' ? 'days' : form.split
}

export const visibleWeeks = (form: StructureForm) => form.weeks.slice(0, weekCountOf(form.dayCount))

/** Os itens do catálogo (semanas, partes ou temas), com o rótulo pela posição. */
export function themesOf(form: StructureForm): JourneyTheme[] {
  switch (structureOf(form)) {
    case 'weeks':
      return visibleWeeks(form).map((w, i) => ({ label: toRoman(i + 1), title: w.title.trim() }))
    case 'parts':
      return form.parts.map((p, i) => ({
        label: String(i + 1),
        title: p.title.trim(),
        ...(i < form.parts.length - 1 ? { lastDay: p.lastDay } : {}),
      }))
    case 'themes':
      return form.themes.map((t, i) => ({ label: String(i + 1), title: t.title.trim() }))
    case 'days':
      return []
  }
}

/** Os trechos de dias, pela mesma conta do hub e da jornada. */
export function groupsOf(form: StructureForm): DayGroup[] {
  const structure = structureOf(form)
  return dayGroups({
    structure,
    themes: themesOf(form),
    dayCount: form.dayCount,
    durationLabel: durationLabelOf(structure, form.dayCount, form.themes.length),
  })
}

/**
 * Deixa tudo coerente com a duração: semanas e títulos cobrem os dias, cada parte fica com pelo menos
 * um dia e a última vai até o fim.
 */
export function normalizeStructure<F extends StructureForm>(form: F): F {
  const dayCount = clampDayCount(form.dayCount)
  const weeks = [...form.weeks]
  while (weeks.length < weekCountOf(dayCount)) weeks.push(listItem())
  const dayTitles = [...form.dayTitles]
  while (dayTitles.length < dayCount) dayTitles.push(listItem())
  const source = form.parts.length > 0 ? form.parts.slice(0, dayCount) : [partItem('', dayCount)]
  let previous = 0
  const parts = source.map((part, i) => {
    const remaining = source.length - 1 - i
    const lastDay =
      remaining === 0
        ? dayCount
        : Math.min(dayCount - remaining, Math.max(previous + 1, part.lastDay))
    previous = lastDay
    return lastDay === part.lastDay ? part : { ...part, lastDay }
  })
  return { ...form, dayCount, weeks, dayTitles, parts }
}

export const setDayCount = <F extends StructureForm>(form: F, dayCount: number): F =>
  normalizeStructure({ ...form, dayCount })

const firstDayOf = (parts: readonly PartItem[], index: number) =>
  (parts[index - 1]?.lastDay ?? 0) + 1

/** "+ Parte" divide a última ao meio; precisa de pelo menos 2 dias nela. */
export function canAddPart(form: StructureForm): boolean {
  const last = form.parts.length - 1
  return form.dayCount - firstDayOf(form.parts, last) + 1 >= 2
}

export function addPart<F extends StructureForm>(form: F): F {
  if (!canAddPart(form)) return form
  const lastIndex = form.parts.length - 1
  const first = firstDayOf(form.parts, lastIndex)
  const split = first + Math.floor((form.dayCount - first + 1) / 2) - 1
  const parts = form.parts.map((p, i) => (i === lastIndex ? { ...p, lastDay: split } : p))
  return normalizeStructure({ ...form, parts: [...parts, partItem('', form.dayCount)] })
}

/** Apagar uma parte junta os dias dela à vizinha; sempre sobra uma. */
export function removePart<F extends StructureForm>(form: F, id: string): F {
  if (form.parts.length <= 1) return form
  const index = form.parts.findIndex((p) => p.id === id)
  if (index === -1) return form
  const parts = form.parts.filter((p) => p.id !== id)
  // Se era a última, a anterior passa a ir até o fim (a normalização cuida disso).
  return normalizeStructure({ ...form, parts })
}

/** Onde a parte termina; o limite é dar pelo menos um dia a ela e a cada parte seguinte. */
export function partEndLimits(form: StructureForm, index: number): { min: number; max: number } {
  return {
    min: firstDayOf(form.parts, index),
    max: form.dayCount - (form.parts.length - 1 - index),
  }
}

export function setPartLastDay<F extends StructureForm>(form: F, id: string, lastDay: number): F {
  const index = form.parts.findIndex((p) => p.id === id)
  if (index === -1 || index === form.parts.length - 1) return form
  const { min, max } = partEndLimits(form, index)
  const clamped = Math.min(max, Math.max(min, Math.round(lastDay)))
  const parts = form.parts.map((p, i) => (i === index ? { ...p, lastDay: clamped } : p))
  return normalizeStructure({ ...form, parts })
}

/** Leva o item de `from` para `to`; os outros escorregam. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return [...list]
  }
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved as T)
  return next
}

/** Nas partes, só os nomes mudam de lugar: as faixas de dias ficam onde estão. */
export function movePartName(parts: readonly PartItem[], from: number, to: number): PartItem[] {
  const names = moveItem(
    parts.map(({ id, title }) => ({ id, title })),
    from,
    to,
  )
  return parts.map((part, i) => ({ ...part, ...names[i] }))
}

/** Os títulos dos 3 primeiros dias com título (os cartões do banner). */
export function previewDaysOf(form: StructureForm): string[] {
  return form.dayTitles
    .slice(0, form.dayCount)
    .map((d) => d.title.trim())
    .filter((title) => title !== '')
    .slice(0, PREVIEW_DAY_COUNT)
}
