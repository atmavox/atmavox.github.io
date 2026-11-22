import type { DayStatus } from '../../application/JourneyEditor'

const TEXT: Record<DayStatus, { short: string; long: string }> = {
  draft: { short: 'Rascunho', long: 'Rascunho · alterações não salvas' },
  saved: { short: 'Salvo · falta publicar', long: 'Salvo · falta publicar' },
  published: { short: 'Salvo', long: 'Salvo' },
}

interface StatusTagProps {
  status: DayStatus
  long?: boolean
  /** Alinhamento vem de quem usa (no cartão do quadro, `self-start` para não esticar). */
  className?: string
}

/** Etiqueta com bolinha: laranja para rascunho, verde para salvo (como no protótipo). */
export function StatusTag({ status, long, className = '' }: StatusTagProps) {
  const color = status === 'draft' ? 'bg-draft/10 text-draft' : 'bg-ok/12 text-ok'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${color} ${className}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {long ? TEXT[status].long : TEXT[status].short}
    </span>
  )
}
