import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { UiIcon } from '../../../shared/ui/UiIcon'
import { StepBar, StepDots } from './FlowSteps'

/** A barra da anamnese (só no computador; no celular ela entra na barra das etapas). */
export interface SectionProgress {
  title: string
  index: number
  ids: readonly string[]
}

/**
 * A janela da ativação individual sobre o hub desfocado (mock aprovado): etapas em cima (bolinhas no
 * computador, barra no celular), corpo que rola e rodapé fixo. Fechar e Esc levam ao perfil.
 */
export function FlowShell({
  isWide,
  current,
  section,
  order,
  bodyKey,
  notice,
  footer,
  onClose,
  children,
}: {
  isWide: boolean
  current: number
  section?: SectionProgress | null
  /** Depois do pagamento, o número do pedido entra no título. */
  order?: string
  bodyKey: string
  notice?: string | null
  footer: ReactNode
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 })
  }, [bodyKey])

  return createPortal(
    <div className="fixed inset-0 z-40 grid animate-[fade-in_250ms_ease-out] place-items-center bg-[color-mix(in_oklab,var(--bg)_35%,rgb(20_14_10/0.4))] backdrop-blur-[5px] sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex flex-col overflow-hidden border-line bg-surface shadow-[0_30px_80px_rgb(20_14_10/0.35)] ${
          isWide
            ? 'h-[min(760px,92dvh)] w-full max-w-[820px] animate-[dialog-in_320ms_ease-out] rounded-3xl border'
            : 'fixed inset-0 animate-[sheet-up_360ms_cubic-bezier(.2,.8,.2,1)]'
        }`}
      >
        <div className="flex flex-col gap-4 border-b border-line px-6 pt-4.5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <h2
              id={titleId}
              className="text-xs font-semibold tracking-[0.24em] text-accent uppercase"
            >
              {order
                ? isWide
                  ? `Ativação individual · Pedido ${order}`
                  : `Pedido ${order}`
                : 'Ativação individual'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar e ir para o meu perfil"
              title="Fechar e ir para o meu perfil"
              className="grid size-9 place-items-center rounded-full bg-field text-ink-muted hover:text-ink"
            >
              <UiIcon name="close" size={17} />
            </button>
          </div>
          {isWide ? (
            <>
              <StepDots current={current} />
              {section && (
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] text-ink-faint">
                    <b className="font-semibold text-ink">{section.title}</b> · etapa{' '}
                    {section.index + 1} de {section.ids.length}
                  </span>
                  <div aria-hidden="true" className="flex gap-1">
                    {section.ids.map((id, i) => (
                      <span
                        key={id}
                        className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= section.index ? 'bg-accent' : 'bg-line'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <StepBar
              current={current}
              {...(section
                ? {
                    fraction: (section.index + 1) / section.ids.length,
                    detail: `${section.index + 1} de ${section.ids.length}`,
                  }
                : {})}
            />
          )}
        </div>
        <div
          ref={bodyRef}
          key={bodyKey}
          className="flex-1 animate-[page-in_350ms_ease-out] overflow-y-auto px-6 py-5"
        >
          {notice && (
            <p
              role="status"
              className="mb-4 rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink-muted"
            >
              {notice}
            </p>
          )}
          {children}
        </div>
        <div className="border-t border-line px-6 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  )
}
