import { useEffect, useState } from 'react'
import {
  DEFAULT_ANAMNESIS,
  type AnamnesisForm,
  type AnamnesisQuestion,
} from '../../../../shared/ativacao/anamnesis'
import {
  whatsAppDigits,
  type Answer,
  type SavedAnamnesis,
} from '../../../../shared/ativacao/answers'
import {
  dayOfMonth,
  longDate,
  monthName,
  timeLabel,
  weekdayShort,
} from '../../../../shared/ativacao/availability'
import {
  STATUS_FLOW,
  STATUS_LABELS,
  visibleOrders,
  type OrderStatus,
  type SessionOrder,
} from '../../../../shared/ativacao/order'
import { DEFAULT_THERAPIES, type Therapy } from '../../../../shared/ativacao/therapy'
import { formatPrice } from '../../../../shared/catalog/offer'
import { useNow } from '../../../../shared/lib/useNow'
import { buildWhatsAppLink } from '../../../../shared/lib/whatsapp'
import { TherapyBadge } from '../../../../shared/ui/TherapyIcon'
import { UiIcon } from '../../../../shared/ui/UiIcon'
import type { AtivacoesBackend, OrderChange } from '../../infrastructure/ativacoesBackend'
import { adminButton, ghostButton } from '../styles'
import { Overlay } from './Overlay'

const STATUS_CLASS: Record<OrderStatus, string> = {
  wait: 'bg-draft/13 text-draft',
  paid: 'bg-accent/13 text-accent',
  req: 'bg-gold/15 text-gold',
  sched: 'bg-admin-ink/13 text-admin-ink',
  done: 'bg-ok/13 text-ok',
  cancel: 'bg-ink/8 text-ink-faint',
}

/** O que a Andreía tem a fazer em cada situação (aparece embaixo do status). */
const STATUS_HINT: Record<OrderStatus, string> = {
  wait: 'a pessoa ainda não pagou',
  paid: 'pago; a pessoa ainda não avisou no WhatsApp',
  req: 'aguardando a sua resposta no WhatsApp',
  sched: 'horário aprovado',
  done: 'sessão feita',
  cancel: 'cancelado',
}

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_CLASS[status]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  )
}

const shortWhen = (date: string, start: string) =>
  `${weekdayShort(date).toLowerCase()}, ${dayOfMonth(date)} ${monthName(Number(date.slice(5, 7))).slice(0, 3)} · ${timeLabel(start)}`

const whenOf = (order: SessionOrder) =>
  order.scheduled ? order.scheduled : { ...order.preference, end: '' }

function answerText(question: AnamnesisQuestion | undefined, answer: Answer): string {
  if (Array.isArray(answer)) return answer.join(', ')
  if (typeof answer === 'number') return `${answer} de 10`
  if (question?.type === 'yesno')
    return answer === 'sim' ? 'Sim' : answer === 'nao' ? 'Não' : answer
  if (question?.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(answer)) {
    return answer.split('-').reverse().join('/')
  }
  return answer
}

function AnamnesisAnswers({
  saved,
  form,
  extra,
}: {
  saved: SavedAnamnesis | null | undefined
  form: AnamnesisForm
  extra: { label: string; answer: string }[]
}) {
  const [all, setAll] = useState(false)
  if (saved === undefined) return <p className="text-sm text-ink-faint">Carregando a anamnese…</p>
  const questions = [...form.sections.flatMap((s) => s.questions), ...form.archived]
  const byId = new Map(questions.map((q) => [q.id, q]))
  const answered = Object.entries(saved?.answers ?? {}).filter(
    ([id]) => id !== 'nome' && id !== 'telefone',
  )
  const groups = all
    ? form.sections.map((section) => ({
        title: section.title,
        rows: section.questions
          .filter(
            (q) => saved?.answers[q.id] !== undefined && q.id !== 'nome' && q.id !== 'telefone',
          )
          .map((q) => ({ label: q.label, text: answerText(q, saved!.answers[q.id]!) })),
      }))
    : [
        {
          title: '',
          rows: answered.slice(0, 4).map(([id, answer]) => ({
            label: byId.get(id)?.label ?? id,
            text: answerText(byId.get(id), answer),
          })),
        },
      ]
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-[0.2em] text-admin-ink uppercase">Anamnese</p>
      {!saved && <p className="text-sm text-ink-faint">A pessoa ainda não tem respostas salvas.</p>}
      {groups.map((group, i) =>
        group.rows.length ? (
          <div key={i} className="flex flex-col gap-2.5">
            {group.title && (
              <p className="text-[11px] tracking-[0.14em] text-ink-faint uppercase">
                {group.title}
              </p>
            )}
            {group.rows.map((row) => (
              <div key={row.label} className="flex flex-col">
                <span className="text-[13px] text-ink-faint">{row.label}</span>
                <span className="text-[0.95rem] whitespace-pre-line text-ink">{row.text}</span>
              </div>
            ))}
          </div>
        ) : null,
      )}
      {extra.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] tracking-[0.14em] text-ink-faint uppercase">
            Só para esta terapia
          </p>
          {extra.map((row) => (
            <div key={row.label} className="flex flex-col">
              <span className="text-[13px] text-ink-faint">{row.label}</span>
              <span className="text-[0.95rem] text-ink">{row.answer}</span>
            </div>
          ))}
        </div>
      )}
      {answered.length > 4 && (
        <button
          type="button"
          onClick={() => setAll(!all)}
          className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-admin-ink hover:underline"
        >
          {all ? 'Mostrar menos' : 'Ver todas as respostas'}
          <UiIcon name={all ? 'up' : 'down'} size={15} />
        </button>
      )}
    </div>
  )
}

/** Pedidos (mock aprovado): quadro por status no computador, lista por dia no celular. */
export function OrdersPanel({ backend, isWide }: { backend: AtivacoesBackend; isWide: boolean }) {
  const now = useNow()
  const [orders, setOrders] = useState<SessionOrder[] | null>(null)
  const [therapies, setTherapies] = useState<readonly Therapy[]>(DEFAULT_THERAPIES)
  const [form, setForm] = useState<AnamnesisForm>(DEFAULT_ANAMNESIS)
  const [open, setOpen] = useState<SessionOrder | null>(null)
  const [saved, setSaved] = useState<SavedAnamnesis | null | undefined>(undefined)
  const [showCancelled, setShowCancelled] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      backend.listOrders().catch(() => null),
      backend.loadTherapies().catch(() => null),
      backend.loadAnamnesis().catch(() => null),
    ]).then(([list, ts, f]) => {
      if (cancelled) return
      if (list === null) setNotice('Não deu para carregar os pedidos. Confira a internet.')
      setOrders(list ?? [])
      if (ts?.length) setTherapies(ts)
      if (f) setForm(f)
    })
    return () => {
      cancelled = true
    }
  }, [backend])

  if (!orders) return <p className="p-8 text-ink-muted">Carregando os pedidos…</p>

  const list = visibleOrders(orders, now)
  const therapyOf = (id: string) => therapies.find((t) => t.id === id)

  function openOrder(order: SessionOrder) {
    setOpen(order)
    setConfirmCancel(false)
    setNotice(null)
    setSaved(undefined)
    void backend
      .loadPersonAnamnesis(order.uid)
      .catch(() => null)
      .then(setSaved)
  }

  async function change(order: SessionOrder, update: OrderChange, message: string) {
    setIsSaving(true)
    try {
      await backend.updateOrder(order.uid, order.id, update)
      const next = { ...order, ...update }
      setOrders((all) => all!.map((o) => (o.uid === order.uid && o.id === order.id ? next : o)))
      setOpen(next)
      setNotice(message)
    } catch {
      setNotice('Não deu para salvar. Confira a internet e tente de novo.')
    } finally {
      setIsSaving(false)
      setConfirmCancel(false)
    }
  }

  const card = (order: SessionOrder) => {
    const t = therapyOf(order.therapyId)
    const when = whenOf(order)
    return (
      <button
        key={`${order.uid}-${order.id}`}
        type="button"
        onClick={() => openOrder(order)}
        className="flex w-full flex-col gap-1.5 rounded-xl border border-line bg-surface p-3 text-left text-[13px] transition-colors hover:border-admin-ink/50"
      >
        <b className="text-sm text-ink">{order.name || 'Sem nome'}</b>
        <span className="flex items-center gap-2 text-ink-muted">
          {t && <TherapyBadge icon={t.icon} tone={t.tone} size={18} />}
          <span className="truncate">{order.therapyName}</span>
        </span>
        <span className="flex items-center gap-1.5 text-ink-faint">
          <UiIcon name="calendar" size={13} />
          {shortWhen(when.date, when.start)}
        </span>
      </button>
    )
  }

  /* ---------- o pedido aberto ---------- */

  let detail = null
  if (open) {
    const t = therapyOf(open.therapyId)
    const when = whenOf(open)
    const digits = whatsAppDigits(open.phone)
    const firstName = String(saved?.answers.apelido || open.name.split(' ')[0] || '')
    const talk = digits
      ? buildWhatsAppLink(digits, `Oi, ${firstName}! Aqui é a Andreía, da Atmavox.`)
      : null
    const extra = (t?.questions ?? [])
      .filter((q) => open.extra[q.id])
      .map((q) => ({
        label: q.label,
        answer:
          q.type === 'yesno' ? (open.extra[q.id] === 'sim' ? 'Sim' : 'Não') : open.extra[q.id]!,
      }))
    const info = (
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-bg p-3.5 text-sm">
        {[
          ['Terapia', open.therapyName],
          [
            open.scheduled ? 'Horário aprovado' : 'Prefere',
            `${longDate(when.date)}, às ${timeLabel(when.start)}`,
          ],
          ['Valor', formatPrice(open.chargedCents ?? open.priceCents)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <span className="text-ink-faint">{label}</span>
            <b className="text-right font-medium text-ink">{value}</b>
          </div>
        ))}
        <div className="flex justify-between gap-3">
          <span className="text-ink-faint">Telefone</span>
          {talk ? (
            <a
              href={talk}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-admin-ink hover:underline"
            >
              {open.phone}
            </a>
          ) : (
            <b className="font-medium text-ink">{open.phone || 'sem telefone'}</b>
          )}
        </div>
      </div>
    )
    const actions = (
      <div className="flex flex-col gap-2">
        {talk && (
          <a href={talk} target="_blank" rel="noopener noreferrer" className={adminButton}>
            <UiIcon name="next" size={16} />
            Conversar no WhatsApp
          </a>
        )}
        {(open.status === 'paid' || open.status === 'req') && (
          <p className="rounded-xl bg-admin/8 px-3 py-2 text-[13px] text-ink-muted">
            Combine o horário pelo WhatsApp. O botão "Aprovar horário" chega no próximo passo.
          </p>
        )}
        {open.status === 'sched' && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              void change(open, { status: 'done', doneAt: Date.now() }, 'Marcado como realizado ✓')
            }
            className={ghostButton}
          >
            <UiIcon name="check" size={16} />
            Marcar como realizada
          </button>
        )}
      </div>
    )
    const cancelControl =
      open.status !== 'cancel' && open.status !== 'done' ? (
        confirmCancel ? (
          <span
            role="group"
            aria-label="Confirmar"
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="text-ink-muted">Cancelar este pedido?</span>
            <button
              type="button"
              disabled={isSaving}
              onClick={() =>
                void change(
                  open,
                  { status: 'cancel', cancelledAt: Date.now() },
                  'Pedido cancelado ✓',
                )
              }
              className="rounded-full bg-wine px-3.5 py-1.5 font-semibold text-on-admin hover:opacity-90"
            >
              Cancelar pedido
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancel(false)}
              className="px-2 text-ink-muted"
            >
              Não
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-wine"
          >
            <UiIcon name="close" size={15} />
            Cancelar pedido
          </button>
        )
      ) : null

    const left = (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {t && <TherapyBadge icon={t.icon} tone={t.tone} size={44} />}
          <div className="min-w-0">
            <b className="block text-lg text-ink">{open.name || 'Sem nome'}</b>
            <span className="text-sm text-ink-faint">Pedido {open.id}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={open.status} />
          <span className="text-sm text-ink-faint">{STATUS_HINT[open.status]}</span>
        </div>
        {info}
        {actions}
        {notice && (
          <p
            role="status"
            className={`text-sm ${notice.endsWith('✓') ? 'text-ok' : 'text-accent'}`}
          >
            {notice}
          </p>
        )}
        {cancelControl}
        {open.status !== 'cancel' && open.paymentRef && (
          <p className="text-xs text-ink-faint">
            Se precisar devolver o dinheiro, o estorno é feito no painel do Mercado Pago.
          </p>
        )}
      </div>
    )
    const right = (
      <AnamnesisAnswers key={`${open.uid}-${open.id}`} saved={saved} form={form} extra={extra} />
    )

    detail = (
      <Overlay title="Pedido" isWide={isWide} wide onClose={() => setOpen(null)}>
        {isWide ? (
          // Os dados ficam parados à esquerda; só a anamnese rola.
          <div className="grid h-[min(64dvh,560px)] grid-cols-2 gap-7">
            <div className="overflow-y-auto pr-1">{left}</div>
            <div className="overflow-y-auto pr-2">{right}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 pb-2">
            {left}
            <hr className="border-line" />
            {right}
          </div>
        )}
      </Overlay>
    )
  }

  /* ---------- computador: quadro ---------- */

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className={`font-display text-ink ${isWide ? 'text-[2rem]' : 'text-[1.6rem]'}`}>
        Pedidos
      </h1>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={showCancelled}
          onChange={(e) => setShowCancelled(e.target.checked)}
          className="size-4 accent-[var(--admin)]"
        />
        Mostrar cancelados
      </label>
    </div>
  )
  const empty = !list.length && (
    <p className="rounded-[18px] border border-dashed border-line p-8 text-center text-ink-muted">
      Ainda não há pedidos. Eles aparecem aqui quando alguém escolhe a terapia e vai pagar.
    </p>
  )

  if (isWide) {
    const columns: OrderStatus[] = showCancelled ? [...STATUS_FLOW, 'cancel'] : [...STATUS_FLOW]
    return (
      <div className="mx-auto flex w-full max-w-[1280px] animate-[page-in_400ms_ease-out] flex-col gap-4 px-7 py-6">
        {header}
        {empty || (
          <div
            className="grid gap-3 overflow-x-auto pb-2"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(190px, 1fr))` }}
          >
            {columns.map((status) => {
              const inColumn = list.filter((o) => o.status === status)
              return (
                <section
                  key={status}
                  aria-label={STATUS_LABELS[status]}
                  className="flex min-h-[420px] flex-col gap-2 rounded-2xl bg-surface-2 p-2.5"
                >
                  <h2 className="flex items-center justify-between px-1 pb-1">
                    <StatusPill status={status} />
                    <span className="text-xs text-ink-faint">{inColumn.length}</span>
                  </h2>
                  {inColumn.map(card)}
                </section>
              )
            })}
          </div>
        )}
        {detail}
      </div>
    )
  }

  /* ---------- celular: por dia ---------- */

  const shown = list
    .filter((o) => showCancelled || o.status !== 'cancel')
    .sort((a, b) =>
      `${whenOf(a).date}${whenOf(a).start}`.localeCompare(`${whenOf(b).date}${whenOf(b).start}`),
    )
  const days = [...new Set(shown.map((o) => whenOf(o).date))]
  return (
    <div className="flex animate-[page-in_400ms_ease-out] flex-col gap-4 p-4">
      {header}
      {empty}
      {days.map((date) => (
        <section key={date} aria-label={longDate(date)} className="flex flex-col gap-2">
          <h2 className="text-[11px] tracking-[0.14em] text-ink-faint uppercase">
            {longDate(date)}
          </h2>
          {shown
            .filter((o) => whenOf(o).date === date)
            .map((order) => (
              <button
                key={`${order.uid}-${order.id}`}
                type="button"
                onClick={() => openOrder(order)}
                className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface px-3.5 py-3 text-left"
              >
                <span className="flex items-center justify-between gap-3">
                  <b className="text-ink">
                    {timeLabel(whenOf(order).start)} · {order.name || 'Sem nome'}
                  </b>
                  <UiIcon name="next" size={16} />
                </span>
                <span className="flex items-center justify-between gap-3 text-sm text-ink-faint">
                  <span className="truncate">{order.therapyName}</span>
                  <StatusPill status={order.status} />
                </span>
              </button>
            ))}
        </section>
      ))}
      {detail}
    </div>
  )
}
