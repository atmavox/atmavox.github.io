// As etapas da ativação individual (mock aprovado): bolinhas com linha no computador, barra em partes
// no celular (na anamnese, a parte dela enche aos poucos) e a lista na vertical ao lado do login.
import { FLOW_STEPS } from './flowOrder'

export function StepDots({ current }: { current: number }) {
  return (
    <ol aria-label={`Etapa ${current + 1} de ${FLOW_STEPS.length}`} className="flex items-start">
      {FLOW_STEPS.map((name, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'next'
        return (
          <li
            key={name}
            aria-current={state === 'current' ? 'step' : undefined}
            className={`relative flex flex-1 flex-col items-center gap-1.5 text-center text-xs ${
              state === 'current' ? 'font-semibold text-ink' : 'text-ink-faint'
            }`}
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className={`absolute top-[6px] right-[calc(50%+9px)] left-[calc(-50%+9px)] h-0.5 transition-colors duration-500 ${
                  state === 'next' ? 'bg-line' : 'bg-ok'
                }`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-[1] size-3.5 rounded-full border-2 transition-all duration-500 ${
                state === 'done'
                  ? 'border-ok bg-ok'
                  : state === 'current'
                    ? 'border-accent bg-accent shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_20%,transparent)]'
                    : 'border-line bg-bg'
              }`}
            />
            {name}
          </li>
        )
      })}
    </ol>
  )
}

/** `fraction`: quanto da etapa atual já foi (só a anamnese usa, por seção). */
export function StepBar({
  current,
  fraction,
  detail,
}: {
  current: number
  fraction?: number
  detail?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-3 text-[13px] text-ink-faint">
        <span>
          Passo {current + 1} de {FLOW_STEPS.length} ·{' '}
          <b className="font-semibold text-ink">{FLOW_STEPS[current]}</b>
        </span>
        {detail && <span>{detail}</span>}
      </div>
      <div aria-hidden="true" className="flex gap-1">
        {FLOW_STEPS.map((name, index) => {
          const fill = index < current ? 1 : index === current ? (fraction ?? 1) : 0
          return (
            <span key={name} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <span
                className="block h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${Math.round(fill * 100)}%` }}
              />
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function StepList({ current }: { current: number }) {
  return (
    <ol className="flex flex-col">
      {FLOW_STEPS.map((name, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'next'
        return (
          <li
            key={name}
            className={`relative grid grid-cols-[14px_1fr] gap-3 pb-[18px] text-sm last:pb-0 ${
              state === 'current' ? 'font-semibold text-ink' : 'text-ink-faint'
            }`}
          >
            {index < FLOW_STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute top-4 bottom-0 left-[6px] w-0.5 ${state === 'done' ? 'bg-ok' : 'bg-line'}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-[1] mt-1 size-3.5 rounded-full border-2 ${
                state === 'done'
                  ? 'border-ok bg-ok'
                  : state === 'current'
                    ? 'border-accent bg-accent shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_20%,transparent)]'
                    : 'border-line bg-bg'
              }`}
            />
            {name}
          </li>
        )
      })}
    </ol>
  )
}
