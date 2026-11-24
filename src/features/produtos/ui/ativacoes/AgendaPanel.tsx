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
import { SaveStatus } from '../SaveStatus'
import { useSaveNotice } from '../useSaveNotice'
import { Overlay } from './Overlay'
import { Switch } from './TherapyFields'
import { TherapyChecks, ToneDot, WindowForm } from './WindowForm'
import { LoadingNote } from '../../../../shared/ui/LoadingNote'
import { TONE_DOT } from '../../../../shared/ui/bannerTones'

/**
 * A grade da semana mostra o dia inteiro (0h a 24h) e rola dentro dela, abrindo no começo do
 * expediente; cada hora tem 46 px e o arrastar anda de meia em meia hora. No celular, a lista do dia
 * vai das 7h às 22h.
 */
const FIRST_HOUR = 0
const LAST_HOUR = 24
const HOUR_PX = 46
/** A grade sempre abre mostrando das 9h às 21h (pedido de 2026-11-23); o resto do dia, rolando. */
const VIEW_FROM_HOUR = 9
const VIEW_HOURS = 12
const PHONE_FIRST_HOUR = 7
const PHONE_LAST_HOUR = 22
const SNAP = 30

let windowCounter = 0
const newWindowId = () => `faixa-${Date.now().toString(36)}-${++windowCounter}`

const snapDown = (minutes: number) => Math.floor(minutes / SNAP) * SNAP
const snapUp = (minutes: number) => Math.ceil(minutes / SNAP) * SNAP
const clampDay = (minutes: number) => Math.min(LAST_HOUR * 60, Math.max(FIRST_HOUR * 60, minutes))

/** "23 a 29 de novembro"; virando o mês, "30 de novembro a 6 de dezembro". */
function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6)
  const month = (date: string) => monthName(Number(date.slice(5, 7)))
  return monday.slice(5, 7) === sunday.slice(5, 7)
    ? `${dayOfMonth(monday)} a ${dayOfMonth(sunday)} de ${month(sunday)}`
    : `${dayOfMonth(monday)} de ${month(monday)} a ${dayOfMonth(sunday)} de ${month(sunday)}`
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
  const saveNotice = useSaveNotice()
  const [isSaving, setIsSaving] = useState(false)
  const [drag, setDrag] = useState<{ date: string; from: number; to: number } | null>(null)
  const dragOrigin = useRef<number | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

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

  // A grade abre sempre das 9h às 21h; antes e depois, rolando dentro dela.
  const weekStart = startOfWeek(day)
  const isLoaded = availability !== null
  useEffect(() => {
    if (!isLoaded || view !== 'semana' || !gridRef.current) return
    gridRef.current.scrollTop = (VIEW_FROM_HOUR - FIRST_HOUR) * HOUR_PX
  }, [isLoaded, view, weekStart])
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

  /** Grava a agenda. O aviso anterior fica até chegar o novo (sumir e voltar fazia a grade pular). */
  async function persist(next: Availability, message = 'Salvo'): Promise<boolean> {
    setIsSaving(true)
    try {
      await backend.saveAvailability(next)
      setAvailability(next)
      saveNotice.show({ kind: 'ok', text: message })
      return true
    } catch {
      saveNotice.show({
        kind: 'error',
        text: 'Não deu para salvar. Confira a internet e tente de novo.',
      })
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

  // Na ponta de uma linha que já existe: aparecer, mudar ou sumir não empurra a grade.
  const noticeLine = (
    <SaveStatus
      notice={saveNotice.notice}
      isVisible={saveNotice.isVisible}
      className="ml-auto text-right"
    />
  )

  const nav = (step: number, label: string) => (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`${label} anterior`}
        onClick={() => setDay(addDays(day, -step))}
        className="grid size-8 place-items-center rounded-full border border-line text-ink-muted transition-colors hover:border-accent hover:bg-accent/12 hover:text-accent"
      >
        <UiIcon name="back" size={16} />
      </button>
      <button
        type="button"
        aria-label={`Próxima ${label.toLowerCase()}`}
        onClick={() => setDay(addDays(day, step))}
        className="grid size-8 place-items-center rounded-full border border-line text-ink-muted transition-colors hover:border-accent hover:bg-accent/12 hover:text-accent"
      >
        <UiIcon name="next" size={16} />
      </button>
      <button
        type="button"
        onClick={() => setDay(today)}
        className="ml-1 rounded-full border border-line px-3 py-1 text-sm text-ink-muted transition-colors hover:border-accent hover:bg-accent/8 hover:text-accent"
      >
        Hoje
      </button>
    </span>
  )

  const legend = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted">
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-[4px] border-[1.5px] border-dashed border-accent bg-accent/12" />
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
      className="flex flex-col items-start gap-0.5 overflow-hidden rounded-lg border-2 border-dashed border-accent/70 bg-accent/12 px-2.5 py-1.5 text-left text-[11px] leading-tight text-ink transition-colors hover:border-accent hover:bg-accent/18"
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

  /** A faixa livre na grade: o mesmo tracejado da seleção ao arrastar, no marrom do site (pedido de 2026-11-23). */
  const gridBlock = (window: AvailabilityWindow, date: string, top: number, height: number) => (
    <button
      key={window.id}
      type="button"
      data-window
      onClick={() => openExisting(window, date)}
      aria-label={`Livre ${longDate(date)}, ${timeLabel(window.start)} às ${timeLabel(window.end)}`}
      style={{ top: top + 1, height: height - 2 }}
      className="absolute inset-x-[3px] z-[1] flex flex-col items-start gap-0.5 overflow-hidden rounded-lg border-2 border-dashed border-accent/70 bg-accent/12 px-1.5 py-1 text-left text-[11.5px] leading-tight text-ink transition-colors hover:border-accent hover:bg-accent/18"
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
                style={{ background: TONE_DOT[t.tone] }}
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
                      'Tirado só deste dia',
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
                    'Horário tirado',
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
          {/* Como no mock aprovado: "Agenda", o período menor e mais claro e as setas. */}
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-display text-[2rem] text-ink">Agenda</h1>
            {/* Largura fixa (cabe "30 de novembro a 6 de dezembro"): as setas não mudam de lugar. */}
            <span className="w-[19.5rem] font-display text-xl text-ink-faint">
              {view === 'semana'
                ? weekLabel(monday)
                : `${monthName(Number(day.slice(5, 7)))} de ${day.slice(0, 4)}`}
            </span>
            <span className="self-center">
              {nav(view === 'semana' ? 7 : 30, view === 'semana' ? 'Semana' : 'Mês')}
            </span>
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
        <div className="flex items-center gap-3">
          {legend}
          {noticeLine}
        </div>

        {view === 'semana' ? (
          // A semana no estilo do site (mock aprovado, A): cada dia é um cartão claro, com o nome do
          // dia pequeno e o número em Playfair; linhas bem leves; a linha de agora em âmbar.
          <div
            ref={gridRef}
            // Cabeçalho dos dias (~76 px) + 12 horas: das 9h às 21h cabem inteiras na tela.
            style={{ height: 76 + VIEW_HOURS * HOUR_PX }}
            className="thin-scroll relative overflow-y-auto rounded-[22px] bg-surface-2 px-1 pb-2.5"
          >
            <div className="sticky top-0 z-10 grid grid-cols-[56px_repeat(7,minmax(0,1fr))] bg-surface-2 pt-1">
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
  const hours = Array.from(
    { length: PHONE_LAST_HOUR - PHONE_FIRST_HOUR },
    (_, i) => PHONE_FIRST_HOUR + i,
  )
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
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-xl text-ink">{longDate(day)}</h2>
        {noticeLine}
      </div>
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
