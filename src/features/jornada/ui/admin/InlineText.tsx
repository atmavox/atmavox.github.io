import { useLayoutEffect, useRef } from 'react'

interface InlineTextProps {
  value: string
  onChange: (value: string) => void
  /** Nome do campo para leitores de tela (o rótulo visível é o próprio texto). */
  label: string
  placeholder?: string
  className?: string
  /** Uma linha só (títulos); sem isso, o campo cresce com o texto. */
  singleLine?: boolean
  onBlur?: () => void
  /** Largura do próprio texto (rótulos com uma linha ao lado), em vez da largura toda. */
  fit?: boolean
}

const base =
  'rounded-md bg-transparent outline-none placeholder:text-ink-faint hover:bg-admin/10 focus:bg-admin/10'

/**
 * "Clique em qualquer texto para editar": o campo tem a cara do texto que a participante vê e só
 * revela que é editável ao passar o mouse ou focar (fundo azul do Modo Andreía).
 */
export function InlineText({
  value,
  onChange,
  label,
  placeholder,
  className = '',
  singleLine,
  onBlur,
  fit,
}: InlineTextProps) {
  const width = fit ? 'w-auto min-w-8 [field-sizing:content]' : 'w-full'
  const ref = useRef<HTMLTextAreaElement>(null)

  // Cresce com o texto, sem barra de rolagem dentro do bloco.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  if (singleLine) {
    return (
      <input
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`${base} ${width} ${className}`}
      />
    )
  }
  return (
    <textarea
      ref={ref}
      aria-label={label}
      value={value}
      rows={1}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      className={`${base} ${width} resize-none overflow-hidden ${className}`}
    />
  )
}
