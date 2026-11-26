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
import type { ReadMarks, WindowLog } from '../domain/activity'

export interface ActivityRead {
  seenAt: number | null
  marks: ReadMarks
}

/** As marcas guardadas em texto (JSON); ilegíveis, nenhuma. */
export function parseReadMarks(json: string | undefined): ReadMarks {
  try {
    const raw: unknown = json ? JSON.parse(json) : {}
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
    return Object.fromEntries(
      Object.entries(raw).filter(
        (entry): entry is [string, boolean] => typeof entry[1] === 'boolean',
      ),
    )
  } catch {
    return {}
  }
}
import {
  booleanField,
  documentsUrl,
  fieldsOf,
  getJson,
  numberField,
  patchDocument,
  restBoolean,
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
  /** As mudanças nos horários livres (`activity/{id}`, só a admin; ADR-037), as mais novas primeiro. */
  listActivity(): Promise<WindowLog[]>
  addActivity(logs: readonly WindowLog[]): Promise<void>
  /**
   * O que a admin já viu no sino (`users/{uid}/prefs/activity`): a marca geral de "tudo lido até
   * aqui" (`null` = nunca) e as marcas de lida ou não lida de cada movimentação.
   */
  loadActivityRead(uid: string): Promise<ActivityRead>
  saveActivityRead(uid: string, read: ActivityRead): Promise<void>
}

export type OrderChange = Parameters<typeof orderUpdateFields>[0]

const THERAPIES = 'catalog/therapies'
const ANAMNESIS = 'catalog/anamnesis'
const AVAILABILITY = 'catalog/availability'
const MESSAGES = 'catalog/messages'
const ACTIVITY = 'activity'
const ACTIVITY_LIMIT = 300
const CHANGES: readonly WindowLog['change'][] = ['created', 'changed', 'removed']

/** Um documento de `activity/{id}` de volta como mudança de horário livre; ilegível, `null`. */
export function windowLogOf(document: unknown): WindowLog | null {
  const fields = fieldsOf(document)
  if (!fields) return null
  const at = numberField(fields, 'at')
  const change = CHANGES.find((c) => c === stringField(fields, 'change'))
  const date = stringField(fields, 'date')
  const start = stringField(fields, 'start')
  const end = stringField(fields, 'end')
  if (at === undefined || !change || !date || !start || !end) return null
  return { at, change, date, start, end, weekly: booleanField(fields, 'weekly') === true }
}

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
  /** Consulta estruturada (`:runQuery`) com o token da admin. */
  async function runQuery(structuredQuery: unknown): Promise<{ document?: { name?: unknown } }[]> {
    const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents`
    const doFetch = fetchFn ?? ((input: string, init?: RequestInit) => fetch(input, init))
    const response = await doFetch(`${base}:runQuery?key=${encodeURIComponent(config.apiKey)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery }),
    })
    if (!response.ok) throw new Error(`Firestore respondeu ${response.status}`)
    const rows = (await response.json()) as { document?: { name?: unknown } }[]
    return Array.isArray(rows) ? rows : []
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
      const rows = await runQuery({ from: [{ collectionId: 'sessions', allDescendants: true }] })
      return rows.flatMap((row) => {
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
    async listActivity() {
      const rows = await runQuery({
        from: [{ collectionId: ACTIVITY }],
        orderBy: [{ field: { fieldPath: 'at' }, direction: 'DESCENDING' }],
        limit: ACTIVITY_LIMIT,
      })
      return rows.flatMap((row) => windowLogOf(row.document) ?? [])
    },
    async addActivity(logs) {
      const auth = await token()
      await Promise.all(
        logs.map((log, i) =>
          patchDocument(
            config,
            `${ACTIVITY}/${log.at}-${i}-${Math.random().toString(36).slice(2, 7)}`,
            {
              at: restInteger(log.at),
              change: restString(log.change),
              date: restString(log.date),
              start: restString(log.start),
              end: restString(log.end),
              weekly: restBoolean(log.weekly),
            },
            auth,
            fetchFn,
          ),
        ),
      )
    },
    async loadActivityRead(uid) {
      const body = await getJson(
        documentsUrl(config, `users/${uid}/prefs/activity`),
        await token(),
        fetchFn,
      )
      const fields = fieldsOf(body)
      return {
        seenAt: (fields && numberField(fields, 'seenAt')) ?? null,
        marks: parseReadMarks(fields ? stringField(fields, 'marks') : undefined),
      }
    },
    async saveActivityRead(uid, read) {
      await patchDocument(
        config,
        `users/${uid}/prefs/activity`,
        {
          seenAt: restInteger(read.seenAt ?? 0),
          marks: restString(JSON.stringify(read.marks)),
        },
        await token(),
        fetchFn,
      )
    },
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
  activity: WindowLog[]
  read: ActivityRead
} {
  const state = {
    therapies: initial.therapies ?? (null as Therapy[] | null),
    anamnesis: initial.anamnesis ?? (null as AnamnesisForm | null),
    availability: initial.availability ?? EMPTY_AVAILABILITY,
    orders: [...(initial.orders ?? [])],
    messages: initial.messages ?? DEFAULT_MESSAGES,
    activity: [] as WindowLog[],
    read: { seenAt: null, marks: {} } as ActivityRead,
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
    listActivity: async () => copy([...state.activity].sort((a, b) => b.at - a.at)),
    addActivity: async (logs: readonly WindowLog[]) => {
      state.activity = [...state.activity, ...copy([...logs])]
    },
    loadActivityRead: async () => copy(state.read),
    saveActivityRead: async (_uid: string, read: ActivityRead) => {
      state.read = copy(read)
    },
    updateOrder: async (uid: string, orderId: string, change: OrderChange) => {
      state.orders = state.orders.map((o) =>
        o.uid === uid && o.id === orderId ? { ...o, ...change } : o,
      )
    },
  })
}
