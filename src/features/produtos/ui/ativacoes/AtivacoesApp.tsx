import { useMediaQuery } from '../../../../shared/lib/useMediaQuery'
import type { AtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import { AgendaPanel } from './AgendaPanel'
import { AnamnesisPanel } from './AnamnesisPanel'
import { MessagesPanel } from './MessagesPanel'
import { OrdersPanel } from './OrdersPanel'
import { TherapiesPanel } from './TherapiesPanel'

import type { AtivacoesSection } from './sections'

const SECTIONS: readonly { id: AtivacoesSection; label: string }[] = [
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'terapias', label: 'Terapias' },
  { id: 'anamnese', label: 'Anamnese' },
  { id: 'mensagens', label: 'Mensagens' },
]

/**
 * Modo Andreía da ativação individual (mock aprovado, `atmavox-ativacao-andreia-v3.html`): abas
 * embaixo da faixa azul no computador; no celular, abas embaixo da tela e um botão redondo que volta
 * ao site.
 */
export function AtivacoesApp({
  backend,
  section,
}: {
  backend: AtivacoesBackend
  section: AtivacoesSection
}) {
  const isWide = useMediaQuery('(min-width: 900px)')
  const panel =
    section === 'pedidos' ? (
      <OrdersPanel backend={backend} isWide={isWide} />
    ) : section === 'agenda' ? (
      <AgendaPanel backend={backend} isWide={isWide} />
    ) : section === 'mensagens' ? (
      <MessagesPanel backend={backend} isWide={isWide} />
    ) : section === 'anamnese' ? (
      <AnamnesisPanel backend={backend} isWide={isWide} />
    ) : (
      <TherapiesPanel backend={backend} isWide={isWide} />
    )

  if (isWide) {
    return (
      <>
        <nav
          aria-label="Ativação individual"
          // Como o menu do site: texto e sublinhado âmbar no item aberto, alinhado ao conteúdo.
          className="sticky top-13 z-30 h-12 border-b border-line bg-bg/90 backdrop-blur"
        >
          <div className="mx-auto flex h-full max-w-6xl gap-7 px-7">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#/admin/ativacoes/${s.id}`}
                aria-current={section === s.id ? 'page' : undefined}
                className={`flex items-center border-b-2 pt-0.5 text-[0.95rem] transition-colors duration-300 hover:text-accent ${
                  section === s.id ? 'border-accent text-ink' : 'border-transparent text-ink-muted'
                }`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </nav>
        {panel}
      </>
    )
  }

  // Celular (mock aprovado, A): as seções numa linha no topo, como o menu do site, que desliza para o
  // lado; as áreas do Modo Andreía ficam nas abas de baixo (AdminTabBar).
  return (
    <>
      <nav
        aria-label="Ativação individual"
        className="sticky top-13 z-30 flex h-11 gap-5 overflow-x-auto border-b border-line bg-bg/90 px-4 backdrop-blur [scrollbar-width:none]"
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#/admin/ativacoes/${s.id}`}
            aria-current={section === s.id ? 'page' : undefined}
            className={`flex shrink-0 items-center border-b-2 pt-0.5 text-sm whitespace-nowrap transition-colors ${
              section === s.id ? 'border-accent text-ink' : 'border-transparent text-ink-muted'
            }`}
          >
            {s.label}
          </a>
        ))}
      </nav>
      {panel}
    </>
  )
}
