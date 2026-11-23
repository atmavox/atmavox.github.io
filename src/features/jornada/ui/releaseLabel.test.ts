import { describe, expect, it } from 'vitest'
import { lockedDayHint } from './releaseLabel'

describe('aviso de dia fechado', () => {
  const now = Date.UTC(2026, 10, 23, 15) // 23/11, 12h em Brasília

  it('antes de começar, pede para começar', () => {
    expect(lockedDayHint(null, now)).toBe('Comece a jornada para abrir')
  })

  it('o dia de amanhã diz "amanhã"; os outros, a data em Brasília', () => {
    expect(lockedDayHint(Date.UTC(2026, 10, 24, 3), now)).toBe('Abre amanhã, à meia-noite')
    expect(lockedDayHint(Date.UTC(2026, 10, 26, 3), now)).toBe('Abre em 26/11, à meia-noite')
  })
})
