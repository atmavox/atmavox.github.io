import { describe, expect, it } from 'vitest'
import type { JourneyProduct } from '../../shared/catalog/product'
import {
  countByTerritory,
  durationDays,
  EMPTY_FILTERS,
  filterJourneys,
  groupByTerritory,
  hasActiveFilters,
  structureLabel,
} from './journeyFilters'

const journey = (over: Partial<JourneyProduct>): JourneyProduct => ({
  kind: 'journey',
  id: 'x',
  title: 'X',
  phrase: '',
  territory: 'presenca',
  status: 'published',
  pricing: { type: 'free' },
  featured: false,
  order: 1,
  structure: 'days',
  durationLabel: '7 dias',
  themes: [],
  ...over,
})

const chama = journey({
  id: 'chama',
  title: 'A Chama Interna',
  territory: 'estado-cinza',
  durationLabel: '21 dias',
  themes: [{ label: 'I', title: 'Nomeando o Cinza' }],
})
const ritual = journey({ id: 'ritual', title: 'Ritual Matinal', status: 'soon' })
const raizes = journey({
  id: 'raizes',
  title: 'Raízes',
  territory: 'consciencia',
  durationLabel: '14 dias',
})
const audio = journey({ id: 'audio', title: 'Saindo', durationLabel: 'Jornada em áudio' })
const all = [chama, ritual, raizes, audio]
const ids = (list: JourneyProduct[]) => list.map((j) => j.id)

describe('filterJourneys', () => {
  it('sem filtro, mostra todas', () => {
    expect(ids(filterJourneys(all, EMPTY_FILTERS))).toEqual(['chama', 'ritual', 'raizes', 'audio'])
  })

  it('busca sem acento e sem maiúscula, no nome, na frase, no território e nos temas', () => {
    expect(ids(filterJourneys(all, { ...EMPTY_FILTERS, query: 'raizes' }))).toEqual(['raizes'])
    expect(ids(filterJourneys(all, { ...EMPTY_FILTERS, query: 'CONSCIÊNCIA' }))).toEqual(['raizes'])
    expect(ids(filterJourneys(all, { ...EMPTY_FILTERS, query: 'nomeando' }))).toEqual(['chama'])
  })

  it('filtra por território e por disponível ou em breve', () => {
    expect(ids(filterJourneys(all, { ...EMPTY_FILTERS, territory: 'estado-cinza' }))).toEqual([
      'chama',
    ])
    expect(ids(filterJourneys(all, { ...EMPTY_FILTERS, show: 'em-breve' }))).toEqual(['ritual'])
    expect(ids(filterJourneys(all, { ...EMPTY_FILTERS, show: 'disponiveis' }))).not.toContain(
      'ritual',
    )
  })

  it('filtra por duração; jornada sem número de dias fica de fora', () => {
    expect(ids(filterJourneys(all, { ...EMPTY_FILTERS, duration: 'ate-7' }))).toEqual(['ritual'])
    expect(ids(filterJourneys(all, { ...EMPTY_FILTERS, duration: '8-14' }))).toEqual(['raizes'])
    expect(ids(filterJourneys(all, { ...EMPTY_FILTERS, duration: '15-mais' }))).toEqual(['chama'])
  })
})

describe('apoio do hub', () => {
  it('lê os dias do rótulo de duração', () => {
    expect(durationDays('21 dias')).toBe(21)
    expect(durationDays('1 dia')).toBe(1)
    expect(durationDays('Jornada em áudio')).toBeNull()
  })

  it('agrupa por território na ordem da marca, sem grupos vazios', () => {
    expect(groupByTerritory(all).map((g) => g.territory)).toEqual([
      'estado-cinza',
      'consciencia',
      'presenca',
    ])
    expect(countByTerritory(all)).toEqual({
      'estado-cinza': 1,
      consciencia: 1,
      presenca: 2,
      expansao: 0,
    })
  })

  it('sabe quando há filtro ligado', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: ' ' })).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, duration: 'ate-7' })).toBe(true)
  })

  it('descreve a estrutura', () => {
    expect(structureLabel('weeks', 3)).toBe('3 semanas')
    expect(structureLabel('days', 0)).toBe('Por dias')
    expect(structureLabel('themes', 4)).toBe('Por temas')
  })
})
