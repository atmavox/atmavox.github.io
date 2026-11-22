import { describe, expect, it } from 'vitest'
import { chamaInterna21 } from '../content/chama-interna-21'
import { allDays, type DaySection } from './journey'
import {
  addDay,
  canRemoveDay,
  createSection,
  dayProblems,
  duplicateSection,
  findDay,
  moveDay,
  moveSection,
  nextDayNumber,
  removeDay,
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

  it('apagar um dia tira ele da semana e aposenta o número (dia novo não reusa)', () => {
    const journey = removeDay(chamaInterna21, 21)
    expect(findDay(journey, 21)).toBeUndefined()
    expect(journey.retiredDays).toEqual([21])
    expect(nextDayNumber(journey)).toBe(22)
    // Mesmo apagando o maior número, o próximo dia não volta a usá-lo.
    const added = addDay(journey, 3, 's')
    expect(nextDayNumber(removeDay(added, 22))).toBe(23)
  })

  it('não deixa uma semana sem nenhum dia', () => {
    const oneDayWeek = {
      ...chamaInterna21,
      weeks: [{ ...chamaInterna21.weeks[0]!, days: chamaInterna21.weeks[0]!.days.slice(0, 1) }],
    }
    expect(canRemoveDay(oneDayWeek, 1)).toBe(false)
    expect(removeDay(oneDayWeek, 1)).toBe(oneDayWeek)
  })

  it('a jornada com dias apagados passa pela leitura da nuvem sem perder os números aposentados', () => {
    const journey = removeDay(chamaInterna21, 21)
    expect(parseJourney(JSON.parse(JSON.stringify(journey)))?.retiredDays).toEqual([21])
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

  it('imagem pede o arquivo e depois a descrição (acessibilidade)', () => {
    const image = createSection('image', 1, 'i')
    expect(dayProblems({ ...day1, sections: [image] })).toEqual([
      'Bloco 1: falta escolher a imagem.',
    ])
    const chosen: DaySection = { type: 'image', id: image.id, mediaId: 'img1', alt: '' }
    expect(dayProblems({ ...day1, sections: [chosen] })).toEqual([
      'Bloco 1: descreva a imagem (para quem usa leitor de tela).',
    ])
    const described: DaySection = { ...chosen, alt: 'Mãos no peito' }
    expect(dayProblems({ ...day1, sections: [described] })).toEqual([])
  })
})
