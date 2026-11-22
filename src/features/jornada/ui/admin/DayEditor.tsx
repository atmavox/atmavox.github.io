import { ArrowDown, ArrowLeft, ArrowUp, Copy, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { dayStatus, type EditorState, type JourneyEditor } from '../../application/JourneyEditor'
import type { DaySection, JourneyDay } from '../../domain/journey'
import {
  createSection,
  dayProblems,
  duplicateSection,
  insertSection,
  moveSection,
  removeSection,
  replaceSection,
} from '../../domain/journeyEditing'
import { Field } from './Field'
import { AddBlockMenu } from './AddBlockMenu'
import { SectionFields } from './SectionFields'
import { SECTION_META } from './sectionMeta'
import { StatusChip } from './StatusChip'

const newSuffix = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

const iconButton =
  'grid size-8 place-items-center rounded-full text-ink-muted hover:bg-accent/10 hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent'

interface BlockProps {
  section: DaySection
  index: number
  total: number
  onChange: (section: DaySection) => void
  onMove: (delta: number) => void
  onDuplicate: () => void
  onRemove: () => void
}

function Block({ section, index, total, onChange, onMove, onDuplicate, onRemove }: BlockProps) {
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false)
  const { name, icon: Icon } = SECTION_META[section.type]
  const where = `bloco ${index + 1} (${name})`

  return (
    <li className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-accent/12 text-accent">
          <Icon aria-hidden size={16} />
        </span>
        <span className="text-sm font-medium text-ink">{name}</span>
        <span className="ml-auto flex items-center">
          <button
            type="button"
            className={iconButton}
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label={`Subir ${where}`}
          >
            <ArrowUp aria-hidden size={16} />
          </button>
          <button
            type="button"
            className={iconButton}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label={`Descer ${where}`}
          >
            <ArrowDown aria-hidden size={16} />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={onDuplicate}
            aria-label={`Duplicar ${where}`}
          >
            <Copy aria-hidden size={16} />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => setIsConfirmingRemove(true)}
            aria-label={`Remover ${where}`}
          >
            <Trash2 aria-hidden size={16} />
          </button>
        </span>
      </div>

      {isConfirmingRemove && (
        <div
          role="alert"
          className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-wine/50 bg-wine/10 p-3 text-sm text-ink"
        >
          Remover este bloco? (O que as pessoas já escreveram nele fica guardado.)
          <span className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full bg-accent px-3 py-1 font-medium text-bg"
            >
              Remover
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingRemove(false)}
              className="rounded-full border border-line px-3 py-1 text-ink-muted"
            >
              Cancelar
            </button>
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <SectionFields section={section} onChange={onChange} />
      </div>
    </li>
  )
}

interface DayEditorProps {
  editor: JourneyEditor
  state: EditorState
  day: JourneyDay
  position: number
  onBack: () => void
}

/** Editar no lugar: o dia inteiro numa página, bloco a bloco, com "Salvar dia" e "Descartar". */
export function DayEditor({ editor, state, day, position, onBack }: DayEditorProps) {
  const status = dayStatus(state, day.number)
  const problems = dayProblems(day)
  const update = (next: JourneyDay) => editor.editDay(next)
  const total = day.sections.length

  return (
    <div className="flex flex-col gap-6 py-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 self-start text-sm text-ink-muted hover:text-accent"
      >
        <ArrowLeft aria-hidden size={16} /> Todos os dias
      </button>

      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl text-ink">Dia {position}</h1>
          <StatusChip status={status} />
        </div>
        <Field
          label="Título do dia"
          value={day.title}
          onChange={(title) => update({ ...day, title })}
        />
        <Field
          label="Subtítulo"
          value={day.subtitle}
          onChange={(subtitle) => update({ ...day, subtitle })}
        />
      </header>

      <ol aria-label="Blocos do dia" className="flex flex-col gap-4">
        {day.sections.map((section, index) => (
          <Block
            key={section.id}
            section={section}
            index={index}
            total={total}
            onChange={(next) => update(replaceSection(day, index, next))}
            onMove={(delta) => update(moveSection(day, index, delta))}
            onDuplicate={() =>
              update(
                insertSection(day, index + 1, duplicateSection(section, day.number, newSuffix())),
              )
            }
            onRemove={() => update(removeSection(day, index))}
          />
        ))}
      </ol>

      <AddBlockMenu
        onAdd={(type) =>
          update(insertSection(day, total, createSection(type, day.number, newSuffix())))
        }
      />

      <footer className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
        {status === 'draft' && problems.length > 0 && (
          <ul aria-label="O que falta para salvar" className="text-sm text-wine">
            {problems.map((problem) => (
              <li key={problem}>• {problem}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={status !== 'draft' || problems.length > 0 || state.isBusy}
            onClick={() => void editor.saveDay(day.number)}
            className="min-h-10 rounded-full bg-accent px-5 text-sm font-semibold text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.isBusy ? 'Salvando…' : 'Salvar dia'}
          </button>
          {status === 'draft' && (
            <button
              type="button"
              onClick={() => editor.discardDay(day.number)}
              className="min-h-10 rounded-full border border-line px-5 text-sm text-ink-muted hover:border-accent hover:text-accent"
            >
              Descartar alterações
            </button>
          )}
          {state.message && (
            <p role="status" className="text-sm text-ink-muted">
              {state.message}
            </p>
          )}
        </div>
      </footer>
    </div>
  )
}
