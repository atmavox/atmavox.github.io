import { describe, expect, it } from 'vitest'
import { DEFAULT_THERAPIES } from '../../../shared/ativacao/therapy'
import {
  emptyTherapyForm,
  formFromTherapy,
  moveTherapy,
  therapyFromForm,
  therapyIdFrom,
  toggleTherapy,
  upsertTherapy,
  validateTherapyForm,
} from './therapyForm'

const reiki = DEFAULT_THERAPIES[0]!

describe('formulário de terapia', () => {
  it('ida e volta mantém a terapia igual', () => {
    const priced = { ...reiki, priceCents: 12000, active: true }
    expect(therapyFromForm(formFromTherapy(priced), [])).toEqual(priced)
  })

  it('pede nome, descrição e preço válido', () => {
    expect(validateTherapyForm({ ...emptyTherapyForm(), price: 'abc' })).toEqual({
      name: 'Dê um nome à terapia.',
      description: 'Conte em uma ou duas frases como é.',
      price: 'Use só números, como 120 ou 120,00.',
    })
  })

  it('não deixa ativar sem preço', () => {
    const form = { ...formFromTherapy(reiki), active: true }
    expect(validateTherapyForm(form).price).toBe('Para ativar, a terapia precisa de preço.')
  })

  it('confere a duração e as perguntas extras', () => {
    const form = {
      ...formFromTherapy(reiki),
      durationMin: 5,
      questions: [
        { id: 'a', label: ' ', type: 'yesno' as const, options: [] },
        { id: 'b', label: 'Qual?', type: 'single' as const, options: ['Só uma', ''] },
      ],
    }
    expect(validateTherapyForm(form)).toEqual({
      duration: 'Entre 10 e 240 minutos.',
      questions: { a: 'Escreva a pergunta.', b: 'Dê pelo menos duas opções.' },
    })
  })

  it('terapia nova ganha um id pelo nome, sem repetir', () => {
    expect(therapyIdFrom('Aromaterapia a distância', [])).toBe('aromaterapia-a-distancia')
    expect(therapyIdFrom('Reiki', ['reiki', 'reiki-2'])).toBe('reiki-3')
    const form = { ...emptyTherapyForm(), name: 'Reiki', description: 'x', price: '90' }
    expect(therapyFromForm(form, ['reiki'])).toMatchObject({ id: 'reiki-2', priceCents: 9000 })
  })
})

describe('lista de terapias', () => {
  it('troca pelo id ou acrescenta no fim', () => {
    const changed = { ...reiki, name: 'Reiki' }
    expect(upsertTherapy(DEFAULT_THERAPIES, changed)[0]?.name).toBe('Reiki')
    const novo = { ...reiki, id: 'nova' }
    expect(upsertTherapy(DEFAULT_THERAPIES, novo).at(-1)?.id).toBe('nova')
  })

  it('muda a ordem', () => {
    const ids = moveTherapy(DEFAULT_THERAPIES, 3, 0).map((t) => t.id)
    expect(ids[0]).toBe(DEFAULT_THERAPIES[3]!.id)
  })

  it('ativar sem preço é recusado; com preço, liga e desliga', () => {
    expect(toggleTherapy(DEFAULT_THERAPIES, reiki.id)).toBeNull()
    const priced = upsertTherapy(DEFAULT_THERAPIES, { ...reiki, priceCents: 12000 })
    const on = toggleTherapy(priced, reiki.id)
    expect(on?.[0]?.active).toBe(true)
    expect(toggleTherapy(on!, reiki.id)?.[0]?.active).toBe(false)
  })
})
