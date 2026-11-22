import { ThemeToggle } from '../../../shared/theme/ThemeToggle'
import { JOURNEY_TABS, type JourneyTabId } from '../application/navigation'
import { tabProgress } from '../application/tabProgress'
import { overallProgress } from '../domain/measures'
import { AccountButton } from './account/AccountButton'
import { useJourney } from './useJourney'

/** A cor da aba vai do cinza ao âmbar conforme a etapa avança: "sair do cinza". */
function stageColor(ratio: number): string {
  const percent = Math.round(ratio * 100)
  return `color-mix(in oklab, var(--accent) ${percent}%, var(--gray-state))`
}

export function JourneyHeader({ activeTab }: { activeTab: JourneyTabId }) {
  const { journey, progress } = useJourney()
  const overall = overallProgress(progress)

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4">
        <a
          href="#/"
          className="py-3 font-display tracking-[0.15em] text-gold uppercase"
          aria-label="ATMAVOX, voltar para a página principal"
        >
          Atmavox
        </a>
        <nav aria-label="Etapas da jornada" className="min-w-0 flex-1">
          <ul className="flex overflow-x-auto [scrollbar-width:none]">
            {JOURNEY_TABS.map((tab) => {
              const isActive = tab.id === activeTab
              const stage = tabProgress(tab.id, journey, progress)
              return (
                <li key={tab.id} className="shrink-0">
                  <a
                    href={tab.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex flex-col items-center gap-1 border-b-2 px-3 pt-3 pb-2 text-xs font-medium tracking-wider whitespace-nowrap uppercase transition-colors ${
                      isActive ? 'border-accent text-ink' : 'border-transparent hover:text-ink'
                    }`}
                    style={isActive ? undefined : { color: stageColor(stage.ratio) }}
                  >
                    <span>
                      {tab.label}
                      {stage.isComplete && (
                        <>
                          <span aria-hidden="true"> ✦</span>
                          <span className="sr-only">, completa</span>
                        </>
                      )}
                    </span>{' '}
                    <span className="flex w-full items-center gap-1.5">
                      <span aria-hidden="true" className="h-0.5 flex-1 rounded-full bg-line">
                        <span
                          className="block h-full rounded-full bg-accent transition-[width] duration-500"
                          style={{ width: `${Math.round(stage.ratio * 100)}%` }}
                        />
                      </span>
                      <span className="text-[0.65rem] tracking-normal normal-case">
                        <span className="sr-only">progresso:</span> {stage.caption}
                      </span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        <AccountButton />
        <ThemeToggle />
      </div>
      <div
        role="progressbar"
        aria-label="Progresso geral da jornada"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(overall.ratio * 100)}
        className="h-0.5 bg-line"
      >
        <div
          className="h-full bg-linear-to-r from-accent to-gold transition-[width] duration-500"
          style={{ width: `${Math.round(overall.ratio * 100)}%` }}
        />
      </div>
    </header>
  )
}
