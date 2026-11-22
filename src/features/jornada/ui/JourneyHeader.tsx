import { Lock } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { MiniPlayer } from '../../../shared/media/MiniPlayer'
import { ThemeToggle } from '../../../shared/theme/ThemeToggle'
import { EDITOR_HREF, JOURNEY_TABS, type JourneyTabId } from '../application/navigation'
import { isTabUnlocked } from '../application/tabAccess'
import { tabProgress } from '../application/tabProgress'
import { overallProgress } from '../domain/measures'
import { AccountButton } from './account/AccountButton'
import { useJourney } from './useJourney'

/** A cor da aba vai do cinza ao âmbar conforme a etapa avança: "sair do cinza". */
function stageColor(ratio: number): string {
  const percent = Math.round(ratio * 100)
  return `color-mix(in oklab, var(--accent) ${percent}%, var(--gray-state))`
}

/**
 * Duas linhas: marca + ações em cima; as 7 abas embaixo. No computador as abas dividem a largura toda
 * (nenhuma fica cortada); no celular rolam para o lado e a aba atual se centraliza sozinha.
 */
export function JourneyHeader({ activeTab }: { activeTab: JourneyTabId }) {
  const { journey, progress, access, isAdmin } = useJourney()
  const overall = overallProgress(journey, progress)
  const activeRef = useRef<HTMLAnchorElement>(null)

  // Centraliza a aba atual rolando só a fileira de abas (scrollIntoView rolaria a página inteira).
  useEffect(() => {
    const item = activeRef.current?.closest('li')
    const row = item?.closest('ul')
    if (!item || !row || row.scrollWidth <= row.clientWidth) return
    row.scrollLeft = item.offsetLeft - (row.clientWidth - item.offsetWidth) / 2
  }, [activeTab])

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur">
      {isAdmin && (
        // A faixa azul do Modo Andreía: ela sabe que está vendo tudo aberto, e volta a editar num toque.
        <div className="flex items-center gap-3 bg-admin px-4 py-1.5 text-sm text-on-admin md:px-8">
          <span className="rounded-full bg-on-admin/16 px-2.5 py-0.5 text-xs">Modo Andreía</span>
          <span className="hidden truncate sm:inline">você vê a jornada inteira, sem cadeados</span>
          <a href={EDITOR_HREF} className="ml-auto font-semibold whitespace-nowrap hover:underline">
            Editar a jornada →
          </a>
        </div>
      )}
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-2.5 md:px-8">
        <a
          href="#/"
          className="font-display tracking-[0.15em] text-gold uppercase"
          aria-label="ATMAVOX, voltar para a página principal"
        >
          Atmavox
        </a>
        <span aria-hidden="true" className="hidden h-4 w-px bg-line sm:block" />
        <span className="hidden truncate font-display text-ink-muted italic sm:block">
          A Chama Interna · 21 dias
        </span>
        <span className="ml-auto hidden text-sm text-ink-muted md:block">
          {overall.caption} da jornada
        </span>
        <div className="ml-auto flex items-center gap-2 md:ml-3">
          <AccountButton />
          <ThemeToggle />
        </div>
      </div>

      <nav
        aria-label="Etapas da jornada"
        className="mx-auto max-w-6xl md:px-8"
        style={{ paddingTop: '5px' }}
      >
        <ul className="relative flex snap-x overflow-x-auto px-2 [scrollbar-width:none] md:grid md:grid-cols-7 md:overflow-visible md:px-0">
          {JOURNEY_TABS.map((tab) => {
            const isActive = tab.id === activeTab
            const stage = tabProgress(tab.id, journey, progress)
            if (!isTabUnlocked(tab.id, journey, progress, access)) {
              return (
                <li key={tab.id} className="relative shrink-0 snap-center md:min-w-0">
                  <span
                    aria-disabled="true"
                    title="Complete a etapa anterior para abrir"
                    className="flex flex-col gap-1.5 border-b-2 border-transparent px-3 pt-3 pb-2.5 text-xs font-medium tracking-wider whitespace-nowrap text-ink-faint uppercase opacity-70 md:px-2 md:text-[0.8rem]"
                  >
                    <span className="flex items-center justify-center gap-1.5 md:truncate">
                      <Lock aria-hidden size={12} />
                      {tab.label}
                      <span className="sr-only">, fechada</span>
                    </span>
                    <span aria-hidden="true" className="h-1 rounded-full bg-line md:h-1.5" />
                  </span>
                </li>
              )
            }
            return (
              // `relative`: os textos só para leitor de tela (sr-only, absolutos) ficam presos à aba e
              // não alargam a página no celular.
              <li key={tab.id} className="relative shrink-0 snap-center md:min-w-0">
                <a
                  ref={isActive ? activeRef : undefined}
                  href={tab.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col gap-1.5 border-b-2 px-3 pt-3 pb-2.5 text-xs font-medium tracking-wider whitespace-nowrap uppercase transition-colors md:px-2 md:text-[0.8rem] ${
                    isActive ? 'border-accent text-ink' : 'border-transparent hover:text-ink'
                  }`}
                  style={isActive ? undefined : { color: stageColor(stage.ratio) }}
                >
                  <span className="text-center md:truncate">
                    {tab.label}
                    {stage.isComplete && (
                      <>
                        <span aria-hidden="true"> ✦</span>
                        <span className="sr-only">, completa</span>
                      </>
                    )}
                  </span>{' '}
                  <span className="flex w-full items-center gap-2">
                    <span aria-hidden="true" className="h-1 flex-1 rounded-full bg-line md:h-1.5">
                      <span
                        className="block h-full rounded-full bg-accent transition-[width] duration-500"
                        style={{ width: `${Math.round(stage.ratio * 100)}%` }}
                      />
                    </span>
                    <span className="text-[0.7rem] tracking-normal normal-case tabular-nums md:text-xs">
                      <span className="sr-only">progresso:</span> {stage.caption}
                    </span>
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

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
      <MiniPlayer />
    </header>
  )
}
