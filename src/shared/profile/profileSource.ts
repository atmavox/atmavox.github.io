// Onde os dados da pessoa ficam: `users/{uid}` (o mesmo documento com o e-mail que o login grava). Só
// ela grava os próprios dados; ela e a Andreía leem (firestore.rules).
import {
  booleanField,
  documentsUrl,
  fieldsOf,
  getJson,
  patchDocument,
  restBoolean,
  restInteger,
  restString,
  stringField,
  type FetchFn,
  type RestConfig,
  type RestValue,
} from '../firebase/firestoreRest'
import { EMPTY_PROFILE, profileFromValues, type PersonProfile } from './profile'

export interface ProfileSource {
  load(uid: string): Promise<PersonProfile>
  /** Grava só o que mudou. */
  save(uid: string, change: Partial<PersonProfile>): Promise<void>
}

const FIELDS = ['fullName', 'nickname', 'phone', 'birthDate', 'news', 'photo'] as const

/** Os campos REST de `users/{uid}` → perfil (também usado pela lista de pessoas do Modo Andreía). */
export function profileFromFields(fields: Record<string, unknown>): PersonProfile {
  return profileFromValues({
    fullName: stringField(fields, 'fullName'),
    nickname: stringField(fields, 'nickname'),
    phone: stringField(fields, 'phone'),
    birthDate: stringField(fields, 'birthDate'),
    news: booleanField(fields, 'news'),
    photo: stringField(fields, 'photo'),
  })
}

export function createRestProfileSource(
  config: RestConfig,
  getToken: () => Promise<string | null>,
  fetchFn?: FetchFn,
): ProfileSource {
  return {
    async load(uid) {
      const mask = FIELDS.map((f) => `&mask.fieldPaths=${f}`).join('')
      const body = await getJson(
        documentsUrl(config, `users/${uid}`, mask),
        await getToken(),
        fetchFn,
      )
      const fields = fieldsOf(body)
      return fields ? profileFromFields(fields) : EMPTY_PROFILE
    },
    async save(uid, change) {
      const token = await getToken()
      if (!token) throw new Error('sem login')
      const fields: Record<string, RestValue> = { profileUpdatedAt: restInteger(Date.now()) }
      for (const [key, value] of Object.entries(change)) {
        fields[key] = typeof value === 'boolean' ? restBoolean(value) : restString(String(value))
      }
      await patchDocument(config, `users/${uid}`, fields, token, fetchFn)
    },
  }
}

/** Para os testes e para o site sem Firebase configurado. */
export function createInMemoryProfileSource(
  initial: Record<string, PersonProfile> = {},
  /** O perfil de quem não está em `initial` (nos testes, um cadastro já completo). */
  fallback: PersonProfile = EMPTY_PROFILE,
): ProfileSource & { saved: Record<string, PersonProfile> } {
  const saved = { ...initial }
  return {
    saved,
    async load(uid) {
      return saved[uid] ?? fallback
    },
    async save(uid, change) {
      saved[uid] = { ...(saved[uid] ?? fallback), ...change }
    },
  }
}
