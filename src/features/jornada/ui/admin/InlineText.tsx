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
// lápis ao lado (opção B). O fundo azul é só do campo; o lápis, sem fundo, fica mais forte e com mais
// cor ao passar o mouse ou editar. Vazio, o campo ganha fundo azul claro e o exemplo em itálico.
const fieldBase =
  'rounded-r-md border-l-[3px] border-admin-ink/45 bg-transparent pl-2 pr-1 outline-none transition-colors duration-200 placeholder:text-admin-ink/75 placeholder:italic group-hover/inline:border-admin-ink group-hover/inline:bg-admin/10 focus:border-admin-ink focus:bg-admin/10'
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
  const look = `${fieldBase} ${value.trim() === '' ? empty : ''} ${width} ${className}`
  const ref = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /** Clicar no lápis leva o cursor para o fim do texto (o fundo azul vem do foco do campo). */
  function focusField() {
    const field = singleLine ? inputRef.current : ref.current
    if (!field) return
    field.focus()
    const end = field.value.length
    field.setSelectionRange(end, end)
  }

  // Cresce com o texto, sem barra de rolagem dentro do bloco.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  // Fora da ordem do Tab (o próprio campo já recebe o foco); o mouse não tira o foco ao clicar.
  const pen = (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      onMouseDown={(event) => event.preventDefault()}
      onClick={focusField}
      className={`grid shrink-0 cursor-text place-items-center p-0.5 text-admin-ink opacity-50 transition-opacity duration-200 group-focus-within/inline:opacity-100 group-hover/inline:opacity-100 [&_svg]:transition-[stroke-width] [&_svg]:duration-200 group-focus-within/inline:[&_svg]:[stroke-width:2] group-hover/inline:[&_svg]:[stroke-width:2] ${
        singleLine ? '' : 'mt-0.5'
      }`}
    >
      <EditorIcon name="pen" size={15} />
    </button>
  )

  return (
    <span
      className={`group/inline ${fit ? 'inline-flex' : 'flex w-full'} min-w-0 ${
        singleLine ? 'items-center' : 'items-start'
      } gap-1.5`}
    >
      {singleLine ? (
        <input
          ref={inputRef}
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
