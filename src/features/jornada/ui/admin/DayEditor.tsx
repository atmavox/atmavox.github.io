import { useCallback, useState } from 'react'
import { dayStatus, type EditorState, type JourneyEditor } from '../../application/JourneyEditor'
import { allDays, structureOf, type DaySection, type JourneyDay } from '../../domain/journey'
import {
  canRemoveDay,
  createSection,
  dayProblems,
  duplicateSection,
  insertSection,
  moveSection,
  removeSection,
  replaceSection,
} from '../../domain/journeyEditing'
import { BlockAdder } from './BlockAdder'
import { BlockContent } from './BlockContent'
import { ConfirmDialog } from './ConfirmDialog'
import { EditorIcon, type EditorIconName } from './EditorIcon'
import { InlineText } from './InlineText'
import { SECTION_META } from './sectionMeta'
import { StatusTag } from './StatusTag'

const newSuffix = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

const btn =
  'inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink transition-colors hover:border-admin-ink disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-line'
const ghost =
  'inline-flex items-center gap-1 rounded-full border border-line px-3 py-2 text-sm text-ink hover:border-admin-ink disabled:opacity-30 disabled:hover:border-line'
const primary =
  'inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45'

interface ToolProps {
  icon: EditorIconName
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}

function Tool({ icon, label, onClick, disabled, danger }: ToolProps) {
  return (
    <button
      type="button"
      title={label.split(' ')[0]}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-7.5 place-items-center rounded-lg text-ink-muted disabled:opacity-30 ${
        danger ? 'hover:bg-wine/10 hover:text-wine' : 'hover:bg-admin/10 hover:text-admin-ink'
      }`}
    >
      <EditorIcon name={icon} size={16} />
    </button>
  )
}

interface DayEditorProps {
  editor: JourneyEditor
  state: EditorState
  day: JourneyDay
  onBack: () => void
  onOpenDay: (dayNumber: number) => void
}

/** Editar no lugar: o dia aparece como a participante vê, e cada texto se edita com um clique. */
export function DayEditor({ editor, state, day, onBack, onOpenDay }: DayEditorProps) {
  const status = dayStatus(state, day.number)
  const isDraft = status === 'draft'
  const problems = dayProblems(day)
  const days = allDays(state.working)
  const index = days.findIndex((d) => d.number === day.number)
  const position = index + 1
  const week = state.working.weeks.find((w) => w.days.some((d) => d.number === day.number))
  const structure = structureOf(state.working)
  // Por tema não há dias: a mesma tela edita o conteúdo do tema (o nome dele fica no quadro geral).
  const isTheme = structure === 'themes'
  const unit = isTheme ? 'tema' : 'dia'
  const where = isTheme
    ? `Tema ${position} · ${week?.theme ?? ''}`
    : structure === 'days'
      ? `Dia ${position}`
      : `${week ? `Semana ${week.roman} · ${week.theme} · ` : ''}Dia ${position}`
  const previous = days[index - 1]
  const next = days[index + 1]
  const update = (changed: JourneyDay) => editor.editDay(changed)
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false)
  const cancelRemove = useCallback(() => setIsConfirmingRemove(false), [setIsConfirmingRemove])
  const removable = canRemoveDay(state.working, day.number)
  const add = (at: number, type: Parameters<typeof createSection>[0]) => {
    update(insertSection(day, at, createSection(type, day.number, newSuffix())))
    editor.notify(`${SECTION_META[type].name} adicionado`)
  }

  return (
    <div className="mx-auto max-w-195 pt-0 pb-24">
      <div className="sticky top-13 z-30 mb-4 flex flex-wrap items-center gap-2.5 border-b border-line bg-bg py-2.5">
        <button type="button" onClick={onBack} className={ghost}>
          <EditorIcon name="back" /> {isTheme ? 'Todos os temas' : 'Todos os dias'}
        </button>
        <span className="flex-1" />
        <StatusTag status={status} long />
        <button
          type="button"
          disabled={!isDraft}
          onClick={() => {
            editor.discardDay(day.number)
            editor.notify('Alterações descartadas')
          }}
          className={btn}
        >
          Descartar alterações
        </button>
        <button
          type="button"
          disabled={!isDraft || problems.length > 0 || state.isBusy}
          onClick={() => void editor.saveDay(day.number)}
          className={primary}
        >
          <EditorIcon name="check" />{' '}
          {state.isBusy ? 'Salvando…' : isTheme ? 'Salvar tema' : 'Salvar dia'}
        </button>
        {isDraft && problems.length > 0 && (
          <ul aria-label="O que falta para salvar" className="w-full text-[13px] text-draft">
            {problems.map((problem) => (
              <li key={problem}>• {problem}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">{where}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={ghost}
            disabled={!previous}
            onClick={() => previous && onOpenDay(previous.number)}
            aria-label={isTheme ? 'Tema anterior' : 'Dia anterior'}
          >
            <EditorIcon name="back" />
          </button>
          <span className="text-sm text-ink-faint">
            {position} de {days.length}
          </span>
          <button
            type="button"
            className={ghost}
            disabled={!next}
            onClick={() => next && onOpenDay(next.number)}
            aria-label={isTheme ? 'Próximo tema' : 'Próximo dia'}
          >
            <EditorIcon name="next" />
          </button>
          {!isTheme && (
            <button
              type="button"
              className={`${ghost} hover:border-wine hover:text-wine`}
              disabled={!removable || state.isBusy}
              title={removable ? undefined : 'Cada semana precisa de pelo menos um dia'}
              onClick={() => setIsConfirmingRemove(true)}
            >
              <EditorIcon name="trash" size={16} /> Apagar dia
            </button>
          )}
        </div>
      </div>

      {isConfirmingRemove && (
        <ConfirmDialog
          title={`Apagar o Dia ${position}?`}
          confirmLabel="Apagar dia"
          danger
          onCancel={cancelRemove}
          onConfirm={() => {
            setIsConfirmingRemove(false)
            onBack()
            void editor.removeDay(day.number)
          }}
        >
          “{day.title}” sai da jornada quando você publicar. O que as participantes já escreveram
          nele fica guardado. Se mudar de ideia antes de publicar, use o Histórico para voltar à
          versão anterior.
        </ConfirmDialog>
      )}

      <article className="flex flex-col gap-1 rounded-[18px] border border-line bg-surface p-6">
        <div className="rounded-[14px] p-2">
          <div className="flex items-baseline gap-2">
            <span aria-hidden="true" className="font-display text-[34px] text-accent">
              {String(position).padStart(2, '0')}
            </span>
            {isTheme ? (
              <h1 className="font-display text-[26px] leading-tight text-ink">{week?.theme}</h1>
            ) : (
              <InlineText
                label="Título do dia"
                placeholder="Título do dia"
                value={day.title}
                onChange={(title) => update({ ...day, title })}
                className="font-display text-[26px] leading-tight text-ink"
              />
            )}
          </div>
          <InlineText
            label={`Subtítulo do ${unit}`}
            placeholder={`Subtítulo do ${unit}`}
            value={day.subtitle}
            onChange={(subtitle) => update({ ...day, subtitle })}
            className="mt-1.5 text-ink-muted"
          />
        </div>

        <BlockAdder onAdd={(type) => add(0, type)} />
        {day.sections.map((section, at) => (
          <div key={section.id}>
            <Block
              section={section}
              where={`bloco ${at + 1} (${SECTION_META[section.type].name})`}
              isFirst={at === 0}
              isLast={at === day.sections.length - 1}
              onChange={(changed) => update(replaceSection(day, at, changed))}
              onMove={(delta) => update(moveSection(day, at, delta))}
              onDuplicate={() => {
                update(
                  insertSection(day, at + 1, duplicateSection(section, day.number, newSuffix())),
                )
                editor.notify('Bloco duplicado')
              }}
              onUploadImage={(file) => editor.uploadImage(file)}
              onRemove={() => {
                update(removeSection(day, at))
                editor.notify('Bloco removido (respostas já escritas ficam guardadas)')
              }}
            />
            <BlockAdder onAdd={(type) => add(at + 1, type)} />
          </div>
        ))}

        <div className="p-2" aria-hidden="true">
          <span className="inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bg">
            {isTheme ? 'Concluir tema' : 'Concluir dia'}
          </span>
        </div>
      </article>
      <p className="mt-3.5 text-sm text-ink-faint">
        Clique em qualquer texto para editar. Passe o mouse num bloco para subir, descer, duplicar
        ou apagar. Passe entre dois blocos para ver o <b>+</b> e adicionar outro.
      </p>
    </div>
  )
}

interface BlockProps {
  section: DaySection
  where: string
  isFirst: boolean
  isLast: boolean
  onChange: (section: DaySection) => void
  onMove: (delta: number) => void
  onDuplicate: () => void
  onRemove: () => void
  onUploadImage: (file: File) => Promise<string | null>
}

/** Um bloco com a moldura tracejada azul e as ferramentas no canto ao passar o mouse ou focar. */
function Block({
  section,
  where,
  isFirst,
  isLast,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
  onUploadImage,
}: BlockProps) {
  return (
    <div className="group/block relative -mx-2 rounded-[14px] p-2 outline-2 outline-transparent outline-dashed transition-[outline-color] focus-within:outline-admin-ink hover:outline-admin/35">
      <div className="absolute -top-4 right-2.5 z-10 hidden gap-1 rounded-[10px] border border-line bg-surface p-0.75 shadow-[0_4px_14px_rgb(0_0_0/0.08)] group-focus-within/block:flex group-hover/block:flex">
        <Tool icon="up" label={`Subir ${where}`} disabled={isFirst} onClick={() => onMove(-1)} />
        <Tool icon="down" label={`Descer ${where}`} disabled={isLast} onClick={() => onMove(1)} />
        <Tool icon="copy" label={`Duplicar ${where}`} onClick={onDuplicate} />
        <Tool icon="trash" label={`Apagar ${where}`} onClick={onRemove} danger />
      </div>
      <BlockContent section={section} onChange={onChange} onUploadImage={onUploadImage} />
    </div>
  )
}
