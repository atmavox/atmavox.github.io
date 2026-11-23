import { portrait } from '../content'

interface PortraitProps {
  /** Largura em que a foto aparece, para o navegador escolher o arquivo certo (atributo `sizes`). */
  sizes: string
  className?: string
  /**
   * Repetição mais abaixo na página (em "A Ativadora"): carrega sem pressa e fica decorativa, porque o
   * nome dela aparece logo ao lado.
   */
  secondary?: boolean
}

/** O retrato da Andreía. No topo é a primeira imagem da página: carrega com prioridade. */
export function Portrait({ sizes, className = '', secondary = false }: PortraitProps) {
  return (
    <img
      src={portrait.src}
      srcSet={portrait.srcSet}
      sizes={sizes}
      width={portrait.width}
      height={portrait.height}
      alt={secondary ? '' : portrait.alt}
      loading={secondary ? 'lazy' : undefined}
      fetchPriority={secondary ? 'auto' : 'high'}
      className={`aspect-[4/3] w-full rounded-3xl border border-line object-cover object-[50%_25%] ${className}`}
    />
  )
}
