import { describe, expect, it } from 'vitest'
import { oppositeTheme, parseTheme, resolveInitialTheme } from './theme'

describe('resolveInitialTheme', () => {
  it('usa a escolha salva, mesmo contra a preferência do sistema', () => {
    expect(resolveInitialTheme('dark', true)).toBe('dark')
    expect(resolveInitialTheme('light', false)).toBe('light')
  })

  it('na primeira visita, segue a preferência do sistema', () => {
    expect(resolveInitialTheme(null, true)).toBe('light')
    expect(resolveInitialTheme(null, false)).toBe('dark')
  })

  it('ignora valores salvos inválidos', () => {
    expect(resolveInitialTheme('roxo', false)).toBe('dark')
  })
})

describe('parseTheme e oppositeTheme', () => {
  it('aceita só light e dark', () => {
    expect(parseTheme('light')).toBe('light')
    expect(parseTheme(42)).toBeNull()
  })

  it('alterna entre os dois temas', () => {
    expect(oppositeTheme('dark')).toBe('light')
    expect(oppositeTheme('light')).toBe('dark')
  })
})
