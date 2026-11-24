import { describe, expect, it } from 'vitest'
import { EMPTY_PROFILE } from '../../../shared/profile/profile'
import {
  ageOn,
  countByFilter,
  filterPeople,
  newsPhones,
  peopleCsv,
  personName,
  type PersonRow,
} from './people'

const TODAY = '2026-11-24'
const carol: PersonRow = {
  uid: 'c',
  email: 'carolina.rocha@email.com',
  name: 'Carol R',
  profile: {
    ...EMPTY_PROFILE,
    fullName: 'Carolina Mendes Rocha',
    nickname: 'Carol',
    phone: '(41) 9 9876-5432',
    birthDate: '1988-03-14',
  },
}
const andreia: PersonRow = {
  uid: 'a',
  email: 'andreia@email.com',
  name: '',
  profile: {
    ...EMPTY_PROFILE,
    fullName: 'Andreía Oliveirà',
    nickname: 'Déa',
    phone: '41998765432',
    birthDate: '1975-12-01',
    news: false,
  },
}
const bia: PersonRow = { uid: 'b', email: 'bia.lima@hotmail.com', name: '' }

describe('pessoas no Modo Andreía', () => {
  it('busca sem acento por nome, apelido, e-mail ou pedaço do celular', () => {
    const all = [carol, andreia, bia]
    expect(filterPeople(all, 'todas', 'andreia', TODAY).map((p) => p.uid)).toEqual(['a'])
    expect(filterPeople(all, 'todas', 'déa', TODAY).map((p) => p.uid)).toEqual(['a'])
    expect(filterPeople(all, 'todas', 'hotmail', TODAY).map((p) => p.uid)).toEqual(['b'])
    expect(filterPeople(all, 'todas', '9876', TODAY).map((p) => p.uid)).toEqual(['a', 'c'])
  })

  it('filtra e conta: novidades (marcada por padrão) e cadastro incompleto; sem nome vai para o fim', () => {
    const all = [bia, carol, andreia]
    expect(filterPeople(all, 'todas', '', TODAY).map(personName)).toEqual([
      'Andreía Oliveirà',
      'Carolina Mendes Rocha',
      'Sem nome',
    ])
    expect(filterPeople(all, 'novidades', '', TODAY).map((p) => p.uid)).toEqual(['c', 'b'])
    expect(filterPeople(all, 'incompleto', '', TODAY).map((p) => p.uid)).toEqual(['b'])
    expect(countByFilter(all, TODAY)).toEqual({ todas: 3, novidades: 2, incompleto: 1 })
  })

  it('copia só os celulares válidos de quem aceitou novidades, sem repetir', () => {
    const twin = { ...carol, uid: 'c2', email: 'outra@email.com' }
    expect(newsPhones([carol, twin, andreia, bia])).toEqual(['(41) 9 9876-5432'])
  })

  it('idade em anos completos', () => {
    expect(ageOn('1988-03-14', TODAY)).toBe(38)
    expect(ageOn('1975-12-01', TODAY)).toBe(50)
    expect(ageOn('', TODAY)).toBeNull()
  })

  it('planilha com ";" e aspas quando precisa', () => {
    const csv = peopleCsv([carol, { ...bia, name: 'Bia; a "Lima"' }], TODAY)
    const [header, first, second] = csv.split('\r\n')
    expect(header).toBe(
      'Nome;Apelido;E-mail;Celular (WhatsApp);Nascimento;Novidades;Cadastro completo',
    )
    expect(first).toBe(
      'Carolina Mendes Rocha;Carol;carolina.rocha@email.com;(41) 9 9876-5432;14/03/1988;Sim;Sim',
    )
    expect(second).toBe('"Bia; a ""Lima""";;bia.lima@hotmail.com;;;Sim;Não')
  })
})
