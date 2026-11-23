// Onde o Modo Andreía da ativação individual grava (ADR-029): terapias e anamnese em `catalog/`, que
// qualquer pessoa lê e só a admin grava (firestore.rules). Tudo por REST com o token da admin.
import { parseAnamnesis, type AnamnesisForm } from '../../../shared/ativacao/anamnesis'
import {
  EMPTY_AVAILABILITY,
  parseAvailability,
  type Availability,
} from '../../../shared/ativacao/availability'
import { parseTherapies, type Therapy } from '../../../shared/ativacao/therapy'
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

export interface AtivacoesBackend {
  /** `null` = ainda não existe (a tela começa pelo modelo do código). */
  loadTherapies(): Promise<Therapy[] | null>
  saveTherapies(list: readonly Therapy[]): Promise<void>
  loadAnamnesis(): Promise<AnamnesisForm | null>
  saveAnamnesis(form: AnamnesisForm): Promise<void>
  /** A agenda da Andreía; sem documento, vazia. */
  loadAvailability(): Promise<Availability>
  saveAvailability(availability: Availability): Promise<void>
}

const THERAPIES = 'catalog/therapies'
const ANAMNESIS = 'catalog/anamnesis'
const AVAILABILITY = 'catalog/availability'

export function createAtivacoesBackend(
  config: RestConfig,
  getToken: () => Promise<string | null>,
  fetchFn?: FetchFn,
  now: () => number = Date.now,
): AtivacoesBackend {
  async function token(): Promise<string> {
    const value = await getToken()
    if (!value) throw new Error('Sem login.')
    return value
  }
  async function readContent(path: string): Promise<unknown> {
    const body = await getJson(
      documentsUrl(config, path, '&mask.fieldPaths=content'),
      await token(),
      fetchFn,
    )
    const fields = fieldsOf(body)
    const json = fields ? stringField(fields, 'content') : undefined
    return json ? (JSON.parse(json) as unknown) : undefined
  }
  async function writeContent(path: string, value: unknown) {
    await patchDocument(
      config,
      path,
      { content: restString(JSON.stringify(value)), updatedAt: restInteger(now()) },
      await token(),
      fetchFn,
    )
  }

  return {
    async loadTherapies() {
      const raw = await readContent(THERAPIES)
      return raw === undefined ? null : parseTherapies(raw)
    },
    saveTherapies: (list) => writeContent(THERAPIES, list),
    async loadAnamnesis() {
      const raw = await readContent(ANAMNESIS)
      return raw === undefined ? null : parseAnamnesis(raw)
    },
    saveAnamnesis: (form) => writeContent(ANAMNESIS, form),
    loadAvailability: async () => parseAvailability(await readContent(AVAILABILITY)),
    saveAvailability: (availability) => writeContent(AVAILABILITY, availability),
  }
}

/** Para os testes e para quem abre sem Firebase: guarda na memória. */
export function createInMemoryAtivacoesBackend(
  initial: { therapies?: Therapy[]; anamnesis?: AnamnesisForm; availability?: Availability } = {},
): AtivacoesBackend & {
  therapies: Therapy[] | null
  anamnesis: AnamnesisForm | null
  availability: Availability
} {
  const state = {
    therapies: initial.therapies ?? (null as Therapy[] | null),
    anamnesis: initial.anamnesis ?? (null as AnamnesisForm | null),
    availability: initial.availability ?? EMPTY_AVAILABILITY,
  }
  // Como no Firestore: o que volta é uma cópia lida do JSON, nunca o mesmo objeto.
  const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
  return Object.assign(state, {
    loadTherapies: async () => (state.therapies ? copy(state.therapies) : null),
    saveTherapies: async (list: readonly Therapy[]) => {
      state.therapies = copy([...list])
    },
    loadAnamnesis: async () => (state.anamnesis ? copy(state.anamnesis) : null),
    saveAnamnesis: async (form: AnamnesisForm) => {
      state.anamnesis = copy(form)
    },
    loadAvailability: async () => copy(state.availability),
    saveAvailability: async (availability: Availability) => {
      state.availability = copy(availability)
    },
  })
}
