import { ArrowLeft } from 'lucide-react'
import { useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { ThemeToggle } from '../../../../shared/theme/ThemeToggle'
import type { JourneyEditor } from '../../application/JourneyEditor'
import { allDays } from '../../domain/journey'
import { findDay } from '../../domain/journeyEditing'
import { AccountButton } from '../account/AccountButton'
import { JourneyContext } from '../JourneyContext'
import { useJourney } from '../useJourney'
import { DayEditor } from './DayEditor'
import { EditorOverview } from './EditorOverview'

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <p className="max-w-md text-ink-muted">{text}</p>
      <a href="#/jornada" className="text-accent hover:underline">
        Voltar para a jornada
      </a>
    </div>
  )
}

function Editor({ editor }: { editor: JourneyEditor }) {
  const state = useSyncExternalStore(editor.subscribe, editor.getSnapshot)
  const [openDay, setOpenDay] = useState<number | null>(null)

  useEffect(() => {
    void editor.load()
  }, [editor])

  useEffect(() => window.scrollTo({ top: 0 }), [openDay])

  if (state.status === 'loading')
    return <p className="py-20 text-center text-ink-muted">Carregando…</p>
  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-ink-muted">{state.message}</p>
        <button
          type="button"
          onClick={() => void editor.load()}
          className="rounded-full border border-accent px-5 py-2 text-accent"
        >
          Tentar de novo
        </button>
      </div>
    )
  }

  const day = openDay === null ? undefined : findDay(state.working, openDay)
  if (day) {
    const position = allDays(state.working).findIndex((d) => d.number === day.number) + 1
    return (
      <DayEditor
        editor={editor}
        state={state}
        day={day}
        position={position}
        onBack={() => setOpenDay(null)}
      />
    )
  }
  return <EditorOverview editor={editor} state={state} onOpenDay={setOpenDay} />
}

/** Modo Andreía: só para a admin (as regras da nuvem também recusam qualquer outra pessoa). */
export function EditorApp() {
  const services = useContext(JourneyContext)
  const { isAdmin } = useJourney()
  const [editor] = useState(() => services?.createEditor?.() ?? null)

  useEffect(() => {
    document.title = 'Modo Andreía · ATMAVOX'
  }, [])

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <a
            href="#/jornada"
            className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-accent"
          >
            <ArrowLeft aria-hidden size={16} /> Jornada
          </a>
          <span className="font-display text-gold">Modo Andreía</span>
          <div className="ml-auto flex items-center gap-2">
            <AccountButton />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16">
        {!editor ? (
          <Notice title="Edição indisponível" text="O login não está configurado neste site." />
        ) : !isAdmin ? (
          <Notice
            title="Só para a admin"
            text="Entre com a conta de admin (botão no topo) para editar a jornada."
          />
        ) : (
          <Editor editor={editor} />
        )}
      </main>
    </div>
  )
}
