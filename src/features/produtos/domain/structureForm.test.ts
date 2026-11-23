import { describe, expect, it } from 'vitest'
import { emptyForm } from './productForm'
import {
  addPart,
  canAddPart,
  listItem,
  moveItem,
  movePartName,
  partEndLimits,
  removePart,
  setDayCount,
  setPartLastDay,
  visibleWeeks,
} from './structureForm'

const journey = () => emptyForm('journey', 1)
const inParts = () => addPart({ ...journey(), split: 'parts' as const })
const ranges = (form: ReturnType<typeof inParts>) =>
  form.parts.map((p, i) => [(form.parts[i - 1]?.lastDay ?? 0) + 1, p.lastDay])

describe('estrutura no formulário do produto', () => {
  it('as semanas acompanham a duração e guardam os nomes se ela voltar a crescer', () => {
    const named = { ...journey(), split: 'weeks' as const }
    const withNames = {
      ...named,
      weeks: named.weeks.map((w, i) => ({ ...w, title: `S${i + 1}` })),
    }
    const shorter = setDayCount(withNames, 10)
    expect(visibleWeeks(shorter).map((w) => w.title)).toEqual(['S1', 'S2'])
    const longer = setDayCount(shorter, 22)
    expect(visibleWeeks(longer).map((w) => w.title)).toEqual(['S1', 'S2', 'S3', ''])
  })

  it('"+ Parte" divide a última ao meio', () => {
    expect(ranges(inParts())).toEqual([
      [1, 10],
      [11, 21],
    ])
    expect(ranges(addPart(inParts()))).toEqual([
      [1, 10],
      [11, 15],
      [16, 21],
    ])
  })

  it('a parte termina dentro dos limites: cada uma fica com pelo menos um dia', () => {
    const form = inParts()
    const id = form.parts[0]!.id
    expect(partEndLimits(form, 0)).toEqual({ min: 1, max: 20 })
    expect(ranges(setPartLastDay(form, id, 99))).toEqual([
      [1, 20],
      [21, 21],
    ])
    expect(ranges(setPartLastDay(form, id, 0))).toEqual([
      [1, 1],
      [2, 21],
    ])
  })

  it('apagar uma parte junta os dias dela à vizinha; sempre sobra uma', () => {
    const three = addPart(inParts())
    const withoutMiddle = removePart(three, three.parts[1]!.id)
    expect(ranges(withoutMiddle)).toEqual([
      [1, 10],
      [11, 21],
    ])
    const one = removePart(inParts(), inParts().parts[0]!.id)
    expect(removePart(one, one.parts[0]!.id).parts).toHaveLength(1)
  })

  it('diminuir a duração mantém as partes coerentes', () => {
    const form = setDayCount(addPart(inParts()), 2)
    expect(ranges(form)).toEqual([
      [1, 1],
      [2, 2],
    ])
    expect(canAddPart(form)).toBe(false)
  })

  it('mudar a ordem: os outros escorregam; nas partes, só os nomes mudam de lugar', () => {
    const [a, b, c] = ['A', 'B', 'C'].map((t) => listItem(t))
    expect(moveItem([a, b, c], 2, 0).map((i) => i!.title)).toEqual(['C', 'A', 'B'])
    const form = addPart(inParts())
    const named = form.parts.map((p, i) => ({ ...p, title: ['Um', 'Dois', 'Três'][i] ?? '' }))
    const moved = movePartName(named, 2, 0)
    expect(moved.map((p) => p.title)).toEqual(['Três', 'Um', 'Dois'])
    expect(moved.map((p) => p.lastDay)).toEqual(named.map((p) => p.lastDay))
  })
})
