import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  addDays,
  dayOfMonth,
  EMPTY_AVAILABILITY,
  fromMinutes,
  localDate,
  longDate,
  monthName,
  occurrencesOn,
  removeWindow,
  skipOccurrence,
  startOfWeek,
  timeLabel,
  toMinutes,
  upsertWindow,
  validateWindow,
  weekdayShort,
  weekOf,
  type Availability,
  type AvailabilityWindow,
  type WindowErrors,
} from '../../../../shared/ativacao/availability'
import { DEFAULT_THERAPIES, type Therapy } from '../../../../shared/ativacao/therapy'
import { useNow } from '../../../../shared/lib/useNow'
import { UiIcon } from '../../../../shared/ui/UiIcon'
import type { AtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import { Segmented } from '../fields'
import { adminButton, ghostButton } from '../styles'
import { Overlay } from './Overlay'
import { Switch } from './TherapyFields'
import { TherapyChecks, ToneDot, WindowForm } from './WindowForm'
import { LoadingNote } from '../../../../shared/ui/LoadingNote'

/** A grade mostra das 7h às 22h; cada hora tem 48 px e o arrastar anda de meia em meia hora. */
const FIRST_HOUR = 7
const LAST_HOUR = 22
const HOUR_PX = 48
const SNAP = 30

let windowCounter = 0
const newWindowId = () => `faixa-${Date.now().toString(36)}-${++windowCounter}`

const snapDown = (minutes: number) => Math.floor(minutes / SNAP) * SNAP
const snapUp = (minutes: number) => Math.ceil(minutes / SNAP) * SNAP
const clampDay = (minutes: number) => Math.min(LAST_HOUR * 60, Math.max(FIRST_HOUR * 60, minutes))

function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6)
  const month = (date: string) => monthName(Number(date.slice(5, 7))).slice(0, 3)
  return `${dayOfMonth(monday)} ${month(monday)} a ${dayOfMonth(sunday)} ${month(sunday)}`
}

interface Editing {
  window: AvailabilityWindow
  /** O dia clicado, quando a faixa repete (para "tirar só este dia"). */
  occurrence: string | null
  isNew: boolean
}

interface Quick {
  window: AvailabilityWindow
  column: number
}

/** Agenda da Andreía (mock aprovado): grade da semana com arrastar + mês no computador; dia no celular. */
export function AgendaPanel({ backend, isWide }: { backend: AtivacoesBackend; isWide: boolean }) {
  const nowMs = useNow()
  const today = localDate(nowMs)
  const nowMinutes = new Date(nowMs).getHours() * 60 + new Date(nowMs).getMinutes()
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [therapies, setTherapies] = useState<readonly Therapy[]>(DEFAULT_THERAPIES)
  const [view, setView] = useState<'semana' | 'mes'>('semana')
  const [day, setDay] = useState(today)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [quick, setQuick] = useState<Quick | null>(null)
  const [errors, setErrors] = useState<WindowErrors>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [drag, setDrag] = useState<{ date: string; from: number; to: number } | null>(null)
  const dragOrigin = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      backend.loadAvailability().catch(() => EMPTY_AVAILABILITY),
      backend.loadTherapies().catch(() => null),
    ]).then(([loaded, list]) => {
      if (cancelled) return
      setAvailability(loaded)
      if (list?.length) setTherapies(list)
    })
    return () => {
      cancelled = true
    }
  }, [backend])

  if (!availability) return <LoadingNote text="Carregando a agenda…" />

  const monday = startOfWeek(day)
  const week = weekOf(day)
  const defaultIds = (
    therapies.some((t) => t.active) ? therapies.filter((t) => t.active) : therapies
  ).map((t) => t.id)
  const therapyOf = (id: string) => therapies.find((t) => t.id === id)

  function draft(date: string, start: string, end: string): AvailabilityWindow {
    return {
      id: newWindowId(),
      date,
      start,
      end,
      therapyIds: defaultIds,
      weekly: false,
      until: null,
      skip: [],
    }
  }

  async function persist(next: Availability, message = 'Salvo ✓'): Promise<boolean> {
    setIsSaving(true)
    setNotice(null)
    try {
      await backend.saveAvailability(next)
      setAvailability(next)
      setNotice(message)
      return true
    } catch {
      setNotice('Não deu para salvar. Confira a internet e tente de novo.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  async function saveWindow(window: AvailabilityWindow, after: () => void) {
    const others = removeWindow(availability!, window.id)
    const found = validateWindow(window, therapies, others)
    setErrors(found)
    if (Object.keys(found).length) return
    if (await persist(upsertWindow(availability!, window))) after()
  }

  function openNew(date: string, start = '09:00', end = '12:00') {
    setQuick(null)
    setErrors({})
    setEditing({ window: draft(date, start, end), occurrence: null, isNew: true })
  }

  function openExisting(window: AvailabilityWindow, date: string) {
    setQuick(null)
    setErrors({})
    setEditing({ window, occurrence: window.weekly ? date : null, isNew: false })
  }

  /* ---------- arrastar na grade (computador) ---------- */

  function minuteAt(event: ReactPointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return clampDay(FIRST_HOUR * 60 + ((event.clientY - rect.top) / HOUR_PX) * 60)
  }

  function onColumnDown(event: ReactPointerEvent<HTMLElement>, date: string) {
    if ((event.target as HTMLElement).closest('[data-window]')) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const start = snapDown(minuteAt(event))
    dragOrigin.current = start
    setQuick(null)
    setDrag({ date, from: start, to: start + SNAP })
  }

  function onColumnMove(event: ReactPointerEvent<HTMLElement>) {
    if (!drag || dragOrigin.current === null) return
    const at = minuteAt(event)
    const origin = dragOrigin.current
    setDrag({
      ...drag,
      from: Math.min(origin, snapDown(at)),
      to: Math.max(origin + SNAP, snapUp(at)),
    })
  }

  function onColumnUp() {
    if (!drag) return
    const from = drag.from
    // Um clique sem arrastar marca uma hora.
    const to = Math.max(drag.to, Math.min(LAST_HOUR * 60, from + 60))
    setQuick({
      window: draft(drag.date, fromMinutes(from), fromMinutes(to)),
      column: week.indexOf(drag.date),
    })
    setErrors({})
    setDrag(null)
    dragOrigin.current = null
  }

  const noticeLine = notice && (
    <p role="status" className={`text-sm ${notice.endsWith('✓') ? 'text-ok' : 'text-accent'}`}>
      {notice}
    </p>
  )

  const nav = (step: number, label: string) => (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`${label} anterior`}
        onClick={() => setDay(addDays(day, -step))}
        className="grid size-8 place-items-center rounded-full border border-line text-ink-muted hover:text-admin-ink"
      >
        <UiIcon name="back" size={16} />
      </button>
      <button
        type="button"
        aria-label={`Próxima ${label.toLowerCase()}`}
        onClick={() => setDay(addDays(day, step))}
        className="grid size-8 place-items-center rounded-full border border-line text-ink-muted hover:text-admin-ink"
      >
        <UiIcon name="next" size={16} />
      </button>
      <button
        type="button"
        onClick={() => setDay(today)}
        className="ml-1 rounded-full px-2.5 py-1 text-sm text-ink-muted hover:text-admin-ink"
      >
        Hoje
      </button>
    </span>
  )

  const legend = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3.5 rounded-[2px_4px_4px_2px] border border-l-[3px] border-line border-l-gold bg-field" />
        Livre
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-sm bg-wine" />
        Reservado
      </span>
      {therapies.map((t) => (
        <span key={t.id} className="flex items-center gap-1.5">
          <ToneDot tone={t.tone} />
          {t.name.split(' ')[0]}
        </span>
      ))}
    </div>
  )

  const windowBlock = (window: AvailabilityWindow, date: string, style?: React.CSSProperties) => (
    <button
      key={window.id}
      type="button"
      data-window
      onClick={() => openExisting(window, date)}
      aria-label={`Livre ${longDate(date)}, ${timeLabel(window.start)} às ${timeLabel(window.end)}`}
      style={style}
      className="flex flex-col items-start gap-0.5 overflow-hidden rounded-[4px_12px_12px_4px] border border-l-4 border-line border-l-gold bg-field px-2.5 py-1.5 text-left text-[11px] leading-tight text-ink transition-colors hover:border-gold/60 hover:border-l-gold"
    >
      <b className="font-semibold">
        {timeLabel(window.start)}–{timeLabel(window.end)}
        {window.weekly ? ' · toda semana' : ''}
      </b>
      <span className="flex flex-wrap items-center gap-1">
        {window.therapyIds.map((id) => {
          const t = therapyOf(id)
          return t ? <ToneDot key={id} tone={t.tone} /> : null
        })}
      </span>
    </button>
  )

  /** A faixa livre na grade (mock aprovado: grade da A, faixa da C): papel claro com a fita dourada. */
  const gridBlock = (window: AvailabilityWindow, date: string, top: number, height: number) => (
    <button
      key={window.id}
      type="button"
      data-window
      onClick={() => openExisting(window, date)}
      aria-label={`Livre ${longDate(date)}, ${timeLabel(window.start)} às ${timeLabel(window.end)}`}
      style={{ top: top + 1, height: height - 2 }}
      className="absolute inset-x-1.5 z-[1] flex flex-col items-start gap-0.5 overflow-hidden rounded-[4px_10px_10px_4px] border border-l-4 border-line border-l-gold bg-field px-2 py-1.5 text-left text-[11.5px] leading-tight text-ink transition-colors hover:border-gold/60 hover:border-l-gold"
    >
      <span className="text-[10.5px] font-semibold tracking-[0.16em] text-gold uppercase">
        Livre
      </span>
      <b className="font-medium">
        {timeLabel(window.start)} – {timeLabel(window.end)}
        {window.weekly ? ' · toda semana' : ''}
      </b>
      {height > 70 && (
        <span className="mt-0.5 flex flex-wrap items-center gap-1">
          {window.therapyIds.map((id) => {
            const t = therapyOf(id)
            return t ? (
              <span
                key={id}
                className="inline-block size-2.5 rounded-full"
                style={{ background: `var(--tone-${t.tone})` }}
              />
            ) : null
          })}
        </span>
      )}
    </button>
  )

  /* ---------- formulário completo (janela ou folha) ---------- */

  const editor = editing && (
    <Overlay
      title={editing.isNew ? 'Novo horário livre' : 'Horário livre'}
      isWide={isWide}
      onClose={() => setEditing(null)}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!editing.isNew ? (
            <span className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              {editing.occurrence && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    void persist(
                      skipOccurrence(availability, editing.window.id, editing.occurrence!),
                      'Tirado só deste dia ✓',
                    ).then((ok) => ok && setEditing(null))
                  }
                  className="inline-flex items-center gap-1.5 text-ink-faint hover:text-wine"
                >
                  <UiIcon name="trash" size={15} />
                  Tirar só este dia
                </button>
              )}
              <button
                type="button"
                disabled={isSaving}
                onClick={() =>
                  void persist(
                    removeWindow(availability, editing.window.id),
                    'Horário tirado ✓',
                  ).then((ok) => ok && setEditing(null))
                }
                className="inline-flex items-center gap-1.5 text-ink-faint hover:text-wine"
              >
                <UiIcon name="trash" size={15} />
                {editing.window.weekly ? 'Tirar todas as semanas' : 'Tirar este horário'}
              </button>
            </span>
          ) : (
            <span />
          )}
          <span className="flex gap-2.5">
            {isWide && (
              <button type="button" onClick={() => setEditing(null)} className={ghostButton}>
                Cancelar
              </button>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveWindow(editing.window, () => setEditing(null))}
              className={`${adminButton} ${isWide ? '' : 'flex-1'}`}
            >
              {isSaving ? 'Salvando…' : 'Salvar'}
            </button>
          </span>
        </div>
      }
    >
      <WindowForm
        window={editing.window}
        errors={errors}
        therapies={therapies}
        onChange={(change) =>
          setEditing((e) => (e ? { ...e, window: { ...e.window, ...change } } : e))
        }
      />
    </Overlay>
  )

  /* ---------- computador ---------- */

  if (isWide) {
    const monthStart = `${day.slice(0, 7)}-01`
    const gridStart = startOfWeek(monthStart)
    const monthDays = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
    const lastRow = monthDays.slice(35).every((d) => d.slice(0, 7) !== day.slice(0, 7))
    const visibleMonth = lastRow ? monthDays.slice(0, 35) : monthDays

    return (
      <div className="mx-auto flex w-full max-w-6xl animate-[page-in_400ms_ease-out] flex-col gap-3.5 px-7 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-4">
            <h1 className="font-display text-[2rem] text-ink">Agenda</h1>
            {nav(view === 'semana' ? 7 : 30, view === 'semana' ? 'Semana' : 'Mês')}
            <b className="font-display text-xl font-medium text-ink">
              {view === 'semana'
                ? weekLabel(monday)
                : `${monthName(Number(day.slice(5, 7)))} de ${day.slice(0, 4)}`}
            </b>
          </span>
          <span className="flex items-center gap-3">
            <Segmented
              label="Ver"
              value={view}
              options={[
                { id: 'semana', label: 'Semana' },
                { id: 'mes', label: 'Mês' },
              ]}
              onChange={setView}
            />
            <button type="button" onClick={() => openNew(day)} className={adminButton}>
              <UiIcon name="plus" size={16} />
              Horário livre
            </button>
          </span>
        </div>
        {legend}
        {noticeLine}

        {view === 'semana' ? (
          // A semana no estilo do site (mock aprovado, A): cada dia é um cartão claro, com o nome do
          // dia pequeno e o número em Playfair; linhas bem leves; a linha de agora em âmbar.
          <div className="relative rounded-[22px] bg-surface-2 px-1 pt-1 pb-2.5">
            <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
              <span />
              {week.map((date) => {
                const isToday = date === today
                return (
                  <span key={date} className="flex flex-col items-center pt-2.5 pb-2">
                    <span
                      className={`text-[11px] font-semibold tracking-[0.2em] uppercase ${isToday ? 'text-accent' : 'text-ink-faint'}`}
                    >
                      {weekdayShort(date)}
                    </span>
                    <span
                      className={`font-display text-[1.65rem] leading-tight ${isToday ? 'text-accent' : 'text-ink'}`}
                    >
                      {dayOfMonth(date)}
                    </span>
                  </span>
                )
              })}
            </div>
            <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
              <div className="relative">
                {Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) =>
                  i === 0 ? null : (
                    <span
                      key={i}
                      className="absolute right-2 -translate-y-1/2 text-[11px] text-ink-faint"
                      style={{ top: i * HOUR_PX }}
                    >
                      {FIRST_HOUR + i}h
                    </span>
                  ),
                )}
              </div>
              {week.map((date) => (
                <div
                  key={date}
                  data-testid={`dia-${date}`}
                  onPointerDown={(e) => onColumnDown(e, date)}
                  onPointerMove={onColumnMove}
                  onPointerUp={onColumnUp}
                  className="relative mx-[3px] cursor-cell touch-none rounded-2xl bg-surface select-none"
                  style={{
                    height: (LAST_HOUR - FIRST_HOUR) * HOUR_PX,
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${HOUR_PX - 1}px, color-mix(in oklab, var(--text) 7%, transparent) ${HOUR_PX - 1}px ${HOUR_PX}px)`,
                  }}
                >
                  {occurrencesOn(availability, date).map(({ window }) => {
                    const top = ((toMinutes(window.start) - FIRST_HOUR * 60) / 60) * HOUR_PX
                    const height =
                      ((toMinutes(window.end) - toMinutes(window.start)) / 60) * HOUR_PX
                    return gridBlock(window, date, top, height)
                  })}
                  {availability.booked
                    .filter((b) => b.date === date)
                    .map((b) => (
                      <div
                        key={`${b.orderId ?? ''}-${b.start}`}
                        className="pointer-events-none absolute right-1.5 left-4 z-[2] overflow-hidden rounded-[4px_10px_10px_4px] bg-wine px-2 py-1 text-[11px] leading-tight text-[var(--banner-mark)]"
                        style={{
                          top: ((toMinutes(b.start) - FIRST_HOUR * 60) / 60) * HOUR_PX + 1,
                          height: ((toMinutes(b.end) - toMinutes(b.start)) / 60) * HOUR_PX - 2,
                        }}
                      >
                        <b className="font-semibold">Reservado</b>
                        {b.orderId ? ` · ${b.orderId}` : ''}
                      </div>
                    ))}
                  {date === today &&
                    nowMinutes > FIRST_HOUR * 60 &&
                    nowMinutes < LAST_HOUR * 60 && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 z-[3] h-0.5 bg-accent"
                        style={{ top: ((nowMinutes - FIRST_HOUR * 60) / 60) * HOUR_PX }}
                      >
                        <span className="absolute -top-1 -left-[5px] size-2.5 rounded-full bg-accent" />
                      </div>
                    )}
                  {drag?.date === date && (
                    <div
                      className="pointer-events-none absolute inset-x-[3px] rounded-lg border-2 border-dashed border-admin-ink bg-admin-ink/14 px-1.5 py-1 text-[11px] font-semibold text-admin-ink"
                      style={{
                        top: ((drag.from - FIRST_HOUR * 60) / 60) * HOUR_PX + 2,
                        height: ((drag.to - drag.from) / 60) * HOUR_PX - 4,
                      }}
                    >
                      {timeLabel(fromMinutes(drag.from))} às {timeLabel(fromMinutes(drag.to))}
                    </div>
                  )}
                  {quick?.window.date === date && (
                    <div
                      className="pointer-events-none absolute inset-x-[3px] rounded-lg border-2 border-dashed border-admin-ink bg-admin-ink/14"
                      style={{
                        top: ((toMinutes(quick.window.start) - FIRST_HOUR * 60) / 60) * HOUR_PX + 2,
                        height:
                          ((toMinutes(quick.window.end) - toMinutes(quick.window.start)) / 60) *
                            HOUR_PX -
                          4,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {quick && (
              <div
                role="dialog"
                aria-label="Novo horário livre"
                className="absolute z-20 w-[290px] animate-[dialog-in_250ms_ease-out] rounded-2xl border border-line bg-bg p-4 shadow-[0_20px_50px_rgb(20_14_10/0.3)]"
                style={{
                  top: Math.max(
                    44,
                    ((toMinutes(quick.window.start) - FIRST_HOUR * 60) / 60) * HOUR_PX + 30,
                  ),
                  left:
                    quick.column >= 4
                      ? `calc(52px + ${quick.column} * (100% - 52px) / 7 - 298px)`
                      : `calc(52px + ${quick.column + 1} * (100% - 52px) / 7 + 8px)`,
                }}
              >
                <b className="text-ink">Novo horário livre</b>
                <p className="mb-2.5 text-sm text-ink-faint">
                  {longDate(quick.window.date)} · {timeLabel(quick.window.start)} às{' '}
                  {timeLabel(quick.window.end)}
                </p>
                <TherapyChecks
                  therapies={therapies}
                  value={quick.window.therapyIds}
                  compact
                  onChange={(therapyIds) =>
                    setQuick({ ...quick, window: { ...quick.window, therapyIds } })
                  }
                />
                <div className="mt-2 flex items-center justify-between text-sm text-ink">
                  Repetir toda semana
                  <Switch
                    label="Repetir toda semana"
                    checked={quick.window.weekly}
                    onChange={(weekly) =>
                      setQuick({ ...quick, window: { ...quick.window, weekly } })
                    }
                  />
                </div>
                {Object.values(errors)[0] && (
                  <p className="mt-2 text-sm text-accent">{Object.values(errors)[0]}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void saveWindow(quick.window, () => setQuick(null))}
                    className={`${adminButton} flex-1`}
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    aria-label="Mais detalhes"
                    title="Mais detalhes"
                    onClick={() => {
                      setEditing({ window: quick.window, occurrence: null, isNew: true })
                      setQuick(null)
                    }}
                    className={`${ghostButton} px-3`}
                  >
                    <UiIcon name="plus" size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Cancelar"
                    onClick={() => {
                      setQuick(null)
                      setErrors({})
                    }}
                    className={`${ghostButton} px-3`}
                  >
                    <UiIcon name="close" size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
            <div className="grid grid-cols-7 border-b border-line text-center text-xs text-ink-faint">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
                <span key={d} className="py-2">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {visibleMonth.map((date) => {
                const inMonth = date.slice(0, 7) === day.slice(0, 7)
                const occurrences = occurrencesOn(availability, date)
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => {
                      setDay(date)
                      setView('semana')
                    }}
                    className={`flex min-h-[86px] flex-col items-start gap-1 border-r border-b border-line p-1.5 text-left transition-colors hover:bg-admin/6 ${
                      inMonth ? '' : 'bg-surface-2/40 text-ink-faint'
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${date === today ? 'grid size-6 place-items-center rounded-full bg-admin text-on-admin' : ''}`}
                    >
                      {dayOfMonth(date)}
                    </span>
                    {occurrences.map(({ window }) => (
                      <span
                        key={window.id}
                        className="w-full truncate rounded-md bg-admin-ink/14 px-1.5 py-0.5 text-[11px] text-admin-ink"
                      >
                        {timeLabel(window.start)}–{timeLabel(window.end)}
                      </span>
                    ))}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <p className="text-sm text-ink-faint">
          Arraste na grade para marcar um horário livre. Clique num horário para mudar ou tirar. No
          Mês, clique num dia para abrir a semana dele.
        </p>
        {editor}
      </div>
    )
  }

  /* ---------- celular ---------- */

  const occurrences = occurrencesOn(availability, day)
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR }, (_, i) => FIRST_HOUR + i)
  const covered = (hour: number) =>
    occurrences.some(
      ({ window }) =>
        toMinutes(window.start) < (hour + 1) * 60 && toMinutes(window.end) > hour * 60,
    )

  return (
    <div className="flex animate-[page-in_400ms_ease-out] flex-col gap-3.5 p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[1.6rem] text-ink">Agenda</h1>
        {nav(7, 'Semana')}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {week.map((date) => {
          const hasFree = occurrencesOn(availability, date).length > 0
          return (
            <button
              key={date}
              type="button"
              aria-pressed={date === day}
              aria-label={longDate(date)}
              onClick={() => setDay(date)}
              className={`relative flex flex-col items-center rounded-xl py-2 transition-colors ${
                date === day ? 'bg-accent text-bg' : 'bg-surface text-ink'
              }`}
            >
              <small className="text-[11px] opacity-80">{weekdayShort(date)}</small>
              <b>{dayOfMonth(date)}</b>
              {hasFree && (
                <span
                  className={`absolute bottom-1 size-1 rounded-full ${date === day ? 'bg-bg' : 'bg-accent'}`}
                />
              )}
            </button>
          )
        })}
      </div>
      <h2 className="font-display text-xl text-ink">{longDate(day)}</h2>
      {noticeLine}
      <div className="flex flex-col gap-2">
        {hours.map((hour) => {
          const starting = occurrences.filter(
            ({ window }) => Math.floor(toMinutes(window.start) / 60) === hour,
          )
          if (starting.length)
            return starting.map(({ window }) => (
              <div key={window.id} className="flex items-stretch gap-3">
                <b className="w-10 pt-2 text-sm text-ink">{timeLabel(window.start)}</b>
                {windowBlock(window, day, { flex: 1, padding: '10px 12px', fontSize: 13 })}
              </div>
            ))
          if (covered(hour)) return null
          return (
            <div key={hour} className="flex items-center gap-3">
              <span className="w-10 text-sm text-ink-faint">{hour}h</span>
              <button
                type="button"
                onClick={() => openNew(day, fromMinutes(hour * 60), fromMinutes((hour + 1) * 60))}
                className="flex h-10 flex-1 items-center rounded-xl border border-dashed border-line px-3 text-left text-[13px] text-ink-faint transition-colors hover:border-admin-ink hover:text-admin-ink"
              >
                Toque para marcar livre
              </button>
            </div>
          )
        })}
      </div>
      {legend}
      {editor}
    </div>
  )
}
