import { useEffect, useState } from 'react'
import { addDays, longDate, timeLabel } from '../../../shared/ativacao/availability'
import { HOLD_MS, proposalOpen, type SessionOrder } from '../../../shared/ativacao/order'
import { whatsAppMessage } from '../../../shared/brand/links'
import { UiIcon } from '../../../shared/ui/UiIcon'
import { SocialIcon } from '../components/SocialIcon'
import type { AtivacaoSource } from './ativacaoSource'
import { FlowShell } from './FlowShell'
import { LoadingNote } from '../../../shared/ui/LoadingNote'

const primary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50'

/** "até amanhã, 19h" ou "até 5 de dezembro, 19h". */
function deadline(proposedAt: number, now: number): string {
  const end = new Date(proposedAt + HOLD_MS)
  const day = new Date(now)
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const hour = `${end.getHours()}h${end.getMinutes() ? String(end.getMinutes()).padStart(2, '0') : ''}`
  if (iso(end) === iso(day)) return `até hoje, ${hour}`
  if (iso(end) === addDays(iso(day), 1)) return `até amanhã, ${hour}`
  return `até ${end.getDate()} de ${end.toLocaleDateString('pt-BR', { month: 'long' })}, ${hour}`
}

/**
 * O link que a Andreía manda (mock aprovado, B): "A Andreía aprovou o seu horário" e "Confirmar este
 * horário". Confirmado, o pedido vira Agendada.
 */
export function ConfirmStep({
  uid,
  orderId,
  source,
  isWide,
  now,
  onClose,
}: {
  uid: string
  orderId: string
  source: AtivacaoSource
  isWide: boolean
  now: number
  onClose: () => void
}) {
  const [order, setOrder] = useState<SessionOrder | null | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void source
      .getOrder(uid, orderId)
      .catch(() => null)
      .then((found) => {
        if (!cancelled) setOrder(found)
      })
    return () => {
      cancelled = true
    }
  }, [source, uid, orderId])

  async function confirm() {
    if (!order) return
    setIsSaving(true)
    setError(null)
    try {
      await source.confirmProposal(uid, order)
      setOrder({ ...order, status: 'sched', scheduled: order.proposed, scheduledAt: Date.now() })
    } catch {
      setError('Não deu para confirmar agora. A reserva pode ter vencido; fale com a Andreía.')
    } finally {
      setIsSaving(false)
    }
  }

  const slot = order?.status === 'sched' ? order.scheduled : order?.proposed
  const canConfirm = !!order && proposalOpen(order, now)
  const askOther = whatsAppMessage(
    `Sobre o pedido ${orderId}: prefiro outro horário. Podemos combinar?`,
  )

  let body
  if (order === undefined) body = <LoadingNote className="text-ink-muted" />
  else if (!order || !slot) {
    body = (
      <p className="text-ink-muted">
        Este link não tem um horário para confirmar. Confira o pedido no seu perfil ou fale com a
        Andreía.
      </p>
    )
  } else {
    body = (
      <div className="flex flex-col gap-4">
        {order.status === 'sched' ? (
          <>
            <span className="grid size-16 animate-[dialog-in_500ms_ease-out] place-items-center rounded-full bg-ok text-bg">
              <UiIcon name="check" size={32} />
            </span>
            <h3 className="font-display text-[1.9rem] text-ink">Horário confirmado</h3>
          </>
        ) : (
          <h3 className="font-display text-[1.9rem] text-ink">A Andreía aprovou o seu horário</h3>
        )}
        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-bg p-4">
          <span className="grid size-11 place-items-center rounded-xl bg-surface-2 text-accent">
            <UiIcon name="calendar" size={20} />
          </span>
          <span>
            <b className="block font-semibold text-ink">{order.therapyName}</b>
            <span className="text-ink-muted">
              {longDate(slot.date)}, às {timeLabel(slot.start)}
            </span>
          </span>
        </div>
        {order.status !== 'sched' &&
          (canConfirm && order.proposedAt ? (
            <p className="text-sm text-ink-faint">
              Reservado para você {deadline(order.proposedAt, now)}.
            </p>
          ) : (
            <p className="text-sm text-accent">
              A reserva venceu. Fale com a Andreía para combinar de novo.
            </p>
          ))}
        {error && <p className="text-sm text-accent">{error}</p>}
      </div>
    )
  }

  const footer =
    order && slot && order.status !== 'sched' ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href={askOther}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          <SocialIcon id="whatsapp" size={15} />
          Prefiro outro horário
        </a>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={!canConfirm || isSaving}
          className={`${primary} ${isWide ? '' : 'w-full'}`}
        >
          <UiIcon name="check" size={16} />
          {isSaving ? 'Confirmando…' : 'Confirmar este horário'}
        </button>
      </div>
    ) : (
      <a href="#/perfil/ativacoes" className={primary}>
        Ver minhas ativações
      </a>
    )

  return (
    <FlowShell
      isWide={isWide}
      current={6}
      order={orderId}
      bodyKey={`confirmar-${order?.status ?? 'carregando'}`}
      footer={footer}
      onClose={onClose}
    >
      {body}
    </FlowShell>
  )
}
