import { useState, type KeyboardEvent } from 'react'
import {
  dayStatus,
  draftDayCount,
  publishBlocker,
  type EditorState,
  type JourneyEditor,
} from '../../application/JourneyEditor'
import { allDays, type JourneyWeek } from '../../domain/journey'
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

/** O tema da semana salva ao sair do campo (gravar a cada letra encheria a nuvem de escritas). */
function WeekHeading({ week, editor }: { week: JourneyWeek; editor: JourneyEditor }) {
  const [theme, setTheme] = useState(week.theme)
  return (
    <h2 className="mb-2.5 flex items-center gap-2.5 text-[13px] font-semibold tracking-[0.2em] text-accent uppercase">
      <span className="shrink-0">Semana {week.roman} ·</span>
      <InlineText
        singleLine
        label={`Tema da Semana ${week.roman}`}
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

/** Quadro de todos os dias: cartões por semana, arrastar para reordenar, "Publicar" só aqui. */
export function EditorOverview({ editor, state, onOpenDay, onPublish, onAddDay }: OverviewProps) {
  const [dragging, setDragging] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
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
          <h1 className="font-display text-[32px] text-ink">A Chama Interna</h1>
          <p className="mt-1.5 mb-2.5 text-ink-muted">
            Clique num dia para editar. Arraste os cartões para mudar a ordem.
          </p>
          <div className="flex items-center gap-2.5 text-sm text-ink-muted">
            <div
              role="progressbar"
              aria-label="Dias salvos"
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
              {total - drafts} de {total} dias salvos
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap justify-end gap-2">
            <a href="#/jornada" className={btn}>
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

      {state.working.weeks.map((week) => (
        <section key={week.number} className="mt-4.5" aria-label={`Semana ${week.roman}`}>
          <WeekHeading key={week.theme} week={week} editor={editor} />
          <ol className="grid grid-cols-2 gap-2.5 lg:grid-cols-7">
            {week.days.map((day) => {
              const status = dayStatus(state, day.number)
              const position = positions.get(day.number) ?? 0
              return (
                <li
                  key={day.number}
                  draggable
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
                    {String(position).padStart(2, '0')}
                    <button
                      type="button"
                      aria-label={`Mover dia ${position} (use as setas)`}
                      onKeyDown={(event) => onGripKey(event, day.number)}
                      className="cursor-grab rounded text-ink-faint"
                    >
                      <EditorIcon name="grip" size={16} />
                    </button>
                  </span>
                  <span className="flex-1 text-sm leading-snug text-ink">{day.title}</span>
                  <StatusTag status={status} className="self-start" />
                  <button
                    type="button"
                    onClick={() => onOpenDay(day.number)}
                    aria-label={`Editar dia ${position}: ${day.title}`}
                    className={`${btn} justify-center px-2.5 py-1.5 text-[13px]`}
                  >
                    Editar dia
                  </button>
                </li>
              )
            })}
            {week.number === lastWeek && (
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
    </div>
  )
}
