// O que o fluxo da ativação individual lê e grava (ADR-029): terapias, anamnese e agenda são públicas
// (`catalog/`, lidas sem login); as respostas da pessoa ficam em `users/{uid}/anamnesis/current`, que
// só ela grava e só ela e a Andreía leem (firestore.rules).
import {
  DEFAULT_ANAMNESIS,
  parseAnamnesis,
  type AnamnesisForm,
} from '../../../shared/ativacao/anamnesis'
import { parseSavedAnamnesis, type SavedAnamnesis } from '../../../shared/ativacao/answers'
import { DEFAULT_MESSAGES, parseMessages, type Messages } from '../../../shared/ativacao/messages'
import {
  HOLD_MS,
  newOrderFields,
  newOrderId,
  orderFromFields,
  orderUpdateFields,
  TEST_PAYMENT_REF,
  type OrderDetails,
  type SessionOrder,
} from '../../../shared/ativacao/order'
import {
  EMPTY_AVAILABILITY,
  parseAvailability,
  type Availability,
} from '../../../shared/ativacao/availability'
import { DEFAULT_THERAPIES, parseTherapies, type Therapy } from '../../../shared/ativacao/therapy'
import {
  documentId,
  documentsUrl,
  fieldsOf,
  getJson,
  patchDocument,
  type RestValue,
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
  /** Cria o pedido como "Aguardando pagamento" e devolve o código. */
  createOrder(uid: string, details: OrderDetails): Promise<string>
  getOrder(uid: string, orderId: string): Promise<SessionOrder | null>
  /** Paga → Solicitada: a pessoa avisou a Andreía no WhatsApp. */
  markRequested(uid: string, orderId: string): Promise<void>
  /**
   * Pagamento simulado (ADR-033): o pedido vira Paga sem cobrança, marcado como teste. Só admins
   * (as regras do Firestore recusam os outros).
   */
  markTestPaid(uid: string, orderId: string): Promise<void>
  /** Os pedidos da pessoa (perfil, aba Ativações). */
  listMyOrders(uid: string): Promise<SessionOrder[]>
  /** Confirma o horário que a Andreía aprovou (o pedido vira Agendada). */
  confirmProposal(uid: string, order: SessionOrder): Promise<void>
  loadMessages(): Promise<Messages>
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
    async createOrder(uid, details) {
      const id = newOrderId()
      await patchDocument(
        config,
        `users/${uid}/sessions/${id}`,
        newOrderFields(details, Date.now()) as Record<string, RestValue>,
        await token(),
        fetchFn,
      )
      return id
    },
    async getOrder(uid, orderId) {
      const body = await getJson(
        documentsUrl(config, `users/${uid}/sessions/${orderId}`),
        await token(),
        fetchFn,
      )
      const fields = fieldsOf(body)
      return fields ? orderFromFields(orderId, uid, fields) : null
    },
    loadMessages: async () => parseMessages(await content('catalog/messages', null)),
    async listMyOrders(uid) {
      const body = await getJson(
        documentsUrl(config, `users/${uid}/sessions`, '&pageSize=100'),
        await token(),
        fetchFn,
      )
      const documents =
        typeof body === 'object' &&
        body !== null &&
        Array.isArray((body as { documents?: unknown }).documents)
          ? (body as { documents: unknown[] }).documents
          : []
      return documents.flatMap((document) => {
        const id = documentId(document)
        const fields = fieldsOf(document)
        const order = id && fields ? orderFromFields(id, uid, fields) : null
        return order ? [order] : []
      })
    },
    async confirmProposal(uid, order) {
      if (!order.proposed) throw new Error('Sem horário aprovado.')
      await patchDocument(
        config,
        `users/${uid}/sessions/${order.id}`,
        orderUpdateFields({
          status: 'sched',
          scheduled: order.proposed,
          scheduledAt: Date.now(),
        }) as Record<string, RestValue>,
        await token(),
        fetchFn,
      )
    },
    async markRequested(uid, orderId) {
      await patchDocument(
        config,
        `users/${uid}/sessions/${orderId}`,
        orderUpdateFields({ status: 'req', requestedAt: Date.now() }) as Record<string, RestValue>,
        await token(),
        fetchFn,
      )
    },
    async markTestPaid(uid, orderId) {
      await patchDocument(
        config,
        `users/${uid}/sessions/${orderId}`,
        orderUpdateFields({
          status: 'paid',
          paidAt: Date.now(),
          paymentRef: TEST_PAYMENT_REF,
        }) as Record<string, RestValue>,
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
    orders?: SessionOrder[]
    messages?: Messages
  } = {},
): AtivacaoSource & { mine: Record<string, SavedAnamnesis>; orders: SessionOrder[] } {
  const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
  const mine: Record<string, SavedAnamnesis> = { ...(initial.mine ?? {}) }
  const orders: SessionOrder[] = [...(initial.orders ?? [])]
  const find = (uid: string, id: string) => orders.find((o) => o.uid === uid && o.id === id)
  return {
    mine,
    orders,
    loadTherapies: async () => copy(initial.therapies ?? [...DEFAULT_THERAPIES]),
    loadAnamnesis: async () => copy(initial.anamnesis ?? DEFAULT_ANAMNESIS),
    loadAvailability: async () => copy(initial.availability ?? EMPTY_AVAILABILITY),
    loadMyAnamnesis: async (uid) => (mine[uid] ? copy(mine[uid]) : null),
    saveMyAnamnesis: async (uid, saved) => {
      mine[uid] = copy(saved)
    },
    async createOrder(uid, details) {
      const fields = newOrderFields(details, Date.now())
      const order = orderFromFields(newOrderId(), uid, fields)!
      orders.push(order)
      return order.id
    },
    getOrder: async (uid, id) => {
      const order = find(uid, id)
      return order ? copy(order) : null
    },
    loadMessages: async () => copy(initial.messages ?? DEFAULT_MESSAGES),
    listMyOrders: async (uid) => copy(orders.filter((o) => o.uid === uid)),
    async confirmProposal(uid, current) {
      const order = find(uid, current.id)
      if (!order?.proposed || !order.proposedAt || Date.now() >= order.proposedAt + HOLD_MS) {
        throw new Error('Reserva vencida.')
      }
      order.status = 'sched'
      order.scheduled = order.proposed
      order.scheduledAt = Date.now()
    },
    async markRequested(uid, id) {
      const order = find(uid, id)
      if (!order || order.status !== 'paid') throw new Error('Só um pedido pago vira Solicitada.')
      order.status = 'req'
      order.requestedAt = Date.now()
    },
    async markTestPaid(uid, id) {
      const order = find(uid, id)
      if (!order || order.status !== 'wait') throw new Error('Só um pedido novo vira pago.')
      order.status = 'paid'
      order.paidAt = Date.now()
      order.paymentRef = TEST_PAYMENT_REF
    },
  }
}
