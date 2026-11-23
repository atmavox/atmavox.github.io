import { useEffect, useState } from 'react'
import { longDate, timeLabel } from '../../../shared/ativacao/availability'
import { DEFAULT_MESSAGES, fillMessage, type Messages } from '../../../shared/ativacao/messages'
import type { SessionOrder } from '../../../shared/ativacao/order'
import { WHATSAPP_PHONE } from '../../../shared/brand/links'
import { buildWhatsAppLink } from '../../../shared/lib/whatsapp'
import { UiIcon } from '../../../shared/ui/UiIcon'
import { SocialIcon } from '../components/SocialIcon'
import type { OrderReturn } from '../navigation'
import type { AtivacaoSource } from './ativacaoSource'
import { FlowShell } from './FlowShell'

const primary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg transition-opacity hover:opacity-90'

/** Quantas vezes conferir de novo enquanto o aviso do Mercado Pago não chega (a cada 4 s). */
const MAX_TRIES = 6

/**
 * Volta do pagamento (mock aprovado, A): check grande, número do pedido, "falta só um passo" e a
 * mensagem pronta. Avisar no WhatsApp passa o pedido para Solicitada.
 */
export function PaidStep({
  uid,
  orderReturn,
  source,
  isWide,
  onClose,
  onRetry,
}: {
  uid: string
  orderReturn: OrderReturn
  source: AtivacaoSource
  isWide: boolean
  onClose: () => void
  onRetry: (orderId: string) => void
}) {
  const [order, setOrder] = useState<SessionOrder | null | undefined>(undefined)
  const [tries, setTries] = useState(0)
  const [messages, setMessages] = useState<Messages>(DEFAULT_MESSAGES)

  useEffect(() => {
    let cancelled = false
    void source
      .loadMessages()
      .catch(() => DEFAULT_MESSAGES)
      .then((loaded) => {
        if (!cancelled) setMessages(loaded)
      })
    return () => {
      cancelled = true
    }
  }, [source])

  useEffect(() => {
    let cancelled = false
    void source
      .getOrder(uid, orderReturn.orderId)
      .catch(() => null)
      .then((found) => {
        if (!cancelled) setOrder(found)
      })
    return () => {
      cancelled = true
    }
  }, [source, uid, orderReturn.orderId, tries])

  // O aviso do pagamento pode chegar uns segundos depois da volta: confere de novo sozinho.
  const isWaiting = order?.status === 'wait' && orderReturn.status !== 'recusado'
  useEffect(() => {
    if (!isWaiting || tries >= MAX_TRIES) return
    const timer = setTimeout(() => setTries((t) => t + 1), 4000)
    return () => clearTimeout(timer)
  }, [isWaiting, tries])

  const isPaid = order && ['paid', 'req', 'sched', 'done'].includes(order.status)
  const message = order
    ? fillMessage(messages.paid, {
        nome: order.name,
        apelido: order.name.split(' ')[0] ?? '',
        terapia: order.therapyName,
        data: longDate(order.preference.date).toLowerCase(),
        hora: timeLabel(order.preference.start),
        pedido: order.id,
        link: '',
      })
    : ''
  const link = buildWhatsAppLink(WHATSAPP_PHONE, message)

  function notify() {
    if (order?.status !== 'paid') return
    setOrder({ ...order, status: 'req' })
    void source.markRequested(uid, order.id).catch(() => {})
  }

  let body
  if (order === undefined) {
    body = <p className="text-ink-muted">Conferindo o pagamento…</p>
  } else if (!order) {
    body = <p className="text-ink-muted">Não achamos este pedido. Confira no seu perfil.</p>
  } else if (isPaid) {
    const bubble = (
      <div className="flex flex-col gap-2 rounded-[18px] bg-surface-2 p-4">
        <span className="flex items-center gap-2 text-[13px] text-ink-faint">
          <SocialIcon id="whatsapp" size={15} />
          Mensagem que será enviada
        </span>
        <p className="rounded-2xl rounded-br-sm bg-[color-mix(in_oklab,var(--ok)_14%,var(--surface))] px-3.5 py-3 text-sm leading-relaxed whitespace-pre-line text-ink">
          {message}
        </p>
      </div>
    )
    body = (
      <div
        className={isWide ? 'grid h-full grid-cols-2 items-center gap-7' : 'flex flex-col gap-4'}
      >
        <div className="flex flex-col items-start gap-3">
          <span className="grid size-16 animate-[dialog-in_500ms_ease-out] place-items-center rounded-full bg-ok text-bg">
            <UiIcon name="check" size={32} />
          </span>
          <h3 className="font-display text-[1.9rem] text-ink">Pagamento confirmado</h3>
          <p className="text-ink-muted">
            {order.status === 'paid'
              ? 'Falta só um passo: avisar a Andreía. Ela aprova o horário com você por lá.'
              : 'Mensagem enviada. Agora é com a Andreía: ela responde pelo WhatsApp.'}
          </p>
        </div>
        {bubble}
      </div>
    )
  } else if (order.status === 'cancel') {
    body = <p className="text-ink-muted">Este pedido foi cancelado.</p>
  } else if (orderReturn.status === 'recusado') {
    body = (
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-[1.6rem] text-ink">O pagamento não foi aprovado</h3>
        <p className="text-ink-muted">
          Nada foi cobrado. Você pode tentar de novo, com Pix ou cartão.
        </p>
      </div>
    )
  } else {
    body = (
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-[1.6rem] text-ink">Estamos confirmando o pagamento</h3>
        <p className="text-ink-muted">
          {tries >= MAX_TRIES
            ? 'Está demorando mais que o normal. Pix e cartão costumam confirmar em minutos; você também acompanha pelo seu perfil.'
            : 'Leva só alguns segundos.'}
        </p>
      </div>
    )
  }

  const footer = isPaid ? (
    <div className="flex items-center justify-between gap-3">
      {isWide && (
        <a href="#/perfil/ativacoes" className="text-sm text-ink-faint hover:text-ink">
          Ver minhas ativações
        </a>
      )}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={notify}
        className={`${primary} ${isWide ? '' : 'flex-1'}`}
      >
        <SocialIcon id="whatsapp" size={17} />
        {order?.status === 'paid' ? 'Avisar a Andreía no WhatsApp' : 'Abrir a conversa'}
      </a>
    </div>
  ) : order && order.status === 'wait' ? (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => setTries((t) => t + 1)}
        className="text-sm text-ink-faint hover:text-ink"
      >
        Conferir de novo
      </button>
      {orderReturn.status === 'recusado' && (
        <button type="button" onClick={() => onRetry(order.id)} className={primary}>
          Tentar de novo
        </button>
      )}
    </div>
  ) : (
    <a href="#/perfil/ativacoes" className={primary}>
      Ver minhas ativações
    </a>
  )

  return (
    <FlowShell
      isWide={isWide}
      current={isPaid ? 5 : 4}
      order={orderReturn.orderId}
      bodyKey={`pago-${order?.status ?? 'carregando'}`}
      footer={footer}
      onClose={onClose}
    >
      {body}
    </FlowShell>
  )
}
