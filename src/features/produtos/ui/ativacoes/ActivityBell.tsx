import { useCallback, useEffect, useRef, useState } from 'react'
import { useLatest } from '../../../../shared/lib/useLatest'
import { useNow } from '../../../../shared/lib/useNow'
import { UiIcon, type UiIconName } from '../../../../shared/ui/UiIcon'
import {
  activityFeed,
  dayHeading,
  isUnseen,
  keepMarks,
  unseenCount,
  type ActivityEvent,
  type ActivityKind,
  type WindowLog,
} from '../../domain/activity'
import type { ActivityRead, AtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import type { SessionOrder } from '../../../../shared/ativacao/order'
import { Overlay } from './Overlay'

/** De quanto em quanto tempo o sino busca novidades com a tela aberta. */
const REFRESH_MS = 3 * 60 * 1000

/** Quanto o mouse precisa parar numa movimentação para ela contar como lida (passar por cima não). */
const HOVER_READ_MS = 500

/** A largura do painel (26rem) e a folga mínima até a borda da janela. */
const PANEL_WIDTH_PX = 416
const EDGE_PX = 12

const TIME = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

const KIND_STYLE: Record<ActivityKind, { icon: UiIconName; tone: string }> = {
  new: { icon: 'inbox', tone: 'bg-admin/14 text-admin-ink' },
  paid: { icon: 'card', tone: 'bg-ok/14 text-ok' },
  requested: { icon: 'calendar', tone: 'bg-accent/14 text-accent' },
  proposed: { icon: 'check', tone: 'bg-ink/7 text-ink-muted' },
  confirmed: { icon: 'calendar', tone: 'bg-ok/14 text-ok' },
  done: { icon: 'check', tone: 'bg-ink/7 text-ink-muted' },
  cancelled: { icon: 'close', tone: 'bg-gray-state/14 text-ink-faint' },
  expired: { icon: 'clock', tone: 'bg-gray-state/14 text-ink-faint' },
  'hold-expired': { icon: 'clock', tone: 'bg-gray-state/14 text-ink-faint' },
  window: { icon: 'pen', tone: 'bg-ink/7 text-ink-muted' },
}

function EventRow({
  event,
  isNew,
  onToggle,
  onHoverRead,
}: {
  event: ActivityEvent
  isNew: boolean
  onToggle: () => void
  /** Parou o mouse em cima: conta como lida (se ela não deixou como lembrete). */
  onHoverRead: () => void
}) {
  const style = KIND_STYLE[event.kind]
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const link = event.orderId
    ? { href: `#/admin/ativacoes/pedidos/${event.orderId}`, label: 'Abrir o pedido' }
    : { href: '#/admin/ativacoes/agenda', label: 'Ver na agenda' }
  return (
    <li
      onMouseEnter={() => {
        if (!isNew) return
        timer.current = window.setTimeout(onHoverRead, HOVER_READ_MS)
      }}
      onMouseLeave={() => window.clearTimeout(timer.current)}
      className={`grid grid-cols-[32px_1fr_auto] items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors duration-300 motion-reduce:transition-none ${
        isNew ? 'bg-accent/8' : ''
      }`}
    >
      <span className={`grid size-8 place-items-center rounded-[10px] ${style.tone}`}>
        <UiIcon name={style.icon} size={15} />
      </span>
      <div className="min-w-0 text-sm leading-snug">
        <p className="text-ink">
          <b className="font-semibold">{event.who}</b> {event.text}
          {isNew && <span className="sr-only"> (não lida)</span>}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
          <span>{event.detail}</span>
          <a href={link.href} className="font-semibold text-admin-ink hover:underline">
            {link.label} →
          </a>
        </p>
      </div>
      <span className="flex flex-col items-end gap-1.5 pt-0.5">
        <span className="text-xs whitespace-nowrap text-ink-faint">{TIME.format(event.at)}</span>
        {/* Lida ou não lida, uma a uma: a não lida fica como lembrete (pedido de 2026-11-25). */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={isNew ? 'Marcar como lida' : 'Marcar como não lida'}
          title={isNew ? 'Marcar como lida' : 'Marcar como não lida'}
          className="grid size-5 place-items-center rounded-full transition-colors hover:bg-field"
        >
          <span
            aria-hidden="true"
            className={`size-2 rounded-full border transition-colors ${
              isNew ? 'border-accent bg-accent' : 'border-ink-faint/60 bg-transparent'
            }`}
          />
        </button>
      </span>
    </li>
  )
}

function Feed({
  feed,
  isNew,
  onToggle,
  onHoverRead,
  now,
}: {
  feed: readonly ActivityEvent[]
  isNew: (event: ActivityEvent) => boolean
  onToggle: (event: ActivityEvent) => void
  onHoverRead: (event: ActivityEvent) => void
  now: number
}) {
  if (feed.length === 0) {
    return <p className="px-2 py-6 text-center text-sm text-ink-faint">Nada nos últimos 60 dias.</p>
  }
  const groups: { day: string; events: ActivityEvent[] }[] = []
  for (const event of feed) {
    const day = dayHeading(event.at, now)
    const last = groups.at(-1)
    if (last?.day === day) last.events.push(event)
    else groups.push({ day, events: [event] })
  }
  return (
    <div className="flex flex-col">
      {groups.map((group) => (
        <section key={group.day} aria-label={group.day}>
          <h3 className="flex items-center gap-2 px-1 pt-3 pb-1.5 text-[11px] font-semibold tracking-[0.18em] text-ink-faint uppercase after:h-px after:flex-1 after:bg-line">
            {group.day}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {group.events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                isNew={isNew(event)}
                onToggle={() => onToggle(event)}
                onHoverRead={() => onHoverRead(event)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

const NOTHING_READ: ActivityRead = { seenAt: null, marks: {} }

/**
 * O sino das movimentações recentes (mock aprovado, opção C, 2026-11-25; ADR-037): o número conta o
 * que ainda está por ver. Abrir mostra a lista (painel no computador, folha de baixo no celular). Uma
 * movimentação fica lida ao parar o mouse em cima ou pelo botão da linha, que também a deixa como não
 * lida (lembrete); a caixinha do topo marca todas. Tudo fica na conta dela.
 */
export function ActivityBell({
  backend,
  uid,
  isWide,
  onUnreadOrders,
}: {
  backend: AtivacoesBackend
  /** A admin logada: o que ela já viu fica na conta dela. */
  uid: string | null
  isWide: boolean
  /** Avisa se há movimentação de pedido por ler (a bolinha na aba Pedidos). */
  onUnreadOrders?: (hasUnread: boolean) => void
}) {
  const now = useNow()
  const wrapRef = useRef<HTMLDivElement>(null)
  // Para onde o painel cresce: para a direita (a área vazia) quando cabe; senão, para a esquerda.
  const [opensRight, setOpensRight] = useState(true)
  const [data, setData] = useState<{ orders: SessionOrder[]; logs: WindowLog[] } | null>(null)
  const [read, setRead] = useState<ActivityRead>(NOTHING_READ)
  // O mouse marca depois de meio segundo: vale o que estiver salvo nessa hora, não no começo.
  const latestRead = useLatest(read)
  const [isOpen, setIsOpen] = useState(false)

  const load = useCallback(
    () =>
      Promise.all([backend.listOrders(), backend.listActivity().catch(() => [])]).then(
        ([orders, logs]) => ({ orders, logs }),
      ),
    [backend],
  )
  const refresh = useCallback(
    () =>
      load()
        .then(setData)
        .catch(() => undefined),
    [load],
  )

  useEffect(() => {
    let cancelled = false
    void load()
      .then((loaded) => {
        if (!cancelled) setData(loaded)
      })
      .catch(() => undefined)
    if (uid) {
      void backend
        .loadActivityRead(uid)
        .then((saved) => {
          if (!cancelled) setRead(saved)
        })
        .catch(() => undefined)
    }
    const timer = window.setInterval(() => void refresh(), REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [backend, load, refresh, uid])

  const feed = data ? activityFeed(data.orders, data.logs, now) : []
  const count = data ? unseenCount(feed, read.seenAt, now, read.marks) : 0
  const isNew = (event: ActivityEvent) => isUnseen(event, read.seenAt, now, read.marks)
  const hasUnreadOrders = feed.some((e) => e.orderId !== undefined && isNew(e))
  useEffect(() => onUnreadOrders?.(hasUnreadOrders), [hasUnreadOrders, onUnreadOrders])

  function save(next: ActivityRead) {
    const kept = { ...next, marks: keepMarks(next.marks, feed) }
    setRead(kept)
    if (uid) void backend.saveActivityRead(uid, kept).catch(() => undefined)
  }
  /** A caixinha do topo: marcada, tudo lido até agora; desmarcada, tudo dos últimos 60 dias por ver. */
  const markAll = (asRead: boolean) => save({ seenAt: asRead ? Date.now() : 0, marks: {} })
  const toggle = (event: ActivityEvent) =>
    save({ ...read, marks: { ...read.marks, [event.id]: isNew(event) } })
  // O lembrete (não lida de propósito) não some só porque o mouse passou por cima.
  const hoverRead = (event: ActivityEvent) => {
    const current = latestRead.current
    if (
      current.marks[event.id] === undefined &&
      isUnseen(event, current.seenAt, Date.now(), current.marks)
    ) {
      save({ ...current, marks: { ...current.marks, [event.id]: true } })
    }
  }

  const close = useCallback(() => setIsOpen(false), [])

  // Computador: clicar fora do sino e do painel, ou apertar Esc, fecha (o celular usa a folha).
  useEffect(() => {
    if (!isOpen || !isWide) return
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, isWide, close])

  function open() {
    const box = wrapRef.current?.getBoundingClientRect()
    if (box) setOpensRight(box.left + PANEL_WIDTH_PX <= window.innerWidth - EDGE_PX)
    setIsOpen(true)
    void refresh()
  }

  const allRead = (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted select-none">
      <input
        type="checkbox"
        checked={count === 0}
        disabled={feed.length === 0}
        onChange={(e) => markAll(e.target.checked)}
        className="size-4 accent-[var(--admin)]"
      />
      Marcar tudo como lido
    </label>
  )

  const title = 'Movimentações'
  const list = data ? (
    <Feed feed={feed} isNew={isNew} onToggle={toggle} onHoverRead={hoverRead} now={now} />
  ) : (
    <p className="px-2 py-6 text-center text-sm text-ink-faint">Carregando…</p>
  )

  return (
    // O painel abre embaixo do sino, para o lado com espaço, e nunca passa da largura da tela.
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => (isOpen ? close() : open())}
        aria-expanded={isOpen}
        aria-label={
          count > 0 ? `${title}: ${count} ${count === 1 ? 'novidade' : 'novidades'}` : title
        }
        className="relative grid size-9 place-items-center rounded-full border border-line bg-surface text-ink-muted transition-colors hover:border-admin hover:text-admin-ink"
      >
        <UiIcon name="bell" size={17} />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-accent px-1 text-[10.5px] font-bold text-bg"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      {isOpen &&
        (isWide ? (
          <div
            role="dialog"
            aria-label={title}
            className={`absolute top-full z-40 mt-2 flex w-[min(26rem,calc(100vw-1.5rem))] ${opensRight ? 'left-0' : 'right-0'} animate-[fade-in_200ms_ease-out] flex-col rounded-2xl border border-line bg-bg p-3 shadow-[0_24px_60px_rgb(20_14_10/0.25)] motion-reduce:animate-none`}
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <b className="text-xs font-semibold tracking-[0.2em] text-admin-ink uppercase">
                {title}
              </b>
              <span className="ml-auto">{allRead}</span>
              <button
                type="button"
                aria-label="Fechar"
                onClick={close}
                className="grid size-6 place-items-center rounded-full text-ink-faint transition-colors hover:bg-field hover:text-ink"
              >
                <UiIcon name="close" size={13} />
              </button>
            </div>
            <div className="max-h-[min(70dvh,560px)] overflow-x-hidden overflow-y-auto pr-1">
              {list}
            </div>
          </div>
        ) : (
          <Overlay title={title} isWide={false} onClose={close}>
            <div className="flex justify-end">{allRead}</div>
            {list}
          </Overlay>
        ))}
    </div>
  )
}
