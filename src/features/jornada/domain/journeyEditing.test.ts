import { describe, expect, it } from 'vitest'
import { chamaInterna21 } from '../content/chama-interna-21'
import { allDays } from './journey'
import {
  addDay,
  createSection,
  dayProblems,
  duplicateSection,
  findDay,
  moveDay,
  moveSection,
  nextDayNumber,
  removeSection,
  replaceDay,
  sameDay,
  setWeekTheme,
} from './journeyEditing'
import { parseJourney } from './parseJourney'

const day1 = allDays(chamaInterna21)[0]!

describe('blocos', () => {
  it('bloco novo ganha id novo, no formato que a nuvem aceita', () => {
    const prompt = createSection('prompt', 1, 'abc')
    expect(prompt).toMatchObject({ id: 'd1:prompt-abc', fieldId: 'd1:prompt-abc' })
    const day = { ...day1, sections: [...day1.sections, prompt] }
    const journey = replaceDay(chamaInterna21, day)
    expect(parseJourney(JSON.parse(JSON.stringify(journey)))).not.toBeNull()
  })

  it('duplicar dá ids novos à cópia, para não dividir respostas', () => {
    const original = day1.sections.find((s) => s.type === 'prompt')!
    const copy = duplicateSection(original, 1, 'xyz')
    expect(copy.id).not.toBe(original.id)
    expect('fieldId' in copy && copy.fieldId).toBe(copy.id)
  })

  it('mover troca a ordem sem mudar ids; nos limites não faz nada', () => {
    const moved = moveSection(day1, 0, 1)
    expect(moved.sections[1]?.id).toBe(day1.sections[0]?.id)
    expect(moveSection(day1, 0, -1).sections).toEqual(day1.sections)
  })

  it('remover tira o bloco do dia', () => {
    expect(removeSection(day1, 0).sections).toHaveLength(day1.sections.length - 1)
  })
})

describe('dias e semanas', () => {
  it('dia novo usa um número nunca usado e entra no fim da semana', () => {
    const journey = addDay(chamaInterna21, 2, 's')
    expect(nextDayNumber(chamaInterna21)).toBe(22)
    expect(journey.weeks[1]?.days.at(-1)?.number).toBe(22)
    expect(findDay(journey, 22)?.sections.map((s) => s.type)).toEqual(['ritual', 'closing'])
  })

  it('subir um dia mantém o número (a identidade) e muda só a ordem', () => {
    const journey = moveDay(chamaInterna21, 2, -1)
    expect(journey.weeks[0]?.days.slice(0, 2).map((d) => d.number)).toEqual([2, 1])
  })

  it('muda o tema da semana', () => {
    expect(setWeekTheme(chamaInterna21, 3, 'Nova identidade').weeks[2]?.theme).toBe(
      'Nova identidade',
    )
  })

  it('compara dias pelo conteúdo', () => {
    expect(sameDay(day1, { ...day1 })).toBe(true)
    expect(sameDay(day1, { ...day1, title: 'Outro' })).toBe(false)
  })
})

describe('validação antes de salvar', () => {
  it('o dia atual não tem problemas', () => {
    expect(allDays(chamaInterna21).flatMap(dayProblems)).toEqual([])
  })

  it('aponta título vazio, texto vazio e link inválido', () => {
    const day = {
      ...day1,
      title: ' ',
      sections: [createSection('text', 1, 'a'), createSection('video', 1, 'b')],
    }
    expect(dayProblems(day)).toEqual([
      'O dia precisa de um título.',
      'Bloco 1: falta o texto.',
      'Bloco 2: cole um link que comece com https://',
    ])
  })
})
