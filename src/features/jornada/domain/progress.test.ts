import { describe, expect, it } from 'vitest'
import {
  addVictory,
  emptyProgress,
  mergeProgress,
  parseProgress,
  removeVictory,
  setEntry,
  setMood,
  toggleDay,
  toggleEmotion,
  type JourneyProgress,
  type Victory,
} from './progress'

const victory = (id: string, createdAt: number): Victory => ({
  id,
  date: '',
  day: null,
  action: `Vitória ${id}`,
  result: '',
  createdAt,
})

const progressWith = (overrides: Partial<JourneyProgress>): JourneyProgress => ({
  ...emptyProgress(),
  ...overrides,
})

describe('comandos de progresso', () => {
  it('marca e desmarca um dia, mantendo a lista ordenada', () => {
    let p = toggleDay(emptyProgress(), 5, 1)
    p = toggleDay(p, 2, 2)
    expect(p.completedDays).toEqual([2, 5])
    expect(toggleDay(p, 5, 3).completedDays).toEqual([2])
  })

  it('ignora dias fora de 1 a 21', () => {
    const p = emptyProgress()
    expect(toggleDay(p, 0, 1)).toBe(p)
    expect(toggleDay(p, 22, 1)).toBe(p)
  })

  it('não altera o estado original (imutável)', () => {
    const p = emptyProgress()
    toggleDay(p, 1, 1)
    setEntry(p, 'd1:reflexao', 'oi', 1)
    expect(p).toEqual(emptyProgress())
  })

  it('salva o texto e remove a resposta quando o texto fica vazio', () => {
    const p = setEntry(emptyProgress(), 'd1:reflexao', 'Sinto o cinza', 10)
    expect(p.entries['d1:reflexao']).toBe('Sinto o cinza')
    expect(p.updatedAt).toBe(10)
    expect(setEntry(p, 'd1:reflexao', '   ', 11).entries).toEqual({})
  })

  it('alterna emoções do check-in na ordem da lista e remove o dia sem emoções', () => {
    let p = toggleEmotion(emptyProgress(), 1, 'Presente', 1)
    p = toggleEmotion(p, 1, 'Pesada', 2)
    expect(p.emotions['1']).toEqual(['Pesada', 'Presente'])
    p = toggleEmotion(toggleEmotion(p, 1, 'Pesada', 3), 1, 'Presente', 4)
    expect(p.emotions).toEqual({})
  })

  it('define e limpa a temperatura energética do dia', () => {
    const p = setMood(emptyProgress(), 3, 5, 1)
    expect(p.moods['3']).toBe(5)
    expect(setMood(p, 3, null, 2).moods).toEqual({})
  })

  it('adiciona vitórias no topo e remove pelo id', () => {
    let p = addVictory(emptyProgress(), victory('a', 1))
    p = addVictory(p, victory('b', 2))
    expect(p.victories.map((v) => v.id)).toEqual(['b', 'a'])
    expect(removeVictory(p, 'b', 3).victories.map((v) => v.id)).toEqual(['a'])
  })
})

describe('parseProgress', () => {
  it('devolve progresso vazio para dados ausentes ou inválidos', () => {
    expect(parseProgress(null)).toEqual(emptyProgress())
    expect(parseProgress('lixo')).toEqual(emptyProgress())
    expect(parseProgress([1, 2])).toEqual(emptyProgress())
  })

  it('lê um progresso válido sem perder nada', () => {
    const p = progressWith({
      completedDays: [1, 7],
      entries: { 'd1:reflexao': 'texto', 'r7:q1': 'outro' },
      emotions: { '1': ['Ansiosa', 'Presente'] },
      moods: { '1': 4 },
      victories: [victory('a', 5)],
      updatedAt: 99,
    })
    expect(parseProgress(JSON.parse(JSON.stringify(p)))).toEqual(p)
  })

  it('descarta só as partes corrompidas', () => {
    const parsed = parseProgress({
      completedDays: [3, 3, 'x', 40, 1],
      entries: { 'd1:reflexao': 'ok', 'd2:sinais': 42, 'd3:raiz': '  ' },
      emotions: { '1': ['Pesada', 'Inventada'], abc: ['Pesada'], '2': 'Pesada' },
      moods: { '1': 9, '2': 3 },
      victories: [victory('a', 1), { id: 'sem-acao' }, 'lixo'],
      updatedAt: 'ontem',
    })
    expect(parsed.completedDays).toEqual([1, 3])
    expect(parsed.entries).toEqual({ 'd1:reflexao': 'ok' })
    expect(parsed.emotions).toEqual({ '1': ['Pesada'] })
    expect(parsed.moods).toEqual({ '2': 3 })
    expect(parsed.victories.map((v) => v.id)).toEqual(['a'])
    expect(parsed.updatedAt).toBe(0)
  })
})

describe('mergeProgress', () => {
  it('não perde dias ao mesclar aparelho e nuvem', () => {
    const merged = mergeProgress(
      progressWith({ completedDays: [1, 2] }),
      progressWith({ completedDays: [2, 5] }),
    )
    expect(merged.completedDays).toEqual([1, 2, 5])
  })

  it('une as vitórias dos dois lados sem duplicar', () => {
    const merged = mergeProgress(
      progressWith({ victories: [victory('a', 1), victory('b', 3)] }),
      progressWith({ victories: [victory('b', 3), victory('c', 2)] }),
    )
    expect(merged.victories.map((v) => v.id)).toEqual(['b', 'c', 'a'])
  })

  it('mantém o texto do lado que tem conteúdo', () => {
    const merged = mergeProgress(
      progressWith({ entries: { 'd1:reflexao': 'do aparelho' }, updatedAt: 1 }),
      progressWith({ entries: { 'd2:sinais': 'da nuvem' }, updatedAt: 2 }),
    )
    expect(merged.entries).toEqual({ 'd1:reflexao': 'do aparelho', 'd2:sinais': 'da nuvem' })
  })

  it('quando os dois lados têm o mesmo campo, vence o mais recente', () => {
    const local = progressWith({
      entries: { 'd1:reflexao': 'antigo' },
      moods: { '1': 1 },
      updatedAt: 1,
    })
    const remote = progressWith({
      entries: { 'd1:reflexao': 'novo' },
      moods: { '1': 5 },
      updatedAt: 2,
    })
    const merged = mergeProgress(local, remote)
    expect(merged.entries['d1:reflexao']).toBe('novo')
    expect(merged.moods['1']).toBe(5)
    expect(merged.updatedAt).toBe(2)
  })

  it('um texto apagado de um lado não apaga o texto do outro', () => {
    const cleared = setEntry(
      progressWith({ entries: { 'd1:reflexao': 'x' } }),
      'd1:reflexao',
      '',
      10,
    )
    const remote = progressWith({ entries: { 'd1:reflexao': 'texto da nuvem' }, updatedAt: 5 })
    expect(mergeProgress(cleared, remote).entries['d1:reflexao']).toBe('texto da nuvem')
  })
})
