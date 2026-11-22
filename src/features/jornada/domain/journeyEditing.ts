// Operações puras do editor (modo Andreía). Regra de ouro: ids existentes nunca mudam, porque as
// respostas das pessoas são salvas por eles; blocos e dias novos ganham ids novos.
import {
  allDays,
  type DaySection,
  type FieldId,
  type Journey,
  type JourneyDay,
  type SectionType,
} from './journey'

/** Tipos que a Andreía pode adicionar pelo "+ bloco". */
export const ADDABLE_SECTION_TYPES = [
  'ritual',
  'prompt',
  'affirmation',
  'closing',
  'checkin',
  'text',
  'quote',
  'divider',
  'image',
  'video',
  'audio',
] as const satisfies readonly SectionType[]
export type AddableSectionType = (typeof ADDABLE_SECTION_TYPES)[number]

const fieldIdOf = (day: number, suffix: string): FieldId => `d${day}:${suffix}`

/**
 * Bloco novo com textos iniciais. `suffix` deixa o id único (quem chama gera, ex.: data em base 36);
 * assim a função continua pura e testável.
 */
export function createSection(type: AddableSectionType, day: number, suffix: string): DaySection {
  const fieldId = fieldIdOf(day, `${type}-${suffix}`)
  const id = fieldId
  switch (type) {
    case 'checkin':
      return { type, id }
    case 'divider':
      return { type, id }
    case 'ritual':
      return { type, id, label: 'Ritual', text: '' }
    case 'text':
    case 'quote':
      return { type, id, text: '' }
    case 'prompt':
      return {
        type,
        id,
        fieldId,
        label: 'Reflexão do dia',
        question: '',
        placeholder: 'Escreva com presença — sem censura...',
      }
    case 'affirmation':
      return { type, id, fieldId, label: 'Afirmação da Chama', text: '' }
    case 'closing':
      return { type, id, fieldId, label: 'Fechamento', placeholder: 'O que se moveu hoje?' }
    case 'video':
      return { type, id, label: 'Vídeo', title: '', url: '' }
    case 'audio':
      return { type, id, label: 'Áudio', title: '', url: '' }
    case 'image':
      return { type, id, mediaId: '', alt: '' }
  }
}

/** Cópia com ids novos (a cópia não pode dividir as respostas do original). */
export function duplicateSection(section: DaySection, day: number, suffix: string): DaySection {
  const id = fieldIdOf(day, `${section.type}-${suffix}`)
  return 'fieldId' in section ? { ...section, id, fieldId: id } : { ...section, id }
}

function move<T>(items: readonly T[], index: number, delta: number): T[] {
  const target = index + delta
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return [...items]
  const copy = [...items]
  const [item] = copy.splice(index, 1)
  copy.splice(target, 0, item as T)
  return copy
}

export function moveSection(day: JourneyDay, index: number, delta: number): JourneyDay {
  return { ...day, sections: move(day.sections, index, delta) }
}

export function insertSection(day: JourneyDay, index: number, section: DaySection): JourneyDay {
  const sections = [...day.sections]
  sections.splice(index, 0, section)
  return { ...day, sections }
}

export function replaceSection(day: JourneyDay, index: number, section: DaySection): JourneyDay {
  return { ...day, sections: day.sections.map((s, i) => (i === index ? section : s)) }
}

/**
 * Tira o bloco do dia. As respostas já escritas nele continuam guardadas no progresso de cada
 * pessoa (nada é apagado), só deixam de aparecer.
 */
export function removeSection(day: JourneyDay, index: number): JourneyDay {
  return { ...day, sections: day.sections.filter((_, i) => i !== index) }
}

// ---------- dias e semanas ----------

export function findDay(journey: Journey, dayNumber: number): JourneyDay | undefined {
  return allDays(journey).find((day) => day.number === dayNumber)
}

export function replaceDay(journey: Journey, day: JourneyDay): Journey {
  return {
    ...journey,
    weeks: journey.weeks.map((week) => ({
      ...week,
      days: week.days.map((d) => (d.number === day.number ? day : d)),
    })),
  }
}

/** Número novo nunca usado: o número é a identidade do dia (as respostas são `d{número}:…`). */
export function nextDayNumber(journey: Journey): number {
  return Math.max(0, ...allDays(journey).map((day) => day.number)) + 1
}

export function addDay(journey: Journey, weekNumber: number, suffix: string): Journey {
  const number = nextDayNumber(journey)
  const day: JourneyDay = {
    number,
    title: 'Novo dia',
    subtitle: '',
    isReview: false,
    sections: [createSection('ritual', number, suffix), createSection('closing', number, suffix)],
  }
  return {
    ...journey,
    weeks: journey.weeks.map((week) =>
      week.number === weekNumber ? { ...week, days: [...week.days, day] } : week,
    ),
  }
}

/** Sobe ou desce o dia dentro da semana dele. */
export function moveDay(journey: Journey, dayNumber: number, delta: number): Journey {
  return {
    ...journey,
    weeks: journey.weeks.map((week) => {
      const index = week.days.findIndex((day) => day.number === dayNumber)
      return index === -1 ? week : { ...week, days: move(week.days, index, delta) }
    }),
  }
}

export function setWeekTheme(journey: Journey, weekNumber: number, theme: string): Journey {
  return {
    ...journey,
    weeks: journey.weeks.map((week) => (week.number === weekNumber ? { ...week, theme } : week)),
  }
}

export function sameDay(a: JourneyDay | undefined, b: JourneyDay | undefined): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// ---------- validação antes de salvar ----------

const isHttpUrl = (url: string) => /^https?:\/\/\S+$/i.test(url.trim())

/** O que impede salvar o dia, em português, na ordem dos blocos. Vazio = pode salvar. */
export function dayProblems(day: JourneyDay): string[] {
  const problems: string[] = []
  if (day.title.trim() === '') problems.push('O dia precisa de um título.')
  day.sections.forEach((section, index) => {
    const where = `Bloco ${index + 1}`
    switch (section.type) {
      case 'ritual':
      case 'text':
      case 'quote':
      case 'affirmation':
        if (section.text.trim() === '') problems.push(`${where}: falta o texto.`)
        break
      case 'video':
      case 'audio':
        if (!isHttpUrl(section.url)) {
          problems.push(`${where}: cole um link que comece com https://`)
        }
        break
      case 'image':
        if (section.mediaId === '') problems.push(`${where}: falta escolher a imagem.`)
        else if (section.alt.trim() === '') {
          problems.push(`${where}: descreva a imagem (para quem usa leitor de tela).`)
        }
        break
      default:
        break
    }
  })
  return problems
}
