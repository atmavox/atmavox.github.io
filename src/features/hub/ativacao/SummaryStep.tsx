import type { ReactNode } from 'react'
import { longDate, timeLabel } from '../../../shared/ativacao/availability'
import { durationLabel, type Therapy } from '../../../shared/ativacao/therapy'
import { formatPrice } from '../../../shared/catalog/offer'
import { TherapyIcon } from '../../../shared/ui/TherapyIcon'
import { UiIcon, type UiIconName } from '../../../shared/ui/UiIcon'
import type { Preference } from './DateStep'

function Block({
  icon,
  label,
  value,
  onEdit,
}: {
  icon: ReactNode
  label: string
  value: string
  onEdit: () => void
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-4 py-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] text-ink-faint">{label}</span>
        <b className="block font-medium text-ink">{value}</b>
      </span>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Editar ${label.toLowerCase()}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        <UiIcon name="pen" size={15} />
        <span className="hidden sm:inline">Editar</span>
      </button>
    </div>
  )
}

const icon = (name: UiIconName) => <UiIcon name={name} size={19} />

/** Resumo (mock aprovado, B): cada bloco com "Editar" e o total ao lado (no celular, embaixo). */
export function SummaryStep({
  therapy,
  preference,
  answered,
  onEdit,
  isWide,
}: {
  therapy: Therapy
  preference: Preference
  answered: number
  onEdit: (step: 1 | 2 | 3) => void
  isWide: boolean
}) {
  const blocks = (
    <div className="flex flex-col gap-3">
      <Block
        icon={icon('file')}
        label="Anamnese"
        value={`${answered} respostas`}
        onEdit={() => onEdit(1)}
      />
      <Block
        icon={<TherapyIcon name={therapy.icon} size={19} />}
        label="Terapia"
        value={`${therapy.name} · ${durationLabel(therapy.durationMin)}`}
        onEdit={() => onEdit(2)}
      />
      <Block
        icon={icon('calendar')}
        label="Data que você prefere"
        value={`${longDate(preference.date)}, às ${timeLabel(preference.start)}`}
        onEdit={() => onEdit(3)}
      />
    </div>
  )
  const privacy = (
    <p className="flex items-center gap-2 text-[13px] text-ink-faint">
      <UiIcon name="lock" size={15} />
      Suas respostas ficam só na sua conta.
    </p>
  )

  if (!isWide) {
    return (
      <div className="flex flex-col gap-3.5">
        <h2 className="font-display text-[1.6rem] text-ink">Revise o seu pedido</h2>
        {blocks}
        {privacy}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-[1.4fr_1fr] items-start gap-5">
      <div className="flex flex-col gap-3">
        <h2 className="mb-1 font-display text-[1.6rem] text-ink">Revise o seu pedido</h2>
        {blocks}
      </div>
      <div className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-surface p-5">
        <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Total</p>
        <b className="font-display text-[2.1rem] font-medium text-ink">
          {formatPrice(therapy.priceCents)}
        </b>
        <p className="text-[13px] text-ink-faint">
          Pagamento único pelo Mercado Pago, com Pix ou cartão.
        </p>
        {privacy}
      </div>
    </div>
  )
}
