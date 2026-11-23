import { describe, expect, it } from 'vitest'
import {
  addDays,
  EMPTY_AVAILABILITY,
  isDate,
  localDate,
  longDate,
  occurrencesOn,
  parseAvailability,
  skipOccurrence,
  slotsFor,
  startOfWeek,
  startTimes,
  timeLabel,
  upsertWindow,
  validateWindow,
  weekOf,
  type Availability,
  type AvailabilityWindow,
} from './availability'

const reiki = { id: 'reiki', name: 'Reiki', durationMin: 50 }
const barras = { id: 'barras', name: 'Barras', durationMin: 60 }
const reprog = { id: 'reprog', name: 'Reprogramação', durationMin: 90 }

// Quarta, 2 de dezembro de 2026, das 17h às 20h, toda semana.
const quarta: AvailabilityWindow = {
  id: 'w1',
  date: '2026-12-02',
  start: '17:00',
  end: '20:00',
  therapyIds: ['reiki', 'barras'],
  weekly: true,
  until: null,
  skip: [],
}
const agenda: Availability = { windows: [quarta], booked: [] }

describe('datas', () => {
  it('soma dias atravessando o mês e o ano', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('a semana começa na segunda', () => {
    expect(startOfWeek('2026-12-03')).toBe('2026-11-30')
    expect(startOfWeek('2026-12-06')).toBe('2026-11-30')
    expect(weekOf('2026-12-03')).toHaveLength(7)
  })

  it('confere datas de verdade e escreve por extenso', () => {
    expect(isDate('2026-02-30')).toBe(false)
    expect(isDate('2026-12-03')).toBe(true)
    expect(longDate('2026-12-03')).toBe('Quinta, 3 de dezembro')
    expect(timeLabel('17:00')).toBe('17h')
    expect(timeLabel('17:50')).toBe('17h50')
  })

  it('hoje vem do relógio do aparelho', () => {
    expect(localDate(new Date(2026, 11, 3, 23, 59).getTime())).toBe('2026-12-03')
  })
})

describe('faixas que repetem', () => {
  it('valem no mesmo dia da semana, a partir do primeiro dia', () => {
    expect(occurrencesOn(agenda, '2026-12-02')).toHaveLength(1)
    expect(occurrencesOn(agenda, '2026-12-09')).toHaveLength(1)
    expect(occurrencesOn(agenda, '2026-11-25')).toHaveLength(0)
    expect(occurrencesOn(agenda, '2026-12-03')).toHaveLength(0)
  })

  it('param no último dia e pulam o dia tirado', () => {
    const ate = upsertWindow(agenda, { ...quarta, until: '2026-12-09' })
    expect(occurrencesOn(ate, '2026-12-16')).toHaveLength(0)
    const semUm = skipOccurrence(agenda, 'w1', '2026-12-09')
    expect(occurrencesOn(semUm, '2026-12-09')).toHaveLength(0)
    expect(occurrencesOn(semUm, '2026-12-16')).toHaveLength(1)
  })
})

describe('horários de início', () => {
  it('um a cada duração + 10 minutos, enquanto a sessão couber', () => {
    expect(startTimes(quarta, 50)).toEqual(['17:00', '18:00', '19:00'])
    expect(startTimes(quarta, 40)).toEqual(['17:00', '17:50', '18:40'])
    expect(startTimes(quarta, 200)).toEqual([])
  })

  it('pula o que encosta num horário aprovado', () => {
    expect(startTimes(quarta, 50, [{ date: '2026-12-02', start: '18:00', end: '18:50' }])).toEqual([
      '17:00',
      '19:00',
    ])
  })

  it('para a pessoa: só os dias e as faixas daquela terapia', () => {
    expect(slotsFor(agenda, reiki, '2026-12-01', '2026-12-10')).toEqual([
      { date: '2026-12-02', starts: ['17:00', '18:00', '19:00'] },
      { date: '2026-12-09', starts: ['17:00', '18:00', '19:00'] },
    ])
    expect(slotsFor(agenda, reprog, '2026-12-01', '2026-12-10')).toEqual([])
  })

  it('aprovado num dia só tira daquele dia', () => {
    const comAprovado = {
      ...agenda,
      booked: [{ date: '2026-12-02', start: '17:00', end: '17:50' }],
    }
    const [dia2, dia9] = slotsFor(comAprovado, reiki, '2026-12-01', '2026-12-10')
    expect(dia2?.starts).toEqual(['18:00', '19:00'])
    expect(dia9?.starts).toEqual(['17:00', '18:00', '19:00'])
  })
})

describe('leitura e validação', () => {
  it('lê de volta e deixa de fora faixas quebradas', () => {
    expect(parseAvailability(JSON.parse(JSON.stringify(agenda)))).toEqual(agenda)
    const lida = parseAvailability({
      windows: [
        quarta,
        { ...quarta, id: 'w2', end: '16:00' },
        { ...quarta, id: 'w3', therapyIds: [] },
        { ...quarta, id: 'w4', date: 'amanhã' },
      ],
    })
    expect(lida.windows.map((w) => w.id)).toEqual(['w1'])
    expect(parseAvailability(null)).toEqual(EMPTY_AVAILABILITY)
  })

  it('pede dia, horário em ordem e terapia que caiba', () => {
    const nova = { ...quarta, id: 'n', start: '20:00', end: '19:00', therapyIds: [] }
    expect(validateWindow(nova, [reiki], EMPTY_AVAILABILITY)).toEqual({
      time: 'O fim precisa ser depois do começo.',
      therapies: 'Escolha pelo menos uma terapia.',
    })
    const curta = { ...quarta, id: 'n', start: '17:00', end: '18:00', therapyIds: ['reprog'] }
    expect(validateWindow(curta, [reprog], EMPTY_AVAILABILITY).fit).toBe(
      'Nenhuma terapia escolhida cabe nesse período.',
    )
  })

  it('avisa quando encosta em outra faixa do mesmo dia', () => {
    const outra = {
      ...quarta,
      id: 'n',
      date: '2026-12-09',
      weekly: false,
      start: '19:00',
      end: '21:00',
    }
    expect(validateWindow(outra, [reiki, barras], agenda).time).toBe(
      'Esse período encosta em outro horário livre do dia.',
    )
  })
})
