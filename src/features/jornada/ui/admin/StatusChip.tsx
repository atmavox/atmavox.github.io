import type { DayStatus } from '../../application/JourneyEditor'

const CHIP: Record<DayStatus, { text: string; className: string }> = {
  draft: { text: 'Rascunho', className: 'border-wine/60 bg-wine/10 text-wine' },
  saved: { text: 'Salvo · falta publicar', className: 'border-gold/60 bg-gold/10 text-gold' },
  published: { text: 'No ar', className: 'border-accent/50 bg-accent/10 text-accent' },
}

export function StatusChip({ status }: { status: DayStatus }) {
  const { text, className } = CHIP[status]
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {text}
    </span>
  )
}
