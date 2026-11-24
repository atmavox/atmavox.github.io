// Os dados da pessoa (pedido de 2026-11-24, mock aprovado `atmavox-cadastro.html`, Conta C): nome,
// apelido, celular (WhatsApp) e data de nascimento, obrigatórios para começar uma jornada ou comprar;
// foto opcional; e a escolha de receber novidades pelo WhatsApp. Ficam em `users/{uid}`.
import { formatPhone, isPhone } from '../ativacao/answers'

export interface PersonProfile {
  fullName: string
  nickname: string
  /** Formatado, como a pessoa vê: "(41) 9 9876-5432". */
  phone: string
  /** `AAAA-MM-DD`, ou vazio. */
  birthDate: string
  /** Receber novidades pelo WhatsApp. Vem marcado (decisão de 2026-11-24); a pessoa desmarca. */
  news: boolean
  /** Foto reduzida (`data:image/…`), ou vazio. */
  photo: string
}

export type ProfileField = 'fullName' | 'nickname' | 'phone' | 'birthDate'

/** Na ordem em que aparecem; todos obrigatórios. */
export const PROFILE_FIELDS: readonly ProfileField[] = [
  'fullName',
  'nickname',
  'phone',
  'birthDate',
]

export const PROFILE_LABELS: Record<ProfileField, string> = {
  fullName: 'Nome completo',
  nickname: 'Como prefere ser chamado(a)?',
  phone: 'Celular (WhatsApp)',
  birthDate: 'Data de nascimento',
}

export const PROFILE_HINTS: Partial<Record<ProfileField, string>> = {
  phone: 'É por ele que a Andreía fala com você.',
  birthDate: 'Usada na radiestesia e em leituras energéticas.',
}

export const EMPTY_PROFILE: PersonProfile = {
  fullName: '',
  nickname: '',
  phone: '',
  birthDate: '',
  news: true,
  photo: '',
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function isRealDate(iso: string): boolean {
  const match = ISO_DATE.exec(iso)
  if (!match) return false
  const [, y, m, d] = match.map(Number) as [number, number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/** O que gravar: espaços aparados e o celular no formato de sempre. */
export function normalizeField(field: ProfileField, value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  return field === 'phone' ? formatPhone(trimmed) : trimmed
}

/** O erro de um campo, ou `null`. `today` (`AAAA-MM-DD`) barra datas no futuro. */
export function profileFieldError(
  field: ProfileField,
  value: string,
  today: string,
): string | null {
  const text = normalizeField(field, value)
  if (!text) return 'Preencha para seguir.'
  switch (field) {
    case 'fullName':
      return text.split(' ').length < 2 ? 'Escreva nome e sobrenome.' : null
    case 'nickname':
      return text.length > 40 ? 'Use até 40 letras.' : null
    case 'phone':
      return isPhone(text) ? null : 'Escreva o celular com DDD, como (41) 9 9876-5432.'
    case 'birthDate': {
      if (!isRealDate(text)) return 'Escolha uma data válida.'
      const year = Number(text.slice(0, 4))
      if (text > today || year < Number(today.slice(0, 4)) - 120) return 'Escolha uma data válida.'
      return null
    }
  }
}

/** Os campos obrigatórios que faltam (vazios ou inválidos), na ordem da tela. */
export function missingProfileFields(profile: PersonProfile, today: string): ProfileField[] {
  return PROFILE_FIELDS.filter((field) => profileFieldError(field, profile[field], today) !== null)
}

export function isProfileComplete(profile: PersonProfile, today: string): boolean {
  return missingProfileFields(profile, today).length === 0
}

/** "1988-03-14" → "14 de março de 1988". */
export function birthDateLabel(iso: string): string {
  if (!isRealDate(iso)) return iso
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Os campos de `users/{uid}` (já lidos do REST) → perfil. O que faltar fica vazio. */
export function profileFromValues(values: {
  fullName?: string | undefined
  nickname?: string | undefined
  phone?: string | undefined
  birthDate?: string | undefined
  news?: boolean | undefined
  photo?: string | undefined
}): PersonProfile {
  return {
    fullName: values.fullName ?? '',
    nickname: values.nickname ?? '',
    phone: values.phone ?? '',
    birthDate: values.birthDate && isRealDate(values.birthDate) ? values.birthDate : '',
    news: values.news ?? true,
    photo: values.photo?.startsWith('data:image/') ? values.photo : '',
  }
}
