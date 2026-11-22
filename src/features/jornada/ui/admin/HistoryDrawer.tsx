import { useEffect, useRef, useState } from 'react'
import type { EditorState, JourneyEditor } from '../../application/JourneyEditor'
import { useEscape } from './useEscape'

interface HistoryDrawerProps {
  editor: JourneyEditor
  state: EditorState
  onClose: () => void
}

const formatDate = (time: number) =>
  new Date(time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** Gaveta à direita: cada publicação vira uma versão, e dá para voltar a qualquer uma. */
export function HistoryDrawer({ editor, state, onClose }: HistoryDrawerProps) {
  const [confirming, setConfirming] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEscape(true, onClose)
  useEffect(() => {
    closeRef.current?.focus()
  }, [])
  const total = state.versions.length

  return (
    <>
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-60 cursor-default bg-black/20"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        className="fixed top-0 right-0 z-70 h-full w-90 max-w-full overflow-auto bg-surface p-5 shadow-[-10px_0_30px_rgb(0_0_0/0.15)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="history-title" className="font-display text-2xl text-ink">
            Histórico
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-4 py-1.5 text-sm text-ink hover:border-admin-ink"
          >
            Fechar
          </button>
        </div>
        <p className="mt-2 mb-4 text-sm text-ink-faint">
          Cada publicação vira uma versão. Dá para voltar a qualquer uma.
        </p>

        {total === 0 && (
          <p className="text-sm text-ink-muted">
            Ainda não há publicações. A primeira aparece aqui depois de “Publicar jornada”.
          </p>
        )}
        <ol className="flex flex-col gap-2">
          {state.versions.map((version, index) => (
            <li key={version.id} className="rounded-xl border border-line px-3 py-2.5 text-sm">
              <p className="flex items-center gap-2">
                <b className="text-ink">Versão {total - index}</b>
                {index === 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/12 px-2 py-0.5 text-xs font-medium text-ok">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                    no ar
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-faint">{formatDate(version.publishedAt)}</p>
              {index > 0 &&
                (confirming === version.id ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-ink-muted">Trocar o rascunho por esta versão?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirming(null)
                        void editor.restoreVersion(version.id)
                        onClose()
                      }}
                      className="rounded-full bg-admin px-3 py-1 font-semibold text-on-admin"
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
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(version.id)}
                    className="mt-2 rounded-full border border-line px-3 py-1 text-ink hover:border-admin-ink hover:text-admin-ink"
                  >
                    Voltar para esta
                  </button>
                ))}
            </li>
          ))}
        </ol>
      </aside>
    </>
  )
}
