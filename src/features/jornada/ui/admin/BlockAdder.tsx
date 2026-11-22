import { useCallback, useEffect, useRef, useState } from 'react'
import { ADDABLE_SECTION_TYPES, type AddableSectionType } from '../../domain/journeyEditing'
import type { SectionType } from '../../domain/journey'
import { EditorIcon } from './EditorIcon'
import { PICKER_ORDER, SECTION_META } from './sectionMeta'
import { useEscape } from './useEscape'

const isAddable = (type: SectionType): type is AddableSectionType =>
  (ADDABLE_SECTION_TYPES as readonly SectionType[]).includes(type)

/**
 * O "+" entre dois blocos: aparece ao passar o mouse (ou ao chegar pelo teclado) e abre o menu
 * "Adicionar bloco" com os ladrilhos de ícones próprios.
 */
export function BlockAdder({ onAdd }: { onAdd: (type: AddableSectionType) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setIsOpen(false), [])
  useEscape(isOpen, close)

  useEffect(() => {
    if (!isOpen) return
    wrapperRef.current?.querySelector<HTMLButtonElement>('[data-tile]')?.focus()
    const onPointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [isOpen])

  return (
    <div ref={wrapperRef} className="group/adder relative flex h-4 items-center justify-center">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 border-t border-dashed border-transparent group-hover/adder:border-admin/40"
      />
      <button
        type="button"
        aria-label="Adicionar bloco aqui"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`relative grid size-6.5 place-items-center rounded-full border border-admin-ink bg-bg text-admin-ink transition-opacity group-hover/adder:opacity-100 focus-visible:opacity-100 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <EditorIcon name="plus" size={16} />
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 mt-2 w-105 max-w-[calc(100vw-24px)] rounded-2xl border border-line bg-surface p-3.5 shadow-[0_14px_40px_rgb(0_0_0/0.16)]">
          <p className="mb-2.5 text-[13px] text-ink-faint">Adicionar bloco</p>
          <ul className="grid grid-cols-3 gap-2">
            {PICKER_ORDER.map((type) => {
              const { name, about } = SECTION_META[type]
              const addable = isAddable(type)
              return (
                <li key={type}>
                  <button
                    type="button"
                    data-tile
                    disabled={!addable}
                    onClick={() => {
                      if (!addable) return
                      onAdd(type)
                      setIsOpen(false)
                    }}
                    className="group/tile flex h-full w-full flex-col items-center gap-1.5 rounded-2xl border border-line bg-bg px-2 pt-3 pb-2.5 text-center text-[13px] text-ink transition-colors hover:border-admin-ink hover:bg-admin/10 hover:text-admin-ink focus-visible:border-admin-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line disabled:hover:bg-bg disabled:hover:text-ink"
                  >
                    <span className="text-accent group-hover/tile:text-admin-ink group-disabled/tile:text-accent">
                      <EditorIcon name={type} size={26} />
                    </span>
                    <span>{name}</span>
                    <small className="text-[11px] leading-tight text-ink-faint">
                      {addable ? about : 'em breve'}
                    </small>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
