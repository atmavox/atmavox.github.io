// O que o fluxo da ativação individual lê e grava (ADR-029): terapias, anamnese e agenda são públicas
// (`catalog/`, lidas sem login); as respostas da pessoa ficam em `users/{uid}/anamnesis/current`, que
// só ela grava e só ela e a Andreía leem (firestore.rules).
import {
  DEFAULT_ANAMNESIS,
  parseAnamnesis,
  type AnamnesisForm,
} from '../../../shared/ativacao/anamnesis'
import { parseSavedAnamnesis, type SavedAnamnesis } from '../../../shared/ativacao/answers'
import {
  EMPTY_AVAILABILITY,
  parseAvailability,
  type Availability,
} from '../../../shared/ativacao/availability'
import { DEFAULT_THERAPIES, parseTherapies, type Therapy } from '../../../shared/ativacao/therapy'
import {
  documentsUrl,
  fieldsOf,
  getJson,
  patchDocument,
  restInteger,
  restString,
  stringField,
  type FetchFn,
  type RestConfig,
} from '../../../shared/firebase/firestoreRest'

export interface AtivacaoSource {
  /** Todas as terapias, na ordem da Andreía (a tela mostra só as ativas). */
  loadTherapies(): Promise<Therapy[]>
  loadAnamnesis(): Promise<AnamnesisForm>
  loadAvailability(): Promise<Availability>
  loadMyAnamnesis(uid: string): Promise<SavedAnamnesis | null>
  saveMyAnamnesis(uid: string, saved: SavedAnamnesis): Promise<void>
}

export function createRestAtivacaoSource(
  config: RestConfig,
  getToken: () => Promise<string | null>,
  fetchFn?: FetchFn,
): AtivacaoSource {
  async function content(path: string, token: string | null): Promise<unknown> {
    const body = await getJson(
      documentsUrl(config, path, '&mask.fieldPaths=content'),
      token,
      fetchFn,
    )
    const fields = fieldsOf(body)
    const json = fields ? stringField(fields, 'content') : undefined
    return json ? (JSON.parse(json) as unknown) : undefined
  }
  async function token(): Promise<string> {
    const value = await getToken()
    if (!value) throw new Error('Sem login.')
    return value
  }
  return {
    async loadTherapies() {
      const raw = await content('catalog/therapies', null)
      return raw === undefined ? [...DEFAULT_THERAPIES] : parseTherapies(raw)
    },
    async loadAnamnesis() {
      const raw = await content('catalog/anamnesis', null)
      return (raw === undefined ? null : parseAnamnesis(raw)) ?? DEFAULT_ANAMNESIS
    },
    loadAvailability: async () => parseAvailability(await content('catalog/availability', null)),
    async loadMyAnamnesis(uid) {
      const raw = await content(`users/${uid}/anamnesis/current`, await token())
      return raw === undefined ? null : parseSavedAnamnesis(raw)
    },
    async saveMyAnamnesis(uid, saved) {
      await patchDocument(
        config,
        `users/${uid}/anamnesis/current`,
        { content: restString(JSON.stringify(saved)), updatedAt: restInteger(saved.updatedAt) },
        await token(),
        fetchFn,
      )
    },
  }
}

/** Para os testes e para quem abre sem Firebase. */
export function createInMemoryAtivacaoSource(
  initial: {
    therapies?: Therapy[]
    anamnesis?: AnamnesisForm
    availability?: Availability
    mine?: Record<string, SavedAnamnesis>
  } = {},
): AtivacaoSource & { mine: Record<string, SavedAnamnesis> } {
  const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
  const mine: Record<string, SavedAnamnesis> = { ...(initial.mine ?? {}) }
  return {
    mine,
    loadTherapies: async () => copy(initial.therapies ?? [...DEFAULT_THERAPIES]),
    loadAnamnesis: async () => copy(initial.anamnesis ?? DEFAULT_ANAMNESIS),
    loadAvailability: async () => copy(initial.availability ?? EMPTY_AVAILABILITY),
    loadMyAnamnesis: async (uid) => (mine[uid] ? copy(mine[uid]) : null),
    saveMyAnamnesis: async (uid, saved) => {
      mine[uid] = copy(saved)
    },
  }
}
