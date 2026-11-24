// A lista de pessoas do Modo Andreía · Acessos (mock aprovado `atmavox-acessos-pessoas.html`, C):
// busca, filtros, os celulares de quem aceitou novidades e a planilha. Funções puras.
import { formatPhone, isPhone } from '../../../shared/ativacao/answers'
import {
  EMPTY_PROFILE,
  isProfileComplete,
  type PersonProfile,
} from '../../../shared/profile/profile'

export interface PersonRow {
  uid: string
  email: string
  /** Nome da conta (do login), usado quando a pessoa ainda não escreveu o nome completo. */
  name: string
  profile?: PersonProfile
  /** Quem cuida do site (`admins/{uid}`): aparece com a etiqueta "Admin" e fica fora da planilha. */
  isAdmin?: boolean
}

/** Marca como admin quem está na lista (a de `admins` e quem está usando o Modo Andreía). */
export function markAdmins<T extends PersonRow>(
  people: readonly T[],
  adminUids: Iterable<string>,
): T[] {
  const admins = new Set(adminUids)
  return people.map((person) =>
    admins.has(person.uid) && !person.isAdmin ? { ...person, isAdmin: true } : person,
  )
}

/** A planilha é das pessoas atendidas: quem cuida do site fica de fora (pedido de 2026-11-24). */
export const spreadsheetPeople = (people: readonly PersonRow[]) =>
  people.filter((person) => !person.isAdmin)

export type PeopleFilter = 'todas' | 'novidades' | 'incompleto'

export const PEOPLE_FILTERS: readonly { id: PeopleFilter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'novidades', label: 'Aceitam novidades' },
  { id: 'incompleto', label: 'Cadastro incompleto' },
]

const profileOf = (person: PersonRow) => person.profile ?? EMPTY_PROFILE

export function personName(person: PersonRow): string {
  return profileOf(person).fullName || person.name || 'Sem nome'
}

/** Sem acentos e em minúsculas, para a busca achar "andreia" em "Andreía". */
const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

const digits = (text: string) => text.replace(/\D/g, '')

/** Nome, apelido, e-mail ou celular (a partir de 3 números). */
export function matchesSearch(person: PersonRow, query: string): boolean {
  const q = plain(query.trim())
  if (!q) return true
  const profile = profileOf(person)
  const text = plain([profile.fullName, profile.nickname, person.name, person.email].join(' '))
  if (text.includes(q)) return true
  const number = digits(q)
  return number.length >= 3 && digits(profile.phone).includes(number)
}

function inFilter(person: PersonRow, filter: PeopleFilter, today: string): boolean {
  if (filter === 'novidades') return profileOf(person).news
  if (filter === 'incompleto') return !isProfileComplete(profileOf(person), today)
  return true
}

/** As pessoas do filtro e da busca, em ordem alfabética (quem não tem nome vai para o fim). */
export function filterPeople(
  people: readonly PersonRow[],
  filter: PeopleFilter,
  query: string,
  today: string,
): PersonRow[] {
  return people
    .filter((p) => inFilter(p, filter, today) && matchesSearch(p, query))
    .sort((a, b) => {
      const an = personName(a)
      const bn = personName(b)
      if ((an === 'Sem nome') !== (bn === 'Sem nome')) return an === 'Sem nome' ? 1 : -1
      return an.localeCompare(bn, 'pt-BR')
    })
}

export function countByFilter(
  people: readonly PersonRow[],
  today: string,
): Record<PeopleFilter, number> {
  return {
    todas: people.length,
    novidades: people.filter((p) => inFilter(p, 'novidades', today)).length,
    incompleto: people.filter((p) => inFilter(p, 'incompleto', today)).length,
  }
}

/**
 * Os celulares de quem aceitou novidades, um por linha e sem repetir: prontos para colar numa lista de
 * transmissão do WhatsApp. Quem não deixou celular válido fica de fora.
 */
export function newsPhones(people: readonly PersonRow[]): string[] {
  const phones = people
    .map(profileOf)
    .filter((profile) => profile.news && isPhone(profile.phone))
    .map((profile) => formatPhone(profile.phone))
  return [...new Set(phones)]
}

/** Idade em anos completos, ou `null` sem data. */
export function ageOn(birthDate: string, today: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null
  const age = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4))
  return today.slice(5) < birthDate.slice(5) ? age - 1 : age
}

/** "1988-03-14" → "14/03/1988". */
export const shortDate = (iso: string) => (iso ? iso.split('-').reverse().join('/') : '')

const csvCell = (value: string) => (/[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

/**
 * A planilha (CSV com ";", que o Excel em português abre direto em colunas), sem os admins. Quem
 * chama acrescenta o BOM do UTF-8 ao baixar, para os acentos aparecerem certos.
 */
export function peopleCsv(people: readonly PersonRow[], today: string): string {
  const header = [
    'Nome',
    'Apelido',
    'E-mail',
    'Celular (WhatsApp)',
    'Nascimento',
    'Novidades',
    'Cadastro completo',
  ]
  const rows = spreadsheetPeople(people).map((person) => {
    const profile = profileOf(person)
    return [
      personName(person) === 'Sem nome' ? '' : personName(person),
      profile.nickname,
      person.email,
      profile.phone ? formatPhone(profile.phone) : '',
      shortDate(profile.birthDate),
      profile.news ? 'Sim' : 'Não',
      isProfileComplete(profile, today) ? 'Sim' : 'Não',
    ]
  })
  return [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')
}
