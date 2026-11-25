import {
  CLOSING_BACKDROP,
  CLOSING_DIALOG,
  CLOSING_SHEET,
  useClosing,
} from '../../../shared/ui/useClosing'
import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { DEFAULT_ANAMNESIS, type AnamnesisForm } from '../../../shared/ativacao/anamnesis'
import type { Answer, SavedAnamnesis } from '../../../shared/ativacao/answers'
import { longDate, timeLabel } from '../../../shared/ativacao/availability'
import { DEFAULT_MESSAGES, fillMessage, type Messages } from '../../../shared/ativacao/messages'
import {
  proposalOpen,
  STATUS_FLOW,
  STATUS_LABELS,
  statusTimes,
  visibleOrders,
  type OrderStatus,
  type SessionOrder,
} from '../../../shared/ativacao/order'
import {
  DEFAULT_THERAPIES,
  MODALITY_LABELS,
  durationLabel,
  type Therapy,
} from '../../../shared/ativacao/therapy'
import { useAuthSession } from '../../../shared/auth/AuthContext'
import { WHATSAPP_PHONE } from '../../../shared/brand/links'
import { paymentsUrl, requestCheckout } from '../../../shared/catalog/checkout'
import { formatPrice } from '../../../shared/catalog/offer'
import { readFirebaseConfig } from '../../../shared/firebase/config'
import { useNow } from '../../../shared/lib/useNow'
import { buildWhatsAppLink } from '../../../shared/lib/whatsapp'
import { TherapyBadge } from '../../../shared/ui/TherapyIcon'
import { UiIcon } from '../../../shared/ui/UiIcon'
import { SocialIcon } from '../components/SocialIcon'
import {
  createInMemoryAtivacaoSource,
  createRestAtivacaoSource,
  type AtivacaoSource,
} from './ativacaoSource'
import { LoadingNote } from '../../../shared/ui/LoadingNote'

const STATUS_CLASS: Record<OrderStatus, string> = {
  wait: 'bg-draft/13 text-draft',
  paid: 'bg-accent/13 text-accent',
  req: 'bg-gold/15 text-gold',
  sched: 'bg-[color-mix(in_oklab,var(--admin-ink)_13%,transparent)] text-admin-ink',
  done: 'bg-ok/13 text-ok',
  cancel: 'bg-ink/8 text-ink-faint',
}

function Pill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_CLASS[status]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  )
}

const when = (ms: number) =>
  new Date(ms).toLocaleString('pt-BR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })

const slotOf = (order: SessionOrder) =>
  order.scheduled ?? order.proposed ?? { ...order.preference, end: '' }

function answerText(answer: Answer): string {
  if (Array.isArray(answer)) return answer.join(', ')
  if (typeof answer === 'number') return `${answer} de 10`
  if (answer === 'sim') return 'Sim'
  if (answer === 'nao') return 'Não'
  if (/^\d{4}-\d{2}-\d{2}$/.test(answer)) return answer.split('-').reverse().join('/')
  return answer
}

function AnamnesisDialog({
  saved,
  form,
  isWide,
  onClose,
}: {
  saved: SavedAnamnesis | null
  form: AnamnesisForm
  isWide: boolean
  onClose: () => void
}) {
  const titleId = useId()
  const { isClosing, requestClose } = useClosing(onClose)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [requestClose])
  const rows = form.sections
    .flatMap((s) => s.questions)
    .filter((q) => saved?.answers[q.id] !== undefined)
  return createPortal(
    <div
      className={`fixed inset-0 z-40 ${isClosing ? CLOSING_BACKDROP : 'animate-[fade-in_250ms_ease-out]'} bg-black/45 ${isWide ? 'grid place-items-center p-6' : ''}`}
    >
      {/* O fundo fecha a janela (clicar fora); o botão "Fechar" é o caminho acessível. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={requestClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex flex-col gap-4 overflow-y-auto border border-line bg-surface p-6 ${
          isWide
            ? `relative max-h-[88dvh] w-full max-w-[560px] ${isClosing ? CLOSING_DIALOG : 'animate-[dialog-in_320ms_ease-out]'} rounded-3xl`
            : `absolute inset-x-0 bottom-0 max-h-[88dvh] ${isClosing ? CLOSING_SHEET : 'animate-[sheet-up_360ms_ease-out]'} rounded-t-[26px]`
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="text-xs font-semibold tracking-[0.24em] text-accent uppercase"
            >
              Um pouco sobre mim
            </h2>
            {saved?.updatedAt ? (
              <p className="text-sm text-ink-faint">Respondida em {when(saved.updatedAt)}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Fechar"
            className="grid size-9 place-items-center rounded-full bg-field text-ink-muted hover:text-ink"
          >
            <UiIcon name="close" size={17} />
          </button>
        </div>
        {rows.length ? (
          rows.map((q) => (
            <div key={q.id} className="flex flex-col border-b border-line pb-3 last:border-0">
              <span className="text-sm text-ink-faint">{q.label}</span>
              <span className="whitespace-pre-line text-ink">
                {answerText(saved!.answers[q.id]!)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-ink-muted">
            Você ainda não respondeu às perguntas de "Um pouco sobre mim".
          </p>
        )}
        <a
          href="#/ativacao"
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full border border-line px-5 text-ink-muted hover:border-accent hover:text-ink"
        >
          <UiIcon name="pen" size={15} />
          Atualizar respostas
        </a>
      </div>
    </div>,
    document.body,
  )
}

/**
 * Perfil · Ativações (mock aprovado, A): um cartão por pedido; clicar abre as etapas na vertical e os
 * detalhes. "Ver minhas respostas" em cada cartão e a próxima ação (pagar, avisar, confirmar, conversar).
 */
export default function ActivationsTab({
  isWide,
  source: injected,
  workerUrl = paymentsUrl(import.meta.env),
  redirect = (url) => window.location.assign(url),
}: {
  isWide: boolean
  source?: AtivacaoSource
  workerUrl?: string | null
  redirect?: (url: string) => void
}) {
  const { session, state } = useAuthSession()
  const uid = state?.user?.uid ?? null
  const now = useNow()
  const source = useMemo<AtivacaoSource>(() => {
    if (injected) return injected
    const config = readFirebaseConfig(import.meta.env)
    if (!config || !session) return createInMemoryAtivacaoSource()
    return createRestAtivacaoSource(config, () => session.getIdToken())
  }, [injected, session])

  const [orders, setOrders] = useState<SessionOrder[] | null>(null)
  const [therapies, setTherapies] = useState<readonly Therapy[]>(DEFAULT_THERAPIES)
  const [form, setForm] = useState<AnamnesisForm>(DEFAULT_ANAMNESIS)
  const [saved, setSaved] = useState<SavedAnamnesis | null>(null)
  const [messages, setMessages] = useState<Messages>(DEFAULT_MESSAGES)
  const [open, setOpen] = useState<string | null>(null)
  const [isAnamnesisOpen, setIsAnamnesisOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) return
    let cancelled = false
    void Promise.all([
      source.listMyOrders(uid).catch(() => null),
      source.loadTherapies().catch(() => null),
      source.loadAnamnesis().catch(() => null),
      source.loadMyAnamnesis(uid).catch(() => null),
      source.loadMessages().catch(() => DEFAULT_MESSAGES),
    ]).then(([list, ts, f, mine, msgs]) => {
      if (cancelled) return
      if (list === null) setNotice('Não deu para carregar os seus pedidos agora.')
      const shown = visibleOrders(list ?? [], Date.now())
      setOrders(shown)
      setOpen(shown[0]?.id ?? null)
      if (ts?.length) setTherapies(ts)
      if (f) setForm(f)
      setSaved(mine)
      setMessages(msgs)
    })
    return () => {
      cancelled = true
    }
  }, [uid, source])

  if (!uid) return null
  if (!orders) return <LoadingNote className="text-ink-muted" />

  const newActivation = (
    <a
      href="#/ativacao"
      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-bg hover:opacity-90"
    >
      <UiIcon name="plus" size={16} />
      Nova ativação
    </a>
  )

  if (!orders.length) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line p-6">
        {notice && <p className="text-sm text-accent">{notice}</p>}
        <p className="text-ink-muted">Você ainda não agendou uma ativação individual.</p>
        {newActivation}
      </div>
    )
  }

  async function pay(order: SessionOrder) {
    if (!workerUrl || !session) return
    const result = await requestCheckout({
      workerUrl,
      orderId: order.id,
      idToken: await session.getIdToken(),
    })
    if (result.kind === 'redirect') redirect(result.url)
    else setNotice('Não deu para abrir o pagamento agora. Tente de novo em instantes.')
  }

  function notify(order: SessionOrder) {
    setOrders((all) =>
      all!.map((o) => (o.id === order.id ? { ...o, status: 'req', requestedAt: Date.now() } : o)),
    )
    void source.markRequested(uid!, order.id).catch(() => {})
  }

  const action = (order: SessionOrder) => {
    const talk = buildWhatsAppLink(WHATSAPP_PHONE)
    const button =
      'inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-opacity hover:opacity-90'
    if (order.status === 'wait') {
      return workerUrl ? (
        <button
          type="button"
          onClick={() => void pay(order)}
          className={`${button} bg-accent text-bg`}
        >
          Pagar {formatPrice(order.priceCents)}
        </button>
      ) : null
    }
    if (order.status === 'paid') {
      const text = fillMessage(messages.paid, {
        nome: order.name,
        apelido: order.name.split(' ')[0] ?? '',
        terapia: order.therapyName,
        data: longDate(order.preference.date).toLowerCase(),
        hora: timeLabel(order.preference.start),
        pedido: order.id,
        link: '',
      })
      return (
        <a
          href={buildWhatsAppLink(WHATSAPP_PHONE, text)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => notify(order)}
          className={`${button} bg-accent text-bg`}
        >
          <SocialIcon id="whatsapp" size={15} />
          Avisar a Andreía
        </a>
      )
    }
    if (order.status === 'req' && proposalOpen(order, now)) {
      return (
        <a href={`#/ativacao/confirmar/${order.id}`} className={`${button} bg-accent text-bg`}>
          <UiIcon name="check" size={15} />
          Confirmar horário
        </a>
      )
    }
    if (order.status === 'req' || order.status === 'sched') {
      return (
        <a
          href={talk}
          target="_blank"
          rel="noopener noreferrer"
          className={`${button} border border-line text-ink`}
        >
          <SocialIcon id="whatsapp" size={15} />
          Abrir conversa
        </a>
      )
    }
    if (order.status === 'done')
      return <span className="text-sm text-ink-faint">Obrigada por esse encontro</span>
    return null
  }

  const hint = (order: SessionOrder): string => {
    if (order.status === 'wait') return 'Falta o pagamento. Sem ele, o pedido some em 2 dias.'
    if (order.status === 'paid') return 'Pago. Falta avisar a Andreía no WhatsApp.'
    if (order.status === 'req') {
      return proposalOpen(order, now)
        ? 'A Andreía aprovou um horário: confirme para garantir.'
        : 'Mensagem enviada. Aguardando a resposta da Andreía.'
    }
    if (order.status === 'sched') return 'Horário confirmado.'
    if (order.status === 'done') return 'Sessão feita.'
    return 'Pedido cancelado.'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-faint">
          {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
        </span>
        {newActivation}
      </div>
      {notice && <p className="text-sm text-accent">{notice}</p>}
      {orders.map((order) => {
        const t = therapies.find((x) => x.id === order.therapyId)
        const isOpen = open === order.id
        const slot = slotOf(order)
        const times = statusTimes(order)
        const current = order.status === 'cancel' ? -1 : STATUS_FLOW.indexOf(order.status)
        return (
          <article
            key={order.id}
            className={`overflow-hidden rounded-[18px] border bg-surface transition-[border-color,box-shadow] duration-300 ${
              isOpen ? 'border-accent/45 shadow-[0_10px_30px_rgb(20_14_10/0.08)]' : 'border-line'
            }`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : order.id)}
              className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left"
            >
              {t ? <TherapyBadge icon={t.icon} tone={t.tone} size={isWide ? 46 : 40} /> : null}
              <span className="min-w-0 flex-1">
                <b className="block leading-snug font-semibold text-ink">{order.therapyName}</b>
                <span className="text-sm text-ink-faint">
                  Pedido {order.id} · {longDate(slot.date)}, {timeLabel(slot.start)}
                </span>
                {!isWide && (
                  <span className="mt-1.5 block">
                    <Pill status={order.status} />
                  </span>
                )}
              </span>
              {isWide && <Pill status={order.status} />}
              <span
                className={`text-ink-faint transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
              >
                <UiIcon name="next" size={18} />
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <div
                  className={`grid gap-6 border-t border-dashed border-line px-4 py-4 ${isWide ? 'grid-cols-2' : ''}`}
                >
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
                      Etapas do pedido
                    </p>
                    <ol className="flex flex-col">
                      {STATUS_FLOW.map((status, i) => {
                        const state =
                          i < current || order.status === 'done'
                            ? 'done'
                            : i === current
                              ? 'current'
                              : 'next'
                        return (
                          <li
                            key={status}
                            className={`relative grid grid-cols-[14px_1fr] gap-3 pb-4 text-sm last:pb-0 ${
                              state === 'current'
                                ? 'font-semibold text-ink'
                                : state === 'done'
                                  ? 'text-ink-muted'
                                  : 'text-ink-faint'
                            }`}
                          >
                            {i < STATUS_FLOW.length - 1 && (
                              <span
                                aria-hidden="true"
                                className={`absolute top-4 bottom-0 left-[6px] w-0.5 ${state === 'done' ? 'bg-ok' : 'bg-line'}`}
                              />
                            )}
                            <span
                              aria-hidden="true"
                              className={`relative z-[1] mt-1 size-3.5 rounded-full border-2 ${
                                state === 'done'
                                  ? 'border-ok bg-ok'
                                  : state === 'current'
                                    ? 'border-accent bg-accent'
                                    : 'border-line bg-bg'
                              }`}
                            />
                            <span>
                              {STATUS_LABELS[status]}
                              {times[status] && (
                                <small className="block font-normal text-ink-faint">
                                  {when(times[status]!)}
                                </small>
                              )}
                            </span>
                          </li>
                        )
                      })}
                    </ol>
                    <p className="text-sm text-ink-muted">{hint(order)}</p>
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
                      Detalhes
                    </p>
                    {[
                      ['Terapia', order.therapyName],
                      ...(t ? [['Modalidade', MODALITY_LABELS[t.modality]]] : []),
                      ['Duração', durationLabel(order.durationMin)],
                      [
                        order.scheduled ? 'Data' : 'Data que prefere',
                        `${longDate(slot.date)}, às ${timeLabel(slot.start)}`,
                      ],
                      ['Valor', formatPrice(order.chargedCents ?? order.priceCents)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <span className="text-ink-faint">{label}</span>
                        <b className="text-right font-medium text-ink">{value}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5">
              <button
                type="button"
                onClick={() => setIsAnamnesisOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
              >
                <UiIcon name="file" size={15} />
                Ver minhas respostas
              </button>
              {action(order)}
            </div>
          </article>
        )
      })}
      {isAnamnesisOpen && (
        <AnamnesisDialog
          saved={saved}
          form={form}
          isWide={isWide}
          onClose={() => setIsAnamnesisOpen(false)}
        />
      )}
    </div>
  )
}
