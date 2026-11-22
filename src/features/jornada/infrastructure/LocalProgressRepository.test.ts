import { beforeEach, describe, expect, it } from 'vitest'
import { emptyProgress, setEntry } from '../domain/progress'
import { journeyStorageKey, LocalProgressRepository } from './LocalProgressRepository'

describe('LocalProgressRepository', () => {
  beforeEach(() => localStorage.clear())

  it('guarda e lê o progresso no localStorage', () => {
    const repository = new LocalProgressRepository('teste')
    const progress = setEntry(emptyProgress(), 'd1:reflexao', 'texto', 5)
    repository.save(progress)
    expect(new LocalProgressRepository('teste').load()).toEqual(progress)
  })

  it('apaga o progresso do aparelho ao sair da conta', () => {
    const repository = new LocalProgressRepository('teste')
    repository.save(setEntry(emptyProgress(), 'd1:reflexao', 'íntimo', 5))
    repository.clear()
    expect(localStorage.getItem(journeyStorageKey('teste'))).toBeNull()
  })

  it('começa vazio quando não há nada salvo ou o JSON está corrompido', () => {
    expect(new LocalProgressRepository('teste').load()).toEqual(emptyProgress())
    localStorage.setItem(journeyStorageKey('teste'), '{quebrado')
    expect(new LocalProgressRepository('teste').load()).toEqual(emptyProgress())
  })
})
