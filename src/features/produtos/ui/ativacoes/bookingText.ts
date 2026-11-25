import type { Booking } from '../../../../shared/ativacao/availability'
import { proposalOpen, type SessionOrder } from '../../../../shared/ativacao/order'

/** Em que pé está a reserva, em poucas palavras (aparece ao passar o mouse e na ficha). */
export function bookingState(order: SessionOrder | undefined, now: number): string {
  if (!order) return 'Reservado'
  if (order.status === 'sched') return 'Confirmado pela pessoa'
  if (order.status === 'done') return 'Sessão feita'
  if (proposalOpen(order, now)) return 'Esperando a pessoa confirmar'
  return 'Reservado'
}

/** Quem reservou, numa linha: o nome ou, sem o pedido carregado, o código. */
export function bookingWho(booking: Booking, order: SessionOrder | undefined): string {
  if (order?.name) return order.name
  return booking.orderId ? `Pedido ${booking.orderId}` : 'Reservado'
}
