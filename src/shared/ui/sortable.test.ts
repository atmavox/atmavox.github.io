import { describe, expect, it, vi } from 'vitest'
import { nearestIndex, shiftedIndex, SortableEngine } from './sortable'

const rect = (x: number, y: number) => new DOMRect(x, y, 100, 40)

describe('arrastar para ordenar', () => {
  it('acha o lugar mais perto, em lista e em grade', () => {
    const list = [rect(0, 0), rect(0, 50), rect(0, 100)]
    expect(nearestIndex(list, { x: 50, y: 118 })).toBe(2)
    const grid = [rect(0, 0), rect(110, 0), rect(0, 50), rect(110, 50)]
    expect(nearestIndex(grid, { x: 160, y: 70 })).toBe(3)
  })

  it('os outros escorregam uma casa para abrir espaço', () => {
    // O 4º (índice 3) vai para o começo: 0, 1 e 2 descem uma casa.
    expect([0, 1, 2, 3, 4].map((i) => shiftedIndex(i, 3, 0))).toEqual([1, 2, 3, 0, 4])
    // O 1º vai para o 3º lugar: 1 e 2 sobem.
    expect([0, 1, 2, 3].map((i) => shiftedIndex(i, 0, 2))).toEqual([2, 0, 1, 3])
  })

  it('setas do teclado no puxador movem um lugar, sem passar das pontas', () => {
    const onMove = vi.fn()
    const engine = new SortableEngine()
    engine.setOptions({ ids: ['a', 'b', 'c'], onMove })
    const key = (k: string) => new KeyboardEvent('keydown', { key: k, cancelable: true })
    engine.handleKeyDown('b', key('ArrowUp'))
    engine.handleKeyDown('a', key('ArrowUp'))
    engine.handleKeyDown('c', key('ArrowDown'))
    engine.handleKeyDown('a', key('ArrowRight'))
    expect(onMove.mock.calls).toEqual([
      [1, 0],
      [0, 1],
    ])
  })

  it('desativado, nada se move', () => {
    const onMove = vi.fn()
    const engine = new SortableEngine()
    engine.setOptions({ ids: ['a', 'b'], onMove, disabled: true })
    engine.handleKeyDown('a', new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(onMove).not.toHaveBeenCalled()
  })
})
