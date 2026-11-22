import { describe, expect, it } from 'vitest'
import { oppositeTheme, parseTheme, resolveInitialTheme } from './theme'

describe('resolveInitialTheme', () => {
  it('na primeira visita, abre no tema claro', () => {
    expect(resolveInitialTheme(null)).toBe('light')
  })

  it('usa a escolha salva da pessoa', () => {
    expect(resolveInitialTheme('dark')).toBe('dark')
    expect(resolveInitialTheme('light')).toBe('light')
  })

  it('ignora valores salvos inválidos', () => {
    expect(resolveInitialTheme('roxo')).toBe('light')
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
