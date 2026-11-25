import { ArrowRight } from 'lucide-react'
import { UiIcon } from './UiIcon'

/**
 * Link antigo de um produto Indisponível, para quem não tem mais acesso (mock aprovado, "Tirar do
 * ar" 4A): os anéis, o termo, uma frase curta e o caminho para o que está no ar.
 */
export function RetiredNotice({
  title,
  kind,
  className = '',
}: {
  title: string
  kind: 'journey' | 'meditation'
  className?: string
}) {
  const isJourney = kind === 'journey'
  return (
    <div
      className={`flex animate-[page-in_400ms_ease-out] flex-col items-center justify-center gap-4 px-6 py-20 text-center motion-reduce:animate-none ${className}`}
    >
      <span className="relative grid size-20 place-items-center rounded-full border border-line text-ink-faint">
        <span
          aria-hidden="true"
          className="absolute -inset-2.5 rounded-full border border-line/60"
        />
        <UiIcon name="moonset" size={30} />
      </span>
      <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">Indisponível</p>
      <h1 className="font-display text-3xl text-ink">{title} saiu do ar</h1>
      <p className="max-w-md text-ink-muted">
        {isJourney ? 'Esta jornada' : 'Esta meditação'} cumpriu o ciclo dela por aqui. Há outras
        esperando por você.
      </p>
      <a
        href={isJourney ? '#/jornadas' : '#/meditacoes'}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg transition-opacity hover:opacity-90"
      >
        {isJourney ? 'Ver as jornadas' : 'Ver as meditações'}
        <ArrowRight aria-hidden size={18} />
      </a>
    </div>
  )
}
