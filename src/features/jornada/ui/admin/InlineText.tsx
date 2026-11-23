import { useLayoutEffect, useRef } from 'react'
import { EditorIcon } from './EditorIcon'

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

// Mock aprovado (`Downloads/atmavox-campos-editaveis.html`): a faixa azul à esquerda (opção D) com o
// lápis ao lado (opção B). Vazio, ganha fundo azul claro e o exemplo em itálico.
const base =
  'rounded-r-md border-l-[3px] border-admin-ink/45 bg-transparent pl-2 pr-1 outline-none transition-colors duration-200 placeholder:text-admin-ink/75 placeholder:italic hover:border-admin-ink hover:bg-admin/10 focus:border-admin-ink focus:bg-admin/10'
const empty = 'bg-admin/8'

/**
 * "Clique em qualquer texto para editar": o campo tem a cara do texto que a participante vê, com a
 * faixa azul do Modo Andreía e um lápis que mostram que dá para escrever ali.
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
  const width = fit ? 'w-auto min-w-8 [field-sizing:content]' : 'w-full min-w-0 flex-1'
  const look = `${base} ${value.trim() === '' ? empty : ''} ${width} ${className}`
  const ref = useRef<HTMLTextAreaElement>(null)

  // Cresce com o texto, sem barra de rolagem dentro do bloco.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const pen = (
    <span
      aria-hidden="true"
      className={`shrink-0 text-admin-ink opacity-55 transition-opacity duration-200 group-hover/inline:opacity-100 group-focus-within/inline:opacity-100 ${
        singleLine ? '' : 'mt-1'
      }`}
    >
      <EditorIcon name="pen" size={15} />
    </span>
  )

  return (
    <span
      className={`group/inline ${fit ? 'inline-flex' : 'flex w-full'} min-w-0 ${
        singleLine ? 'items-center' : 'items-start'
      } gap-1.5`}
    >
      {singleLine ? (
        <input
          aria-label={label}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={look}
        />
      ) : (
        <textarea
          ref={ref}
          aria-label={label}
          value={value}
          rows={1}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={`${look} resize-none overflow-hidden`}
        />
      )}
      {pen}
    </span>
  )
}
