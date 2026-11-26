// Movimentações recentes das ativações (mock aprovado, opção C, 2026-11-25; ADR-037). Quase tudo sai
// dos pedidos, que já guardam quando passaram por cada situação; só as mudanças nos horários livres
// precisam de um registro próprio (`activity/{id}`).
import {
  localDate,
  timeLabel,
  weekdayShort,
  type Availability,
  type AvailabilityWindow,
} from '../../../shared/ativacao/availability'
import {
  HOLD_MS,
  isExpired,
  ORDER_TTL_MS,
  proposalExpired,
  type SessionOrder,
  type Slot,
} from '../../../shared/ativacao/order'

export type ActivityKind =
  | 'new'
  | 'paid'
  | 'requested'
  | 'proposed'
  | 'confirmed'
  | 'done'
  | 'cancelled'
  | 'expired'
  | 'hold-expired'
  | 'window'

export interface ActivityEvent {
  /** Único na lista (chave do React). */
  id: string
  at: number
  kind: ActivityKind
  /** Quem fez: a pessoa (no início da frase) ou a própria Andreía ("Você"). */
  who: string
  /** O resto da frase, depois de quem fez. */
  text: string
  /** A situação ou o detalhe, em letra menor. */
  detail: string
  /** Feito pela própria Andreía: aparece na lista, mas não conta como novidade. */
  byAndreia: boolean
  /** O pedido, para o link "Abrir o pedido". */
  orderId?: string
}

/** Uma mudança num horário livre, gravada quando a Andreía salva a agenda. */
export interface WindowLog {
  at: number
  change: 'created' | 'changed' | 'removed'
  date: string
  start: string
  end: string
  weekly: boolean
}

/** Quanto tempo de movimentações o sino mostra. */
export const ACTIVITY_DAYS = 60
const DAY_MS = 24 * 60 * 60 * 1000

/** "2026-11-27" + 15:00–15:50 → "qui 27/11 · 15h às 15h50". */
export function slotLabel(slot: Pick<Slot, 'date' | 'start' | 'end'>): string {
  const day = `${weekdayShort(slot.date).toLowerCase()} ${slot.date.slice(8, 10)}/${slot.date.slice(5, 7)}`
  return `${day} · ${timeLabel(slot.start)} às ${timeLabel(slot.end)}`
}

const firstName = (name: string) => name.trim() || 'Alguém'

/** As movimentações de um pedido, cada uma no momento em que aconteceu. */
export function orderEvents(order: SessionOrder, now: number): ActivityEvent[] {
  const who = firstName(order.name)
  const base = { who, orderId: order.id }
  const events: ActivityEvent[] = [
    {
      ...base,
      id: `${order.id}:new`,
      at: order.createdAt,
      kind: 'new',
      text: `pediu ${order.therapyName}`,
      detail: 'Aguardando pagamento',
      byAndreia: false,
    },
  ]
  const add = (at: number | null, event: Omit<ActivityEvent, 'id' | 'at' | 'orderId'>) => {
    if (at !== null)
      events.push({ ...event, id: `${order.id}:${event.kind}`, at, orderId: order.id })
  }
  add(order.paidAt, {
    kind: 'paid',
    who,
    text: `pagou ${order.therapyName}`,
    detail: 'Paga',
    byAndreia: false,
  })
  add(order.requestedAt, {
    kind: 'requested',
    who,
    text: order.preference.date
      ? `pediu um horário · ${weekdayShort(order.preference.date).toLowerCase()} ${order.preference.date.slice(8, 10)}/${order.preference.date.slice(5, 7)}, ${timeLabel(order.preference.start)}`
      : 'pediu um horário',
    detail: 'Solicitada · falta você responder',
    byAndreia: false,
  })
  if (order.proposed) {
    add(order.proposedAt, {
      kind: 'proposed',
      who: 'Você',
      text: `aprovou ${slotLabel(order.proposed)} para ${who}`,
      detail: 'Esperando a pessoa confirmar',
      byAndreia: true,
    })
  }
  add(order.scheduledAt, {
    kind: 'confirmed',
    who,
    text: order.scheduled ? `confirmou ${slotLabel(order.scheduled)}` : 'confirmou o horário',
    detail: 'Agendada',
    byAndreia: false,
  })
  add(order.doneAt, {
    kind: 'done',
    who: 'Você',
    text: `marcou como realizada a sessão de ${who}`,
    detail: 'Realizada',
    byAndreia: true,
  })
  add(order.cancelledAt, {
    kind: 'cancelled',
    who: 'O pedido',
    text: `de ${who} foi cancelado`,
    detail: 'Cancelada',
    byAndreia: false,
  })
  if (isExpired(order, now)) {
    add(order.createdAt + ORDER_TTL_MS, {
      kind: 'expired',
      who: 'O pedido',
      text: `de ${who} venceu sem pagamento`,
      detail: 'Passou de 48 h',
      byAndreia: false,
    })
  }
  if (proposalExpired(order, now) && order.proposedAt !== null) {
    add(order.proposedAt + HOLD_MS, {
      kind: 'hold-expired',
      who,
      text: 'não confirmou o horário a tempo',
      detail: 'O horário voltou para a agenda',
      byAndreia: false,
    })
  }
  return events
}

const sameWindow = (a: AvailabilityWindow, b: AvailabilityWindow) =>
  a.date === b.date && a.start === b.start && a.end === b.end && a.weekly === b.weekly

/** O que mudou nos horários livres entre a agenda de antes e a de agora. */
export function windowChanges(before: Availability, after: Availability, at: number): WindowLog[] {
  const old = new Map(before.windows.map((w) => [w.id, w]))
  const next = new Map(after.windows.map((w) => [w.id, w]))
  const log = (change: WindowLog['change'], w: AvailabilityWindow): WindowLog => ({
    at,
    change,
    date: w.date,
    start: w.start,
    end: w.end,
    weekly: w.weekly,
  })
  const changes: WindowLog[] = []
  for (const w of after.windows) {
    const was = old.get(w.id)
    if (!was) changes.push(log('created', w))
    else if (!sameWindow(was, w)) changes.push(log('changed', w))
  }
  for (const w of before.windows) if (!next.has(w.id)) changes.push(log('removed', w))
  return changes
}

const CHANGE_TEXT: Record<WindowLog['change'], string> = {
  created: 'criou um horário livre',
  changed: 'mudou um horário livre para',
  removed: 'tirou o horário livre de',
}

export function windowEvent(log: WindowLog, index: number): ActivityEvent {
  const when = slotLabel(log)
  return {
    id: `window:${log.at}:${index}`,
    at: log.at,
    kind: 'window',
    who: 'Você',
    text: `${CHANGE_TEXT[log.change]} ${log.change === 'created' ? `· ${when}` : when}`,
    detail: log.weekly ? 'Agenda · toda semana' : 'Agenda',
    byAndreia: true,
  }
}

/** Tudo dos últimos 60 dias, do mais novo para o mais antigo (só o que já aconteceu). */
export function activityFeed(
  orders: readonly SessionOrder[],
  logs: readonly WindowLog[],
  now: number,
): ActivityEvent[] {
  const since = now - ACTIVITY_DAYS * DAY_MS
  return [...orders.flatMap((o) => orderEvents(o, now)), ...logs.map(windowEvent)]
    .filter((e) => e.at >= since && e.at <= now)
    .sort((a, b) => b.at - a.at)
}

/** Na primeira vez (sem nada guardado), contam as novidades da última semana. */
const FIRST_VISIT_DAYS = 7

/**
 * Lida ou não lida, uma a uma (pedido de 2026-11-25): vale mais que a marca geral. Uma não lida fica
 * como lembrete até a Andreía marcar.
 */
export type ReadMarks = Readonly<Record<string, boolean>>

/**
 * Ainda por ver: marcada como não lida, ou (sem marca própria) feita por uma pessoa depois da marca
 * geral de "tudo lido". O que a própria Andreía fez só conta se ela deixar como não lida.
 */
export function isUnseen(
  event: ActivityEvent,
  seenAt: number | null,
  now: number,
  marks: ReadMarks = {},
): boolean {
  const mark = marks[event.id]
  if (mark !== undefined) return !mark
  if (event.byAndreia) return false
  return event.at > (seenAt ?? now - FIRST_VISIT_DAYS * DAY_MS)
}

export function unseenCount(
  feed: readonly ActivityEvent[],
  seenAt: number | null,
  now: number,
  marks: ReadMarks = {},
): number {
  return feed.filter((e) => isUnseen(e, seenAt, now, marks)).length
}

/** Só as marcas das movimentações que ainda estão na lista (as de mais de 60 dias saem). */
export function keepMarks(marks: ReadMarks, feed: readonly ActivityEvent[]): ReadMarks {
  const ids = new Set(feed.map((e) => e.id))
  return Object.fromEntries(Object.entries(marks).filter(([id]) => ids.has(id)))
}
/** O título do grupo do dia: "Hoje", "Ontem" ou "Seg, 23/11" (no fuso do aparelho). */
export function dayHeading(at: number, now: number): string {
  const day = localDate(at)
  if (day === localDate(now)) return 'Hoje'
  if (day === localDate(now - DAY_MS)) return 'Ontem'
  return `${weekdayShort(day)}, ${day.slice(8, 10)}/${day.slice(5, 7)}`
}
