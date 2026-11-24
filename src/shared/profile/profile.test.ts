import { describe, expect, it } from 'vitest'
import {
  EMPTY_PROFILE,
  birthDateLabel,
  isProfileComplete,
  missingProfileFields,
  normalizeField,
  profileFieldError,
  profileFromValues,
} from './profile'

const TODAY = '2026-11-24'
const COMPLETE = {
  ...EMPTY_PROFILE,
  fullName: 'Carolina Mendes Rocha',
  nickname: 'Carol',
  phone: '(41) 9 9876-5432',
  birthDate: '1988-03-14',
}

describe('dados do perfil', () => {
  it('pede nome e sobrenome', () => {
    expect(profileFieldError('fullName', 'Carolina', TODAY)).toBe('Escreva nome e sobrenome.')
    expect(profileFieldError('fullName', '  Carolina   Rocha ', TODAY)).toBeNull()
    expect(profileFieldError('fullName', '   ', TODAY)).toBe('Preencha para seguir.')
  })

  it('celular com DDD, gravado no formato de sempre', () => {
    expect(profileFieldError('phone', '9876-5432', TODAY)).toMatch(/DDD/)
    expect(profileFieldError('phone', '41998765432', TODAY)).toBeNull()
    expect(normalizeField('phone', '41998765432')).toBe('(41) 9 9876-5432')
  })

  it('data de nascimento real, nem no futuro nem há mais de 120 anos', () => {
    expect(profileFieldError('birthDate', '1988-02-30', TODAY)).toBe('Escolha uma data válida.')
    expect(profileFieldError('birthDate', '2026-12-01', TODAY)).toBe('Escolha uma data válida.')
    expect(profileFieldError('birthDate', '1890-01-01', TODAY)).toBe('Escolha uma data válida.')
    expect(profileFieldError('birthDate', '1988-03-14', TODAY)).toBeNull()
  })

  it('apelido curto', () => {
    expect(profileFieldError('nickname', 'Carol', TODAY)).toBeNull()
    expect(profileFieldError('nickname', 'x'.repeat(41), TODAY)).toBe('Use até 40 letras.')
  })

  it('cadastro completo só com os quatro dados válidos; a foto é opcional', () => {
    expect(isProfileComplete(COMPLETE, TODAY)).toBe(true)
    expect(missingProfileFields({ ...COMPLETE, phone: '', birthDate: '' }, TODAY)).toEqual([
      'phone',
      'birthDate',
    ])
    expect(missingProfileFields(EMPTY_PROFILE, TODAY)).toHaveLength(4)
  })

  it('lê o que veio do Firestore: novidades marcadas por padrão, foto só se for imagem', () => {
    expect(profileFromValues({})).toEqual(EMPTY_PROFILE)
    expect(profileFromValues({ news: false, photo: 'javascript:x', birthDate: 'ontem' })).toEqual({
      ...EMPTY_PROFILE,
      news: false,
    })
    expect(profileFromValues({ photo: 'data:image/webp;base64,AA' }).photo).toBe(
      'data:image/webp;base64,AA',
    )
  })

  it('mostra a data por extenso', () => {
    expect(birthDateLabel('1988-03-14')).toBe('14 de março de 1988')
  })
})
