import { describe, expect, it } from 'vitest'
import { createVictory, emptyVictoryDraft, validateVictoryDraft } from './victories'

describe('validateVictoryDraft', () => {
  it('exige descrever o que aconteceu', () => {
    expect(validateVictoryDraft({ ...emptyVictoryDraft(), action: '   ' })).toEqual([
      'action-required',
    ])
  })

  it('aceita o dia vazio ou entre 1 e 21', () => {
    const base = { ...emptyVictoryDraft(), action: 'Falei não' }
    expect(validateVictoryDraft(base)).toEqual([])
    expect(validateVictoryDraft({ ...base, day: '21' })).toEqual([])
    expect(validateVictoryDraft({ ...base, day: '0' })).toEqual(['invalid-day'])
    expect(validateVictoryDraft({ ...base, day: '2.5' })).toEqual(['invalid-day'])
  })
})

describe('createVictory', () => {
  it('limpa espaços e converte o dia', () => {
    const victory = createVictory(
      { date: '2026-11-21', day: '3', action: '  Falei não  ', result: ' leveza ' },
      'id-1',
      100,
    )
    expect(victory).toEqual({
      id: 'id-1',
      date: '2026-11-21',
      day: 3,
      action: 'Falei não',
      result: 'leveza',
      createdAt: 100,
    })
  })

  it('guarda o texto como texto, sem interpretar HTML', () => {
    const victory = createVictory(
      { ...emptyVictoryDraft(), action: '<img src=x onerror=alert(1)>' },
      'id-2',
      1,
    )
    expect(victory.action).toBe('<img src=x onerror=alert(1)>')
    expect(victory.day).toBeNull()
  })
})
