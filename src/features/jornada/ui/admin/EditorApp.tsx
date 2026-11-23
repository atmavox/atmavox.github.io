import { BRAND_TAB_TITLE } from '../../../../shared/brand/links'
import { useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import type { JourneyEditor } from '../../application/JourneyEditor'
import { allDays, structureOf } from '../../domain/journey'
import { findDay, nextDayNumber } from '../../domain/journeyEditing'
import { JourneyContext } from '../JourneyContext'
import { useJourney } from '../useJourney'
import { AdminBar } from './AdminBar'
import { DayEditor } from './DayEditor'
import { EditorOverview } from './EditorOverview'
import { HistoryDrawer } from './HistoryDrawer'
import { ConfirmDialog } from './ConfirmDialog'
import { Toast } from './Toast'

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <p className="max-w-md text-ink-muted">{text}</p>
      <a href="#/jornadas" className="text-admin-ink hover:underline">
        Voltar para as jornadas
      </a>
    </div>
  )
}

function Editor({ editor }: { editor: JourneyEditor }) {
  const state = useSyncExternalStore(editor.subscribe, editor.getSnapshot)
  const [openDay, setOpenDay] = useState<number | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isConfirmingPublish, setIsConfirmingPublish] = useState(false)
  const closeHistory = useCallback(() => setIsHistoryOpen(false), [])
  const cancelPublish = useCallback(() => setIsConfirmingPublish(false), [])

  useEffect(() => {
    void editor.load()
  }, [editor])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [openDay])

  const day = openDay === null ? undefined : findDay(state.working, openDay)

  let content
  if (state.status === 'loading') {
    content = <p className="py-20 text-center text-ink-muted">Carregando…</p>
  } else if (state.status === 'error') {
    content = (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-ink-muted">{state.message}</p>
        <button
          type="button"
          onClick={() => void editor.load()}
          className="rounded-full bg-admin px-5 py-2 font-semibold text-on-admin"
        >
          Tentar de novo
        </button>
      </div>
    )
  } else if (day) {
    content = (
      <DayEditor
        editor={editor}
        state={state}
        day={day}
        onBack={() => setOpenDay(null)}
        onOpenDay={setOpenDay}
      />
    )
  } else {
    content = (
      <EditorOverview
        editor={editor}
        state={state}
        onOpenDay={setOpenDay}
        onPublish={() => setIsConfirmingPublish(true)}
        onAddDay={(weekNumber) => {
          const created = nextDayNumber(state.working)
          void editor.addDay(weekNumber).then(() => setOpenDay(created))
        }}
      />
    )
  }

  return (
    <>
      <AdminBar onHistory={() => setIsHistoryOpen(true)} />
      <main className="mx-auto max-w-295 px-5">{content}</main>
      {isHistoryOpen && <HistoryDrawer editor={editor} state={state} onClose={closeHistory} />}
      {isConfirmingPublish && (
        <ConfirmDialog
          title="Publicar a jornada?"
          confirmLabel="Publicar"
          onCancel={cancelPublish}
          onConfirm={() => {
            setIsConfirmingPublish(false)
            void editor.publish()
          }}
        >
          {structureOf(state.saved) === 'themes'
            ? `Os ${allDays(state.saved).length} temas estão salvos.`
            : `Os ${allDays(state.saved).length} dias estão salvos.`}{' '}
          Ao publicar, todas as participantes passam a ver esta versão. Dá para voltar à anterior
          pelo Histórico.
        </ConfirmDialog>
      )}
      <Toast message={state.message} seq={state.messageSeq} />
    </>
  )
}

/** Modo Andreía: só para a admin (as regras da nuvem também recusam qualquer outra pessoa). */
export function EditorApp() {
  const services = useContext(JourneyContext)
  const { isAdmin } = useJourney()
  const [editor] = useState(() => services?.createEditor?.() ?? null)

  useEffect(() => {
    document.title = BRAND_TAB_TITLE
  }, [])

  if (!editor || !isAdmin) {
    return (
      <div className="min-h-dvh">
        <AdminBar />
        <main className="mx-auto max-w-3xl px-4">
          {!editor ? (
            <Notice title="Edição indisponível" text="O login não está configurado neste site." />
          ) : (
            <Notice
              title="Só para a admin"
              text="Entre na jornada com a conta de admin para editar."
            />
          )}
        </main>
      </div>
    )
  }
  return (
    <div className="min-h-dvh">
      <Editor editor={editor} />
    </div>
  )
}
