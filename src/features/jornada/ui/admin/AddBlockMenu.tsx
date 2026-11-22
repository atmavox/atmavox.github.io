import { Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { ADDABLE_SECTION_TYPES, type AddableSectionType } from '../../domain/journeyEditing'
import { SECTION_META } from './sectionMeta'

/** "+ bloco": abre a lista de tipos, cada um com ícone, nome e o que faz. */
export function AddBlockMenu({ onAdd }: { onAdd: (type: AddableSectionType) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const listId = useId()

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-accent/60 px-4 py-1.5 text-sm text-accent hover:bg-accent/10"
      >
        <Plus aria-hidden size={15} /> bloco
      </button>
      {isOpen && (
        <ul
          id={listId}
          aria-label="Tipos de bloco"
          className="grid w-full grid-cols-1 gap-2 rounded-2xl border border-line bg-surface p-3 sm:grid-cols-2"
        >
          {ADDABLE_SECTION_TYPES.map((type) => {
            const { name, icon: Icon, about } = SECTION_META[type]
            return (
              <li key={type}>
                <button
                  type="button"
                  onClick={() => {
                    onAdd(type)
                    setIsOpen(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left hover:border-accent/40 hover:bg-accent/5"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/12 text-accent">
                    <Icon aria-hidden size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink">{name}</span>
                    <span className="block text-xs text-ink-faint">{about}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
