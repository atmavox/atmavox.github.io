import { portrait } from '../content'

interface PortraitProps {
  /** Largura em que a foto aparece, para o navegador escolher o arquivo certo (atributo `sizes`). */
  sizes: string
  className?: string
}

/** O retrato da Andreía no topo do hub. É a primeira imagem da página: carrega com prioridade. */
export function Portrait({ sizes, className = '' }: PortraitProps) {
  return (
    <img
      src={portrait.src}
      srcSet={portrait.srcSet}
      sizes={sizes}
      width={portrait.width}
      height={portrait.height}
      alt={portrait.alt}
      fetchPriority="high"
      className={`aspect-[4/3] w-full rounded-3xl border border-line object-cover object-[50%_25%] ${className}`}
    />
  )
}
