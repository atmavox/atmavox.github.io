import { describe, expect, it } from 'vitest'
import { openedOf } from './accessAdmin'

describe('quem abriu o conteúdo, no Modo Andreía', () => {
  it('o Modo Andreía lê de volta a pessoa, o produto e quando abriu', () => {
    expect(
      openedOf({
        name: 'projects/p/databases/(default)/documents/users/ana/opened/retorne',
        fields: { lastOpenedAt: { integerValue: '42' } },
      }),
    ).toEqual({ uid: 'ana', productId: 'retorne', lastOpenedAt: 42 })
    expect(openedOf({ name: 'x', fields: {} })).toBeNull()
  })
})
