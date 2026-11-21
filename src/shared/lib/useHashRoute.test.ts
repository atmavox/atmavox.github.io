import { describe, expect, it } from 'vitest'
import { pathFromHash } from './useHashRoute'

describe('pathFromHash', () => {
  it('converte o hash em caminho', () => {
    expect(pathFromHash('#/jornada/semana-1')).toBe('/jornada/semana-1')
  })

  it('trata hash vazio, só "#" e barra final', () => {
    expect(pathFromHash('')).toBe('/')
    expect(pathFromHash('#')).toBe('/')
    expect(pathFromHash('#/')).toBe('/')
    expect(pathFromHash('#/jornada/')).toBe('/jornada')
  })

  it('ignora âncoras que não são rotas e parâmetros de busca', () => {
    expect(pathFromHash('#topo')).toBe('/')
    expect(pathFromHash('#/jornada?utm=instagram')).toBe('/jornada')
  })
})
