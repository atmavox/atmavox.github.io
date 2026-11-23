import { describe, expect, it } from 'vitest'
import { allDays, allFieldIds } from '../domain/journey'
import { chamaInterna21 } from './chama-interna-21'
import { closingCopy, coverCopy, reviewsCopy, victoriesCopy } from './copy'

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (typeof value === 'object' && value !== null)
    return Object.values(value).flatMap(collectStrings)
  return []
}

describe('conteúdo da jornada Chama Interna 21', () => {
  const days = allDays(chamaInterna21)

  it('tem 21 dias numerados em sequência, 7 por semana', () => {
    expect(days).toHaveLength(21)
    expect(days.map((d) => d.number)).toEqual(Array.from({ length: 21 }, (_, i) => i + 1))
    for (const week of chamaInterna21.weeks) {
      expect(week.days.map((d) => d.number)).toEqual(
        Array.from({ length: 7 }, (_, i) => (week.number - 1) * 7 + i + 1),
      )
    }
  })

  it('tem revisões exatamente nos dias 7, 14 e 21', () => {
    expect(days.filter((d) => d.isReview).map((d) => d.number)).toEqual([7, 14, 21])
  })

  it('todo dia tem ritual e afirmação', () => {
    for (const day of days) {
      const types = day.sections.map((s) => s.type)
      expect(types, `dia ${day.number}`).toContain('ritual')
      expect(types, `dia ${day.number}`).toContain('affirmation')
    }
  })

  it('tem ids de campo únicos', () => {
    const ids = allFieldIds(chamaInterna21)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('os ids dos dias começam pelo próprio dia (d{dia}:chave)', () => {
    for (const day of days) {
      for (const section of day.sections) {
        if ('fieldId' in section)
          expect(section.fieldId).toMatch(new RegExp(`^d${day.number}:\\w+$`))
      }
    }
  })

  it('tem 11 perguntas de revisão e 4 campos de encerramento', () => {
    const reviewQuestions = chamaInterna21.reviews.flatMap((r) => r.questions)
    expect(reviewQuestions).toHaveLength(11)
    expect(chamaInterna21.closingQuestions).toHaveLength(4)
  })

  it('não tem caracteres cirílicos (erro do original: "Neutра", "aprenди")', () => {
    const strings = collectStrings([
      chamaInterna21,
      coverCopy,
      reviewsCopy,
      victoriesCopy,
      closingCopy,
    ])
    const withCyrillic = strings.filter((s) => /[Ѐ-ӿ]/.test(s))
    expect(withCyrillic).toEqual([])
  })

  it('o ritual do dia 5 leva ao áudio gratuito no YouTube', () => {
    const ritual = days[4]?.sections.find((s) => s.type === 'ritual')
    expect(ritual && 'text' in ritual ? ritual.text : '').toContain('https://youtu.be/')
  })
})
