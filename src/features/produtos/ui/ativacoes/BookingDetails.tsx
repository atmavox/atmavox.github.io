import { whatsAppDigits } from '../../../../shared/ativacao/answers'
import { longDate, timeLabel, type Booking } from '../../../../shared/ativacao/availability'
import {
  HOLD_MS,
  isTestOrder,
  proposalOpen,
  type SessionOrder,
} from '../../../../shared/ativacao/order'
import { buildWhatsAppLink } from '../../../../shared/lib/whatsapp'
import { UiIcon } from '../../../../shared/ui/UiIcon'
import { adminButton, ghostButton } from '../styles'
import { TestTag } from '../TestTag'
import { bookingState, bookingWho } from './bookingText'
import { Overlay } from './Overlay'

const hourOf = (millis: number) =>
  new Date(millis).toLocaleString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

/** A ficha de um horário reservado na agenda: quem é, qual terapia, em que pé está e o que fazer. */
export function BookingDetails({
  booking,
  order,
  now,
  isWide,
  onClose,
}: {
  booking: Booking
  order: SessionOrder | undefined
  now: number
  isWide: boolean
  onClose: () => void
}) {
  const digits = order ? whatsAppDigits(order.phone) : null
  const firstName = order?.name.split(' ')[0] ?? ''
  const waiting = order && proposalOpen(order, now) && order.proposedAt !== null

  return (
    <Overlay
      title="Horário reservado"
      isWide={isWide}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {digits && (
            <a
              href={buildWhatsAppLink(digits, `Oi, ${firstName}! Aqui é a Andreía, da Atmavox.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ghostButton} ${isWide ? '' : 'flex-1'}`}
            >
              <UiIcon name="chat" size={16} />
              WhatsApp
            </a>
          )}
          {booking.orderId && (
            <a
              href={`#/admin/ativacoes/pedidos/${encodeURIComponent(booking.orderId)}`}
              className={`${adminButton} ${isWide ? '' : 'flex-1'}`}
            >
              Abrir o pedido
            </a>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <b className="text-lg text-ink">{bookingWho(booking, order)}</b>
            {order && isTestOrder(order) && <TestTag />}
          </span>
          {order?.therapyName && <span className="text-ink-muted">{order.therapyName}</span>}
        </div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[0.95rem]">
          <dt className="text-ink-faint">Quando</dt>
          <dd className="text-ink">
            {longDate(booking.date)}, {timeLabel(booking.start)} às {timeLabel(booking.end)}
          </dd>
          <dt className="text-ink-faint">Situação</dt>
          <dd className="text-ink">
            {bookingState(order, now)}
            {waiting && (
              <span className="block text-sm text-ink-faint">
                Se não confirmar até {hourOf(order.proposedAt! + HOLD_MS)}, o horário volta a ficar
                livre.
              </span>
            )}
          </dd>
          {order?.phone && (
            <>
              <dt className="text-ink-faint">Celular</dt>
              <dd className="text-ink">{order.phone}</dd>
            </>
          )}
          {booking.orderId && (
            <>
              <dt className="text-ink-faint">Pedido</dt>
              <dd className="text-ink">{booking.orderId}</dd>
            </>
          )}
        </dl>
      </div>
    </Overlay>
  )
}
