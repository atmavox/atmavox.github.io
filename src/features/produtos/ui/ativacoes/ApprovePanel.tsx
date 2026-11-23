import { useState } from 'react'
import {
  fromMinutes,
  isTime,
  releaseBooking,
  slotsFor,
  timeLabel,
  toMinutes,
  type Availability,
} from '../../../../shared/ativacao/availability'
import type { SessionOrder, Slot } from '../../../../shared/ativacao/order'
import { adminButton, ghostButton, inputClass } from '../styles'

const slotOf = (date: string, start: string, durationMin: number): Slot => ({
  date,
  start,
  end: fromMinutes(toMinutes(start) + durationMin),
})

/**
 * Aprovar o horário (mock aprovado, A): o que a pessoa prefere, se ainda estiver livre, ou outro da
 * agenda. O horário fica reservado por 24 h esperando a pessoa confirmar pelo link.
 */
export function ApprovePanel({
  order,
  availability,
  isSaving,
  onApprove,
  onCancel,
}: {
  order: SessionOrder
  availability: Availability
  isSaving: boolean
  onApprove: (slot: Slot) => void
  onCancel: () => void
}) {
  // A reserva do próprio pedido não conta como ocupada (trocar o horário).
  const others = releaseBooking(availability, order.id)
  const therapy = { id: order.therapyId, durationMin: order.durationMin }
  const freeOn = (date: string) => slotsFor(others, therapy, date, date)[0]?.starts ?? []
  const preferredFree = freeOn(order.preference.date).includes(order.preference.start)

  const [choice, setChoice] = useState<'preferido' | 'outro'>(preferredFree ? 'preferido' : 'outro')
  const [date, setDate] = useState(order.preference.date)
  const [start, setStart] = useState('')
  const starts = freeOn(date)
  const chosen =
    choice === 'preferido'
      ? slotOf(order.preference.date, order.preference.start, order.durationMin)
      : isTime(start) && date
        ? slotOf(date, start, order.durationMin)
        : null

  return (
    <div className="flex animate-[page-in_300ms_ease-out] flex-col gap-3 rounded-2xl border border-admin-ink/45 bg-bg p-3.5">
      <b className="text-ink">Aprovar o horário</b>
      <label
        className={`flex items-start gap-2.5 text-sm ${preferredFree ? 'cursor-pointer' : 'opacity-60'}`}
      >
        <input
          type="radio"
          name={`horario-${order.id}`}
          checked={choice === 'preferido'}
          disabled={!preferredFree}
          onChange={() => setChoice('preferido')}
          className="mt-0.5 accent-[var(--admin)]"
        />
        <span>
          O que a pessoa prefere: <b className="font-medium">{timeLabel(order.preference.start)}</b>{' '}
          do dia {order.preference.date.split('-').reverse().join('/')}
          {!preferredFree && (
            <span className="block text-ink-faint">já não está livre na agenda</span>
          )}
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input
          type="radio"
          name={`horario-${order.id}`}
          checked={choice === 'outro'}
          onChange={() => setChoice('outro')}
          className="mt-0.5 accent-[var(--admin)]"
        />
        Outro horário
      </label>
      {choice === 'outro' && (
        <div className="flex flex-col gap-2.5 pl-6">
          <label className="flex flex-col gap-1 text-sm text-ink-muted">
            Dia
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setStart('')
              }}
              className={inputClass}
            />
          </label>
          {starts.length ? (
            <div role="radiogroup" aria-label="Horário livre" className="flex flex-wrap gap-1.5">
              {starts.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={start === s}
                  onClick={() => setStart(s)}
                  className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${
                    start === s
                      ? 'border-transparent bg-admin text-on-admin'
                      : 'border-line hover:border-admin-ink'
                  }`}
                >
                  {timeLabel(s)}
                </button>
              ))}
            </div>
          ) : (
            <label className="flex flex-col gap-1 text-sm text-ink-muted">
              Sem horário livre na agenda nesse dia. Escreva o horário combinado:
              <input
                type="time"
                step={1800}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={inputClass}
              />
            </label>
          )}
        </div>
      )}
      <p className="text-[13px] text-ink-faint">
        O horário fica reservado por 24 h. A pessoa confirma pelo link que vai na mensagem; se não
        confirmar, ele volta a ficar livre.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!chosen || isSaving}
          onClick={() => chosen && onApprove(chosen)}
          className={`${adminButton} flex-1`}
        >
          {isSaving ? 'Salvando…' : 'Aprovar e reservar'}
        </button>
        <button type="button" onClick={onCancel} className={ghostButton}>
          Voltar
        </button>
      </div>
    </div>
  )
}
