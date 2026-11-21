import { ThemeToggle } from '../../../shared/theme/ThemeToggle'
import { JOURNEY_TABS, type JourneyTabId } from '../application/navigation'

export function JourneyHeader({ activeTab }: { activeTab: JourneyTabId }) {
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
              return (
                <li key={tab.id} className="shrink-0">
                  <a
                    href={tab.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block border-b-2 px-3 py-4 text-xs font-medium tracking-wider whitespace-nowrap uppercase transition-colors ${
                      isActive
                        ? 'border-accent text-ink'
                        : 'border-transparent text-ink-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
