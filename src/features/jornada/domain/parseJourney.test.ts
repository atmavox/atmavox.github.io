import { describe, expect, it } from 'vitest'
import { chamaInterna21 } from '../content/chama-interna-21'
import { parseJourney } from './parseJourney'

/** Simula o caminho pela nuvem: vira JSON e volta. */
const roundTrip = (value: unknown): unknown => JSON.parse(JSON.stringify(value))

function withFirstDaySections(sections: unknown[]): unknown {
  const raw = roundTrip(chamaInterna21) as { weeks: { days: { sections: unknown[] }[] }[] }
  raw.weeks[0]!.days[0]!.sections = sections
  return raw
}

describe('parseJourney', () => {
  it('lê de volta a jornada atual sem perder nada', () => {
    expect(parseJourney(roundTrip(chamaInterna21))).toEqual(chamaInterna21)
  })

  it('aceita os blocos novos do modo Andreía', () => {
    const journey = parseJourney(
      withFirstDaySections([
        { type: 'text', id: 'd1:text', text: 'Olá' },
        { type: 'quote', id: 'd1:quote', text: 'Uma frase' },
        { type: 'divider', id: 'd1:divider' },
        { type: 'image', id: 'd1:image', mediaId: 'abc', alt: 'Mãos no peito' },
        {
          type: 'video',
          id: 'd1:video',
          label: 'Vídeo',
          title: 'Retorne',
          url: 'https://youtu.be/x',
        },
        {
          type: 'audio',
          id: 'd1:audio',
          label: 'Áudio',
          title: 'Prática',
          url: 'https://drive.google.com/a',
        },
      ]),
    )
    expect(journey?.weeks[0]?.days[0]?.sections.map((s) => s.type)).toEqual([
      'text',
      'quote',
      'divider',
      'image',
      'video',
      'audio',
    ])
  })

  it('recusa link que não é http(s), para não abrir javascript: na tela', () => {
    const raw = withFirstDaySections([
      { type: 'video', id: 'd1:video', label: '', title: '', url: 'javascript:alert(1)' },
    ])
    expect(parseJourney(raw)).toBeNull()
  })

  it('recusa bloco de tipo desconhecido ou sem id', () => {
    expect(parseJourney(withFirstDaySections([{ type: 'confete', id: 'd1:x' }]))).toBeNull()
    expect(parseJourney(withFirstDaySections([{ type: 'divider' }]))).toBeNull()
  })

  it('recusa ids repetidos, que fariam duas etapas dividirem a mesma resposta', () => {
    const raw = withFirstDaySections([
      { type: 'divider', id: 'd1:igual' },
      { type: 'divider', id: 'd1:igual' },
    ])
    expect(parseJourney(raw)).toBeNull()
  })

  it('recusa pergunta com id de campo fora do formato', () => {
    const raw = withFirstDaySections([
      { type: 'prompt', id: 'qualquer', fieldId: 'qualquer', label: 'Reflexão', placeholder: '' },
    ])
    expect(parseJourney(raw)).toBeNull()
  })

  it('recusa o que não é uma jornada', () => {
    expect(parseJourney(null)).toBeNull()
    expect(parseJourney({ id: 'x', weeks: [], reviews: [], closingQuestions: [] })).toBeNull()
  })
})
