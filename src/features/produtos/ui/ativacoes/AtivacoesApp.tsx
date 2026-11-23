import { useMediaQuery } from '../../../../shared/lib/useMediaQuery'
import { UiIcon, type UiIconName } from '../../../../shared/ui/UiIcon'
import type { AtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import { AgendaPanel } from './AgendaPanel'
import { AnamnesisPanel } from './AnamnesisPanel'
import { MessagesPanel } from './MessagesPanel'
import { OrdersPanel } from './OrdersPanel'
import { TherapiesPanel } from './TherapiesPanel'

import type { AtivacoesSection } from './sections'

const SECTIONS: readonly { id: AtivacoesSection; label: string; icon: UiIconName }[] = [
  { id: 'pedidos', label: 'Pedidos', icon: 'inbox' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  { id: 'terapias', label: 'Terapias', icon: 'leaf' },
  { id: 'anamnese', label: 'Anamnese', icon: 'file' },
  { id: 'mensagens', label: 'Mensagens', icon: 'chat' },
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

  return (
    <>
      <div className="pb-24">{panel}</div>
      <a
        href="#/"
        aria-label="Ver o site"
        title="Ver o site"
        className="fixed right-4 bottom-[84px] z-30 grid size-12 place-items-center rounded-full bg-ink text-bg shadow-[0_8px_20px_rgb(20_14_10/0.3)]"
      >
        <UiIcon name="home" size={21} />
      </a>
      <nav
        aria-label="Ativação individual"
        className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
        style={{ gridTemplateColumns: `repeat(${SECTIONS.length}, 1fr)` }}
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#/admin/ativacoes/${s.id}`}
            aria-current={section === s.id ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${
              section === s.id ? 'font-semibold text-admin-ink' : 'text-ink-faint'
            }`}
          >
            <UiIcon name={s.icon} size={21} />
            {s.label}
          </a>
        ))}
      </nav>
    </>
  )
}
