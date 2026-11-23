import { describe, expect, it } from 'vitest'
import { cardTiles, dayCountOf, dayGroups, durationLabelOf, groupName } from './journeyLayout'
import type { JourneyProduct } from './product'

type Layout = Pick<
  JourneyProduct,
  'structure' | 'themes' | 'durationLabel' | 'dayCount' | 'previewDays'
>
const layout = (over: Partial<Layout>): Layout => ({
  structure: 'days',
  themes: [],
  durationLabel: '21 dias',
  ...over,
})

describe('layout da jornada', () => {
  it('conta os dias pelo número guardado ou pela duração escrita; tema conta os temas', () => {
    expect(dayCountOf(layout({ dayCount: 14 }))).toBe(14)
    expect(dayCountOf(layout({ durationLabel: '21 dias' }))).toBe(21)
    expect(dayCountOf(layout({ durationLabel: 'Jornada em áudio' }))).toBe(7)
    expect(dayCountOf(layout({ dayCount: 500 }))).toBe(99)
    const themes = [
      { label: '1', title: 'Raiz' },
      { label: '2', title: 'Voz' },
    ]
    expect(dayCountOf(layout({ structure: 'themes', themes }))).toBe(2)
  })

  it('semanas de 7 dias acompanham a duração; a última pode ser menor', () => {
    const groups = dayGroups(
      layout({ structure: 'weeks', dayCount: 16, themes: [{ label: 'I', title: 'Início' }] }),
    )
    expect(groups).toEqual([
      { label: 'I', title: 'Início', firstDay: 1, lastDay: 7 },
      { label: 'II', title: '', firstDay: 8, lastDay: 14 },
      { label: 'III', title: '', firstDay: 15, lastDay: 16 },
    ])
  })

  it('partes terminam onde a Andreía escolheu; a última vai até o fim', () => {
    const groups = dayGroups(
      layout({
        structure: 'parts',
        dayCount: 21,
        themes: [
          { label: '1', title: 'Descobrindo você mesma', lastDay: 10 },
          { label: '2', title: 'Desabrochando', lastDay: 3 },
        ],
      }),
    )
    expect(groups).toEqual([
      { label: '1', title: 'Descobrindo você mesma', firstDay: 1, lastDay: 10 },
      { label: '2', title: 'Desabrochando', firstDay: 11, lastDay: 21 },
    ])
  })

  it('partes com faixas impossíveis se ajustam: cada uma fica com pelo menos um dia', () => {
    const groups = dayGroups(
      layout({
        structure: 'parts',
        dayCount: 3,
        themes: [
          { label: '1', title: 'A', lastDay: 9 },
          { label: '2', title: 'B', lastDay: 9 },
          { label: '3', title: 'C' },
        ],
      }),
    )
    expect(groups.map((g) => [g.firstDay, g.lastDay])).toEqual([
      [1, 1],
      [2, 2],
      [3, 3],
    ])
  })

  it('escreve a duração: dias ou temas, no singular quando é um', () => {
    expect(durationLabelOf('weeks', 21, 3)).toBe('21 dias')
    expect(durationLabelOf('days', 1, 0)).toBe('1 dia')
    expect(durationLabelOf('themes', 0, 4)).toBe('4 temas')
    expect(groupName('parts', '2')).toBe('Parte 2')
  })

  it('cartões do banner: os 3 primeiros dias com título, em I, II e III', () => {
    const tiles = cardTiles(
      layout({
        structure: 'weeks',
        themes: [{ label: 'I', title: 'Semana da raiz' }],
        previewDays: ['Chegada', 'Corpo', 'Voz', 'Sobrando'],
      }),
    )
    expect(tiles).toEqual([
      { label: 'I', title: 'Chegada' },
      { label: 'II', title: 'Corpo' },
      { label: 'III', title: 'Voz' },
    ])
  })

  it('sem dias com título, os cartões são as semanas (com nome padrão quando vazio)', () => {
    const tiles = cardTiles(
      layout({ structure: 'weeks', dayCount: 14, themes: [{ label: 'I', title: 'Raiz' }] }),
    )
    expect(tiles).toEqual([
      { label: 'I', title: 'Raiz' },
      { label: 'II', title: 'Semana II' },
    ])
    expect(cardTiles(layout({ structure: 'days' }))).toEqual([])
  })
})
