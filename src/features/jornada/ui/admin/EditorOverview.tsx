import { ArrowDown, ArrowUp, Plus, Send } from 'lucide-react'
import { useId, useState } from 'react'
import {
  dayStatus,
  publishBlocker,
  type EditorState,
  type JourneyEditor,
} from '../../application/JourneyEditor'
import { allDays, type JourneyWeek } from '../../domain/journey'
import { StatusChip } from './StatusChip'

interface OverviewProps {
  editor: JourneyEditor
  state: EditorState
  onOpenDay: (dayNumber: number) => void
}

const smallIcon =
  'grid size-7 place-items-center rounded-full text-ink-faint hover:bg-accent/10 hover:text-accent disabled:opacity-30 disabled:hover:bg-transparent'

/** O tema salva ao sair do campo (e não a cada letra, que gravaria na nuvem a cada tecla). */
function WeekTheme({ week, editor }: { week: JourneyWeek; editor: JourneyEditor }) {
  const [theme, setTheme] = useState(week.theme)
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-ink-faint">
        Tema da Semana {week.roman}
      </label>
      <input
        id={id}
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        onBlur={() => {
          if (theme.trim() !== '' && theme !== week.theme)
            void editor.setWeekTheme(week.number, theme)
        }}
        className="rounded-lg border border-transparent bg-transparent px-2 py-1 font-display text-xl text-ink hover:border-line focus:border-accent"
      />
    </div>
  )
}

function PublishBar({ editor, state }: { editor: JourneyEditor; state: EditorState }) {
  const blocker = publishBlocker(state)
  return (
    <section
      aria-label="Publicar"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4"
    >
      <div className="flex-1">
        <p className="font-medium text-ink">
          {blocker === null ? 'Pronta para publicar' : 'Publicar jornada'}
        </p>
        <p className="text-sm text-ink-muted">
          {blocker ?? 'As participantes passam a ver a versão salva assim que você publicar.'}
        </p>
      </div>
      <button
        type="button"
        disabled={blocker !== null || state.isBusy}
        onClick={() => void editor.publish()}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send aria-hidden size={16} />
        {state.isBusy ? 'Aguarde…' : 'Publicar jornada'}
      </button>
    </section>
  )
}

function VersionHistory({ editor, state }: { editor: JourneyEditor; state: EditorState }) {
  const [confirming, setConfirming] = useState<string | null>(null)
  if (state.versions.length === 0) return null
  const format = (time: number) =>
    new Date(time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-3">
      <h2 id="history-title" className="font-display text-xl text-ink">
        Publicações anteriores
      </h2>
      <ol className="flex flex-col gap-2">
        {state.versions.map((version, index) => (
          <li
            key={version.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-2.5 text-sm"
          >
            <span className="text-ink">{format(version.publishedAt)}</span>
            {index === 0 && <span className="text-xs text-accent">a mais recente</span>}
            {confirming === version.id ? (
              <span className="ml-auto flex items-center gap-2">
                <span className="text-ink-muted">Trocar o rascunho por esta versão?</span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(null)
                    void editor.restoreVersion(version.id)
                  }}
                  className="rounded-full bg-accent px-3 py-1 font-medium text-bg"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-full border border-line px-3 py-1 text-ink-muted"
                >
                  Não
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(version.id)}
                className="ml-auto text-accent hover:underline"
              >
                Voltar para esta versão
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Visão geral: os dias por semana, com o estado de cada um, e o "Publicar" (só aqui). */
export function EditorOverview({ editor, state, onOpenDay }: OverviewProps) {
  // Posição na jornada (o que a participante vê como "Dia N"); o número do dia é só a identidade.
  const positions = new Map(allDays(state.working).map((day, index) => [day.number, index + 1]))
  return (
    <div className="flex flex-col gap-8 py-6">
      <header>
        <h1 className="font-display text-3xl text-ink">Editar a jornada</h1>
        <p className="mt-1 text-ink-muted">
          Edite cada dia e toque em “Salvar dia”. Quando nenhum dia estiver em rascunho, publique.
        </p>
      </header>

      <PublishBar editor={editor} state={state} />
      {state.message && (
        <p role="status" className="-mt-4 text-sm text-ink-muted">
          {state.message}
        </p>
      )}

      {state.working.weeks.map((week) => (
        <section
          key={week.number}
          aria-label={`Semana ${week.roman}`}
          className="flex flex-col gap-3"
        >
          <WeekTheme key={week.theme} week={week} editor={editor} />
          <ol className="grid gap-2 sm:grid-cols-2">
            {week.days.map((day, index) => {
              const label = `Dia ${positions.get(day.number) ?? ''}`
              return (
                <li
                  key={day.number}
                  className="flex items-center gap-2 rounded-xl border border-line bg-surface p-2 pl-3"
                >
                  <button
                    type="button"
                    onClick={() => onOpenDay(day.number)}
                    className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                  >
                    <span className="text-xs text-ink-faint">{label}</span>
                    <span className="w-full truncate font-medium text-ink">{day.title}</span>
                    <StatusChip status={dayStatus(state, day.number)} />
                  </button>
                  <span className="flex flex-col">
                    <button
                      type="button"
                      className={smallIcon}
                      disabled={index === 0 || state.isBusy}
                      onClick={() => void editor.moveDay(day.number, -1)}
                      aria-label={`Subir ${label}`}
                    >
                      <ArrowUp aria-hidden size={14} />
                    </button>
                    <button
                      type="button"
                      className={smallIcon}
                      disabled={index === week.days.length - 1 || state.isBusy}
                      onClick={() => void editor.moveDay(day.number, 1)}
                      aria-label={`Descer ${label}`}
                    >
                      <ArrowDown aria-hidden size={14} />
                    </button>
                  </span>
                </li>
              )
            })}
            <li>
              <button
                type="button"
                disabled={state.isBusy}
                onClick={() => void editor.addDay(week.number)}
                className="flex h-full min-h-20 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm text-ink-muted hover:border-accent hover:text-accent"
              >
                <Plus aria-hidden size={16} /> Novo dia na Semana {week.roman}
              </button>
            </li>
          </ol>
        </section>
      ))}

      <VersionHistory editor={editor} state={state} />
    </div>
  )
}
