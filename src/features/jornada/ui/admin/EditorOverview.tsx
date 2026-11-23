import { useCallback, useState, type KeyboardEvent } from 'react'
import {
  dayStatus,
  draftDayCount,
  publishBlocker,
  type EditorState,
  type JourneyEditor,
} from '../../application/JourneyEditor'
import { DEFAULT_JOURNEY_ID, journeyHref } from '../../application/navigation'
import {
  allDays,
  structureOf,
  type JourneyDay,
  type JourneyStructure,
  type JourneyWeek,
} from '../../domain/journey'
import { useCatalog } from '../../../../shared/catalog/CatalogContext'
import { canRemoveDay } from '../../domain/journeyEditing'
import { ConfirmDialog } from './ConfirmDialog'
import { EditorIcon } from './EditorIcon'
import { InlineText } from './InlineText'
import { StatusTag } from './StatusTag'

interface OverviewProps {
  editor: JourneyEditor
  state: EditorState
  onOpenDay: (dayNumber: number) => void
  onPublish: () => void
  onAddDay: (weekNumber: number) => void
}

const btn =
  'inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink transition-colors hover:border-admin-ink'

/** O tema da semana (ou o nome do tema) salva ao sair do campo: gravar a cada letra encheria a nuvem. */
function WeekHeading({
  week,
  editor,
  structure,
  position,
}: {
  week: JourneyWeek
  editor: JourneyEditor
  structure: JourneyStructure
  position: number
}) {
  const [theme, setTheme] = useState(week.theme)
  if (structure === 'days') {
    return (
      <h2 className="mb-2.5 flex items-center gap-2.5 text-[13px] font-semibold tracking-[0.2em] text-accent uppercase">
        <span className="shrink-0">Dias</span>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </h2>
    )
  }
  const prefix = structure === 'themes' ? `Tema ${position}` : `Semana ${week.roman}`
  return (
    <h2 className="mb-2.5 flex items-center gap-2.5 text-[13px] font-semibold tracking-[0.2em] text-accent uppercase">
      <span className="shrink-0">{prefix} ·</span>
      <InlineText
        singleLine
        label={structure === 'themes' ? `Nome do ${prefix}` : `Tema da ${prefix}`}
        value={theme}
        onChange={setTheme}
        onBlur={() => {
          if (theme.trim() !== '' && theme !== week.theme) {
            void editor.setWeekTheme(week.number, theme)
          }
        }}
        fit
        className="tracking-[0.2em] uppercase"
      />
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </h2>
  )
}

/** Texto da Abertura de uma jornada nova; salva ao sair do campo. */
function OpeningField({ editor, value }: { editor: JourneyEditor; value: string }) {
  const [text, setText] = useState(value)
  return (
    <section className="mt-4.5 rounded-[18px] border border-line bg-surface p-4">
      <h2 className="mb-2 text-[13px] font-semibold tracking-[0.2em] text-accent uppercase">
        Texto da Abertura
      </h2>
      <InlineText
        label="Texto da Abertura"
        placeholder="O que a participante lê antes de começar a jornada…"
        value={text}
        onChange={setText}
        onBlur={() => {
          if (text !== value) void editor.setOpening(text)
        }}
        className="text-ink-muted"
      />
    </section>
  )
}

/** Quadro de todos os dias: cartões por semana, arrastar para reordenar, "Publicar" só aqui. */
export function EditorOverview({ editor, state, onOpenDay, onPublish, onAddDay }: OverviewProps) {
  const structure = structureOf(state.working)
  const isThemes = structure === 'themes'
  const unit = isThemes ? 'tema' : 'dia'
  const product = useCatalog().find(state.working.id)
  const isChama = state.working.id === DEFAULT_JOURNEY_ID
  const [dragging, setDragging] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const [removing, setRemoving] = useState<JourneyDay | null>(null)
  const cancelRemove = useCallback(() => setRemoving(null), [setRemoving])
  const days = allDays(state.working)
  const positions = new Map(days.map((day, index) => [day.number, index + 1]))
  const total = days.length
  const drafts = draftDayCount(state)
  const blocker = publishBlocker(state)
  const lastWeek = state.working.weeks.at(-1)?.number

  /** Solta um cartão sobre outro da mesma semana: ocupa o lugar dele. */
  function drop(week: JourneyWeek, targetNumber: number) {
    if (dragging === null || dragging === targetNumber) return
    const from = week.days.findIndex((d) => d.number === dragging)
    const to = week.days.findIndex((d) => d.number === targetNumber)
    if (from !== -1 && to !== -1) void editor.moveDay(dragging, to - from)
  }

  // Teclado: as setas no "puxador" movem o dia (o arrastar com mouse não serve para todo mundo).
  function onGripKey(event: KeyboardEvent, dayNumber: number) {
    const delta = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[event.key]
    if (delta === undefined) return
    event.preventDefault()
    void editor.moveDay(dayNumber, delta)
  }

  return (
    <div className="pt-6 pb-24">
      <div className="mb-4.5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[32px] text-ink">
            {product?.title ?? 'A Chama Interna'}
          </h1>
          <p className="mt-1.5 mb-2.5 text-ink-muted">
            {isThemes
              ? 'Clique num tema para editar o conteúdo dele.'
              : 'Clique num dia para editar. Arraste os cartões para mudar a ordem.'}
          </p>
          <div className="flex items-center gap-2.5 text-sm text-ink-muted">
            <div
              role="progressbar"
              aria-label={isThemes ? 'Temas salvos' : 'Dias salvos'}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={total - drafts}
              className="h-1.5 w-65 max-w-[50vw] overflow-hidden rounded-full bg-line"
            >
              <div
                className="h-full bg-ok transition-[width] duration-300"
                style={{ width: `${((total - drafts) / Math.max(total, 1)) * 100}%` }}
              />
            </div>
            <span>
              {total - drafts} de {total} {isThemes ? 'temas' : 'dias'} salvos
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap justify-end gap-2">
            <a href={journeyHref(state.working.id)} className={btn}>
              <EditorIcon name="eye" /> Ver como participante
            </a>
            <button
              type="button"
              disabled={blocker !== null || state.isBusy}
              onClick={onPublish}
              className="rounded-full bg-admin px-4 py-2 text-sm font-semibold text-on-admin disabled:cursor-not-allowed disabled:opacity-45"
            >
              {state.isBusy ? 'Aguarde…' : 'Publicar jornada'}
            </button>
          </div>
          {blocker && <span className="text-[13px] text-draft">{blocker}</span>}
        </div>
      </div>

      {!isChama && <OpeningField editor={editor} value={state.working.opening ?? ''} />}

      {state.working.weeks.map((week, weekIndex) => (
        <section key={week.number} className="mt-4.5">
          <WeekHeading
            key={week.theme}
            week={week}
            editor={editor}
            structure={structure}
            position={weekIndex + 1}
          />
          <ol className="grid grid-cols-2 gap-2.5 lg:grid-cols-7">
            {week.days.map((day) => {
              const status = dayStatus(state, day.number)
              const position = positions.get(day.number) ?? 0
              return (
                <li
                  key={day.number}
                  // Por tema, cada tema tem um conteúdo só: nada de arrastar nem apagar.
                  draggable={!isThemes}
                  onDragStart={() => setDragging(day.number)}
                  onDragEnd={() => {
                    setDragging(null)
                    setOver(null)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setOver(day.number)
                  }}
                  onDragLeave={() => setOver(null)}
                  onDrop={() => {
                    drop(week, day.number)
                    setOver(null)
                  }}
                  className={`flex min-h-37.5 cursor-grab flex-col gap-2 rounded-[18px] border bg-surface px-3 pt-3 pb-2.5 transition-[box-shadow,transform] hover:-translate-y-px hover:shadow-[0_6px_18px_rgb(0_0_0/0.08)] ${
                    status === 'draft' ? 'border-draft/45' : 'border-line'
                  } ${dragging === day.number ? 'opacity-40' : ''} ${
                    over === day.number && dragging !== day.number
                      ? 'outline-2 outline-admin-ink outline-dashed'
                      : ''
                  }`}
                >
                  <span className="flex items-center justify-between font-display text-[28px] leading-none text-accent">
                    {String(isThemes ? weekIndex + 1 : position).padStart(2, '0')}
                    <span className={`flex items-center gap-1 ${isThemes ? 'hidden' : ''}`}>
                      <button
                        type="button"
                        aria-label={`Apagar dia ${position}: ${day.title}`}
                        title={
                          canRemoveDay(state.working, day.number)
                            ? 'Apagar dia'
                            : 'Cada semana precisa de pelo menos um dia'
                        }
                        disabled={!canRemoveDay(state.working, day.number) || state.isBusy}
                        onClick={() => setRemoving(day)}
                        className="grid size-7 place-items-center rounded-full text-ink-faint hover:bg-wine/10 hover:text-wine disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint"
                      >
                        <EditorIcon name="trash" size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Mover dia ${position} (use as setas)`}
                        onKeyDown={(event) => onGripKey(event, day.number)}
                        className="cursor-grab rounded text-ink-faint"
                      >
                        <EditorIcon name="grip" size={16} />
                      </button>
                    </span>
                  </span>
                  <span className="flex-1 text-sm leading-snug text-ink">
                    {isThemes ? week.theme || day.title : day.title}
                  </span>
                  <StatusTag status={status} className="self-start" />
                  <button
                    type="button"
                    onClick={() => onOpenDay(day.number)}
                    aria-label={`Editar ${unit} ${isThemes ? weekIndex + 1 : position}: ${isThemes ? week.theme : day.title}`}
                    className={`${btn} justify-center px-2.5 py-1.5 text-[13px]`}
                  >
                    {isThemes ? 'Editar tema' : 'Editar dia'}
                  </button>
                </li>
              )
            })}
            {!isThemes && week.number === lastWeek && (
              <li>
                <button
                  type="button"
                  disabled={state.isBusy}
                  onClick={() => onAddDay(week.number)}
                  className="grid h-full min-h-37.5 w-full place-items-center rounded-[18px] border-[1.5px] border-dashed border-line text-sm text-ink-faint hover:border-admin-ink hover:text-admin-ink"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <EditorIcon name="plus" size={18} /> Novo dia
                  </span>
                </button>
              </li>
            )}
          </ol>
        </section>
      ))}

      {removing && (
        <ConfirmDialog
          title={`Apagar o Dia ${positions.get(removing.number) ?? ''}?`}
          confirmLabel="Apagar dia"
          danger
          onCancel={cancelRemove}
          onConfirm={() => {
            setRemoving(null)
            void editor.removeDay(removing.number)
          }}
        >
          “{removing.title}” sai da jornada quando você publicar. O que as participantes já
          escreveram nele fica guardado. Se mudar de ideia antes de publicar, use o Histórico para
          voltar à versão anterior.
        </ConfirmDialog>
      )}
    </div>
  )
}
