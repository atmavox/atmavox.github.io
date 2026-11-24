// Pedidos da ativação individual (ADR-029), em `users/{uid}/sessions/{id}`. Usado pelo site (a pessoa
// cria; a Andreía acompanha) e pelo Worker do pagamento (marca como paga). Funções puras.

export const ORDER_STATUSES = ['wait', 'paid', 'req', 'sched', 'done', 'cancel'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const STATUS_LABELS: Record<OrderStatus, string> = {
  wait: 'Aguardando pagamento',
  paid: 'Paga',
  req: 'Solicitada',
  sched: 'Agendada',
  done: 'Realizada',
  cancel: 'Cancelada',
}

/** A ordem do caminho (Cancelada fica de fora). */
export const STATUS_FLOW: readonly OrderStatus[] = ['wait', 'paid', 'req', 'sched', 'done']

/** `paymentRef` de um pedido pago por simulação de uma admin (ADR-033): sem cobrança. */
export const TEST_PAYMENT_REF = 'teste'

export const isTestOrder = (order: Pick<SessionOrder, 'paymentRef'>) =>
  order.paymentRef === TEST_PAYMENT_REF

/** Sem pagamento em 2 dias, o pedido some. */
export const ORDER_TTL_MS = 2 * 24 * 60 * 60 * 1000

/** O que a pessoa escolheu (gravado ao criar; ninguém muda depois, só a Andreía). */
export interface OrderDetails {
  therapyId: string
  therapyName: string
  durationMin: number
  /** O preço que a pessoa viu; quem cobra é o Worker, pelo catálogo (`chargedCents`). */
  priceCents: number
  preference: { date: string; start: string }
  extra: Record<string, string>
  name: string
  phone: string
}

export interface SessionOrder extends OrderDetails {
  id: string
  uid: string
  status: OrderStatus
  createdAt: number
  /** Valor cobrado pelo Worker (do catálogo), conferido no aviso de pagamento. */
  chargedCents: number | null
  paidAt: number | null
  requestedAt: number | null
  scheduledAt: number | null
  doneAt: number | null
  cancelledAt: number | null
  paymentRef: string | null
  /** O horário confirmado (aprovado pela Andreía e confirmado pela pessoa). */
  scheduled: Slot | null
  /** O horário que a Andreía aprovou e espera a pessoa confirmar (reservado por 24 h). */
  proposed: Slot | null
  proposedAt: number | null
}

export interface Slot {
  date: string
  start: string
  end: string
}

/** Quanto tempo o horário aprovado fica reservado esperando a pessoa confirmar. */
export const HOLD_MS = 24 * 60 * 60 * 1000

/** Sempre a mesma ordem de chaves: a regra do Firestore compara o texto de `proposed` e `scheduled`. */
export const slotJson = (slot: Slot) =>
  JSON.stringify({ date: slot.date, start: slot.start, end: slot.end })

/** Há um horário aprovado esperando a confirmação da pessoa, ainda no prazo. */
export function proposalOpen(order: SessionOrder, now: number): boolean {
  return (
    !!order.proposed &&
    order.proposedAt !== null &&
    (order.status === 'paid' || order.status === 'req') &&
    now < order.proposedAt + HOLD_MS
  )
}

/** A reserva venceu sem a pessoa confirmar: o horário volta para a agenda. */
export function proposalExpired(order: SessionOrder, now: number): boolean {
  return (
    !!order.proposed &&
    order.proposedAt !== null &&
    (order.status === 'paid' || order.status === 'req') &&
    now >= order.proposedAt + HOLD_MS
  )
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** "A7KX2Q": curto para ditar no WhatsApp, sem letras que confundem (I, L, O, 0, 1). */
export function newOrderId(random: () => number = Math.random): string {
  let code = 'A'
  for (let i = 0; i < 5; i++) code += CODE_CHARS[Math.floor(random() * CODE_CHARS.length)]
  return code
}

export const ORDER_ID = /^A[A-Z0-9]{5}$/

export function isExpired(order: Pick<SessionOrder, 'status' | 'createdAt'>, now: number): boolean {
  return order.status === 'wait' && now - order.createdAt > ORDER_TTL_MS
}

/** Os pedidos que contam: sem os vencidos, mais novos primeiro. */
export function visibleOrders(orders: readonly SessionOrder[], now: number): SessionOrder[] {
  return orders.filter((o) => !isExpired(o, now)).sort((a, b) => b.createdAt - a.createdAt)
}

/** Quando cada etapa aconteceu (para a linha de etapas do perfil e do Modo Andreía). */
export function statusTimes(order: SessionOrder): Partial<Record<OrderStatus, number>> {
  return {
    wait: order.createdAt,
    ...(order.paidAt ? { paid: order.paidAt } : {}),
    ...(order.requestedAt ? { req: order.requestedAt } : {}),
    ...(order.scheduledAt ? { sched: order.scheduledAt } : {}),
    ...(order.doneAt ? { done: order.doneAt } : {}),
    ...(order.cancelledAt ? { cancel: order.cancelledAt } : {}),
  }
}

/* ---------- campos do documento (REST do Firestore) ---------- */

type RestField = Record<string, unknown>
type RestFields = Record<string, RestField>

const str = (value: string): RestField => ({ stringValue: value })
const int = (value: number): RestField => ({ integerValue: String(Math.trunc(value)) })

/** O documento novo: só o que a regra deixa a pessoa criar (`status`, `content`, `createdAt`). */
export function newOrderFields(details: OrderDetails, createdAt: number): RestFields {
  return {
    status: str('wait'),
    content: str(JSON.stringify(details)),
    createdAt: int(createdAt),
  }
}

/** Campos que a Andreía ou o Worker mudam (`undefined` fica de fora). */
export function orderUpdateFields(
  change: Partial<
    Pick<
      SessionOrder,
      | 'status'
      | 'chargedCents'
      | 'paidAt'
      | 'requestedAt'
      | 'scheduledAt'
      | 'doneAt'
      | 'cancelledAt'
      | 'paymentRef'
      | 'scheduled'
      | 'proposed'
      | 'proposedAt'
    >
  >,
): RestFields {
  const fields: RestFields = {}
  if (change.status) fields.status = str(change.status)
  for (const key of [
    'chargedCents',
    'paidAt',
    'requestedAt',
    'scheduledAt',
    'doneAt',
    'cancelledAt',
  ] as const) {
    const value = change[key]
    if (typeof value === 'number') fields[key] = int(value)
  }
  if (change.paymentRef) fields.paymentRef = str(change.paymentRef)
  if (change.scheduled) fields.scheduled = str(slotJson(change.scheduled))
  // `proposed: null` limpa a proposta (reserva vencida ou trocada).
  if (change.proposed) fields.proposed = str(slotJson(change.proposed))
  else if (change.proposed === null) fields.proposed = { nullValue: null }
  if (typeof change.proposedAt === 'number') fields.proposedAt = int(change.proposedAt)
  else if (change.proposedAt === null) fields.proposedAt = { nullValue: null }
  return fields
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function readString(fields: Record<string, unknown>, name: string): string | undefined {
  const f = fields[name]
  return isObject(f) && typeof f.stringValue === 'string' ? f.stringValue : undefined
}

function readInt(fields: Record<string, unknown>, name: string): number | null {
  const f = fields[name]
  if (!isObject(f)) return null
  if (typeof f.integerValue === 'string' && /^-?\d+$/.test(f.integerValue))
    return Number(f.integerValue)
  return typeof f.doubleValue === 'number' ? f.doubleValue : null
}

function readSlot(fields: Record<string, unknown>, name: string): Slot | null {
  try {
    const raw: unknown = JSON.parse(readString(fields, name) ?? 'null')
    return isObject(raw) &&
      typeof raw.date === 'string' &&
      typeof raw.start === 'string' &&
      typeof raw.end === 'string'
      ? { date: raw.date, start: raw.start, end: raw.end }
      : null
  } catch {
    return null
  }
}

export function parseOrderDetails(raw: unknown): OrderDetails | null {
  if (!isObject(raw)) return null
  const pref = raw.preference
  const text = (v: unknown) => (typeof v === 'string' ? v : '')
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN)
  const details: OrderDetails = {
    therapyId: text(raw.therapyId),
    therapyName: text(raw.therapyName),
    durationMin: num(raw.durationMin),
    priceCents: num(raw.priceCents),
    preference: isObject(pref)
      ? { date: text(pref.date), start: text(pref.start) }
      : { date: '', start: '' },
    extra: isObject(raw.extra)
      ? Object.fromEntries(
          Object.entries(raw.extra).filter((e): e is [string, string] => typeof e[1] === 'string'),
        )
      : {},
    name: text(raw.name),
    phone: text(raw.phone),
  }
  if (!details.therapyId || !details.preference.date || !details.preference.start) return null
  if (!Number.isFinite(details.durationMin) || !Number.isFinite(details.priceCents)) return null
  return details
}

/** Um documento REST (`fields`) → pedido; `null` se estiver quebrado. */
export function orderFromFields(
  id: string,
  uid: string,
  fields: Record<string, unknown>,
): SessionOrder | null {
  const status = ORDER_STATUSES.find((s) => s === readString(fields, 'status'))
  const createdAt = readInt(fields, 'createdAt')
  let details: OrderDetails | null = null
  try {
    details = parseOrderDetails(JSON.parse(readString(fields, 'content') ?? 'null'))
  } catch {
    details = null
  }
  if (!status || createdAt === null || !details) return null
  return {
    ...details,
    id,
    uid,
    status,
    createdAt,
    chargedCents: readInt(fields, 'chargedCents'),
    paidAt: readInt(fields, 'paidAt'),
    requestedAt: readInt(fields, 'requestedAt'),
    scheduledAt: readInt(fields, 'scheduledAt'),
    doneAt: readInt(fields, 'doneAt'),
    cancelledAt: readInt(fields, 'cancelledAt'),
    paymentRef: readString(fields, 'paymentRef') ?? null,
    scheduled: readSlot(fields, 'scheduled'),
    proposed: readSlot(fields, 'proposed'),
    proposedAt: readInt(fields, 'proposedAt'),
  }
}

/** "projects/…/documents/users/{uid}/sessions/{id}" → { uid, id }. */
export function orderPathOf(name: unknown): { uid: string; id: string } | null {
  if (typeof name !== 'string') return null
  const match = /\/documents\/users\/([^/]+)\/sessions\/([^/]+)$/.exec(name)
  return match ? { uid: decodeURIComponent(match[1]!), id: decodeURIComponent(match[2]!) } : null
}
