import { describe, expect, it } from 'vitest'
import { DEFAULT_THERAPIES, durationLabel, parseTherapies } from './therapy'

const base = {
  id: 'reiki',
  name: 'Reiki',
  description: 'Texto',
  icon: 'hands',
  tone: 'dawn',
  modality: 'remote',
  durationMin: 50,
  priceCents: 12000,
  active: true,
  questions: [],
}

describe('parseTherapies', () => {
  it('lê as terapias do código de volta sem perder nada', () => {
    expect(parseTherapies(JSON.parse(JSON.stringify(DEFAULT_THERAPIES)))).toEqual(DEFAULT_THERAPIES)
  })

  it('deixa de fora itens quebrados e ids repetidos', () => {
    const list = parseTherapies([
      base,
      { ...base, name: 'Repetida' },
      { ...base, id: 'Sem Slug' },
      { ...base, id: 'curta', durationMin: 5 },
      { ...base, id: 'sem-modalidade', modality: 'lua' },
      'texto',
    ])
    expect(list.map((t) => t.id)).toEqual(['reiki'])
  })

  it('terapia sem preço nunca fica ativa', () => {
    const [therapy] = parseTherapies([{ ...base, priceCents: 0, active: true }])
    expect(therapy?.active).toBe(false)
  })

  it('troca ícone e cor desconhecidos pelos de reserva', () => {
    const [therapy] = parseTherapies([{ ...base, icon: 'foguete', tone: 'neon' }])
    expect(therapy).toMatchObject({ icon: 'spark', tone: 'dusk' })
  })

  it('opções só valem para pergunta de uma opção', () => {
    const [therapy] = parseTherapies([
      {
        ...base,
        questions: [
          { id: 'a', label: 'Sim ou não?', type: 'yesno', options: ['x'] },
          { id: 'b', label: 'Qual?', type: 'single', options: ['Um', ' ', 'Dois'] },
          { id: '', label: 'Sem id', type: 'short' },
        ],
      },
    ])
    expect(therapy?.questions).toEqual([
      { id: 'a', label: 'Sim ou não?', type: 'yesno', options: [] },
      { id: 'b', label: 'Qual?', type: 'single', options: ['Um', 'Dois'] },
    ])
  })
})

describe('durationLabel', () => {
  it('mostra minutos e horas do jeito que se fala', () => {
    expect(durationLabel(50)).toBe('50 min')
    expect(durationLabel(60)).toBe('1 h')
    expect(durationLabel(90)).toBe('1 h 30 min')
  })
})
