// Onde o Modo Andreía da ativação individual grava (ADR-029): terapias e anamnese em `catalog/`, que
// qualquer pessoa lê e só a admin grava (firestore.rules). Tudo por REST com o token da admin.
import { parseAnamnesis, type AnamnesisForm } from '../../../shared/ativacao/anamnesis'
import {
  EMPTY_AVAILABILITY,
  parseAvailability,
  type Availability,
} from '../../../shared/ativacao/availability'
import { parseSavedAnamnesis, type SavedAnamnesis } from '../../../shared/ativacao/answers'
import { DEFAULT_MESSAGES, parseMessages, type Messages } from '../../../shared/ativacao/messages'
import {
  orderFromFields,
  orderPathOf,
  orderUpdateFields,
  type SessionOrder,
} from '../../../shared/ativacao/order'
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
  type RestValue,
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
  /** Todos os pedidos (consulta em grupo de `sessions`, só a admin). */
  listOrders(): Promise<SessionOrder[]>
  /** As respostas da anamnese de uma pessoa (`users/{uid}/anamnesis/current`). */
  loadPersonAnamnesis(uid: string): Promise<SavedAnamnesis | null>
  updateOrder(uid: string, orderId: string, change: OrderChange): Promise<void>
  loadMessages(): Promise<Messages>
  saveMessages(messages: Messages): Promise<void>
}

export type OrderChange = Parameters<typeof orderUpdateFields>[0]

const THERAPIES = 'catalog/therapies'
const ANAMNESIS = 'catalog/anamnesis'
const AVAILABILITY = 'catalog/availability'
const MESSAGES = 'catalog/messages'

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
    async listOrders() {
      const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents`
      const doFetch = fetchFn ?? ((input: string, init?: RequestInit) => fetch(input, init))
      const response = await doFetch(`${base}:runQuery?key=${encodeURIComponent(config.apiKey)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: { from: [{ collectionId: 'sessions', allDescendants: true }] },
        }),
      })
      if (!response.ok) throw new Error(`Firestore respondeu ${response.status}`)
      const rows = (await response.json()) as { document?: { name?: unknown } }[]
      return (Array.isArray(rows) ? rows : []).flatMap((row) => {
        const path = orderPathOf(row.document?.name)
        const fields = fieldsOf(row.document)
        const order = path && fields ? orderFromFields(path.id, path.uid, fields) : null
        return order ? [order] : []
      })
    },
    async loadPersonAnamnesis(uid) {
      const raw = await readContent(`users/${uid}/anamnesis/current`)
      return raw === undefined ? null : parseSavedAnamnesis(raw)
    },
    loadMessages: async () => parseMessages(await readContent(MESSAGES)),
    saveMessages: (messages) => writeContent(MESSAGES, messages),
    async updateOrder(uid, orderId, change) {
      await patchDocument(
        config,
        `users/${uid}/sessions/${orderId}`,
        orderUpdateFields(change) as Record<string, RestValue>,
        await token(),
        fetchFn,
      )
    },
  }
}

/** Para os testes e para quem abre sem Firebase: guarda na memória. */
export function createInMemoryAtivacoesBackend(
  initial: {
    therapies?: Therapy[]
    anamnesis?: AnamnesisForm
    availability?: Availability
    orders?: SessionOrder[]
    people?: Record<string, SavedAnamnesis>
    messages?: Messages
  } = {},
): AtivacoesBackend & {
  therapies: Therapy[] | null
  anamnesis: AnamnesisForm | null
  availability: Availability
  orders: SessionOrder[]
  messages: Messages
} {
  const state = {
    therapies: initial.therapies ?? (null as Therapy[] | null),
    anamnesis: initial.anamnesis ?? (null as AnamnesisForm | null),
    availability: initial.availability ?? EMPTY_AVAILABILITY,
    orders: [...(initial.orders ?? [])],
    messages: initial.messages ?? DEFAULT_MESSAGES,
  }
  const people = initial.people ?? {}
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
    listOrders: async () => copy(state.orders),
    loadMessages: async () => copy(state.messages),
    saveMessages: async (messages: Messages) => {
      state.messages = copy(messages)
    },
    loadPersonAnamnesis: async (uid: string) => (people[uid] ? copy(people[uid]) : null),
    updateOrder: async (uid: string, orderId: string, change: OrderChange) => {
      state.orders = state.orders.map((o) =>
        o.uid === uid && o.id === orderId ? { ...o, ...change } : o,
      )
    },
  })
}
