import { useId, useState, type ReactNode } from 'react'
import { UiIcon } from './UiIcon'

/**
 * O "i" informativo (pedido de 2026-11-25): a explicação aparece ao passar o mouse, ao focar com o
 * teclado ou ao tocar no celular, e some ao sair, tocar fora ou apertar Esc. Tira da tela os textos de
 * ajuda que só precisam ser lidos uma vez.
 */
export function InfoTip({
  children,
  label = 'Mais informações',
}: {
  children: ReactNode
  label?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const id = useId()
  return (
    <span
      className="relative inline-flex align-middle"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        aria-expanded={isOpen}
        // No toque, o mouse e o foco já abriram: o clique não pode fechar de novo. Fecha ao tocar fora.
        onClick={() => setIsOpen(true)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setIsOpen(false)
        }}
        className="grid size-6 place-items-center rounded-full text-ink-faint transition-colors duration-200 hover:text-admin-ink focus-visible:text-admin-ink motion-reduce:transition-none"
      >
        <UiIcon name="info" size={16} />
      </button>
      <span
        role="tooltip"
        id={id}
        className={`absolute top-full left-0 z-30 mt-1.5 w-[min(18rem,calc(100vw-3rem))] rounded-xl border border-line bg-bg px-3 py-2.5 text-left text-xs leading-relaxed font-normal tracking-normal text-ink-muted normal-case shadow-[0_12px_30px_rgb(20_14_10/0.18)] transition-opacity duration-150 motion-reduce:transition-none ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {children}
      </span>
    </span>
  )
}
