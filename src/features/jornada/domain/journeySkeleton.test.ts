import { describe, expect, it } from 'vitest'
import { dayGroups } from '../../../shared/catalog/journeyLayout'
import type { JourneyProduct } from '../../../shared/catalog/product'
import { allDays } from './journey'
import { setOpening } from './journeyEditing'
import { createJourneySkeleton, withDayTitles } from './journeySkeleton'
import { parseJourney } from './parseJourney'

type Layout = Pick<JourneyProduct, 'structure' | 'themes' | 'durationLabel' | 'dayCount'>

/** O esqueleto como a jornada monta: pelos trechos de dias do produto do catálogo. */
const skeletonOf = (id: string, product: Layout) =>
  createJourneySkeleton({ id, structure: product.structure, groups: dayGroups(product) })

const themesOf = (...titles: string[]) =>
  titles.map((title, i) => ({ label: String(i + 1), title }))

describe('esqueleto de uma jornada nova', () => {
  it('por semana: 14 dias viram 2 semanas de 7, com os temas do produto', () => {
    const j = skeletonOf('raizes', {
      structure: 'weeks',
      durationLabel: '14 dias',
      dayCount: 14,
      themes: themesOf('Raiz', 'Desbloqueio'),
    })
    expect(j.weeks.map((w) => [w.roman, w.theme, w.days.length])).toEqual([
      ['I', 'Raiz', 7],
      ['II', 'Desbloqueio', 7],
    ])
    expect(allDays(j).map((d) => d.number)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1))
    expect(allDays(j)[7]?.title).toBe('Dia 8')
  })

  it('por semana: a última semana pode ser menor', () => {
    const j = skeletonOf('x', { structure: 'weeks', durationLabel: '10 dias', themes: [] })
    expect(j.weeks.map((w) => w.days.length)).toEqual([7, 3])
  })

  it('em partes: cada parte com a faixa de dias escolhida', () => {
    const j = skeletonOf('florescer', {
      structure: 'parts',
      durationLabel: '21 dias',
      dayCount: 21,
      themes: [
        { label: '1', title: 'Descobrindo você mesma', lastDay: 10 },
        { label: '2', title: 'Desabrochando' },
      ],
    })
    expect(j.structure).toBe('parts')
    expect(j.weeks.map((w) => [w.theme, w.days[0]?.number, w.days.at(-1)?.number])).toEqual([
      ['Descobrindo você mesma', 1, 10],
      ['Desabrochando', 11, 21],
    ])
    expect(parseJourney(JSON.parse(JSON.stringify(j)))).toEqual(j)
  })

  it('por tema: um tema por parte, cada um com um conteúdo só (sem dias)', () => {
    const j = skeletonOf('corpo', {
      structure: 'themes',
      durationLabel: '3 temas',
      themes: themesOf('Respiração', 'Sensação', 'Movimento'),
    })
    expect(j.structure).toBe('themes')
    expect(j.weeks.map((w) => [w.theme, w.days.length])).toEqual([
      ['Respiração', 1],
      ['Sensação', 1],
      ['Movimento', 1],
    ])
  })

  it('por dias: uma parte só com todos os dias vazios', () => {
    const j = skeletonOf('ritual', { structure: 'days', durationLabel: '7 dias', themes: [] })
    expect(j.weeks).toHaveLength(1)
    expect(j.weeks[0]?.days.every((d) => d.sections.length === 0)).toBe(true)
  })

  it('o esqueleto passa na leitura (pode ser salvo e publicado)', () => {
    const j = skeletonOf('ritual', { structure: 'days', durationLabel: '3 dias', themes: [] })
    expect(parseJourney(JSON.parse(JSON.stringify(j)))).toEqual(j)
  })

  it('o texto da Abertura é guardado, lido e some quando fica vazio', () => {
    const j = skeletonOf('r', { structure: 'days', durationLabel: '1 dia', themes: [] })
    const withText = setOpening(j, 'Bem-vinda.')
    expect(parseJourney(JSON.parse(JSON.stringify(withText)))?.opening).toBe('Bem-vinda.')
    expect(setOpening(withText, '  ')).not.toHaveProperty('opening')
  })
})

describe('títulos dos dias dados no produto', () => {
  const base = skeletonOf('ritual', { structure: 'days', durationLabel: '4 dias', themes: [] })

  it('entram nos dias pela ordem; título vazio deixa "Dia N"', () => {
    const j = withDayTitles(base, ['Chegada', '', 'Voz'])
    expect(allDays(j).map((d) => d.title)).toEqual(['Chegada', 'Dia 2', 'Voz', 'Dia 4'])
  })

  it('nunca trocam o que a Andreía já escreveu no editor', () => {
    const edited = withDayTitles(base, ['Escrito no editor'])
    expect(allDays(withDayTitles(edited, ['Outro']))[0]?.title).toBe('Escrito no editor')
  })
})
