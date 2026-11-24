import { EMPTY_PROFILE, type PersonProfile } from '../shared/profile/profile'

/** Um cadastro completo (nome, apelido, celular e nascimento), para os testes que passam pelas travas. */
export const COMPLETE_PROFILE: PersonProfile = {
  ...EMPTY_PROFILE,
  fullName: 'Maria Souza',
  nickname: 'Mari',
  phone: '(41) 9 9876-5432',
  birthDate: '1990-05-20',
}
