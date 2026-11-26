import { useState } from 'react'
import { useMediaQuery } from '../../../../shared/lib/useMediaQuery'
import type { AtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import { ActivityBell } from './ActivityBell'
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
  orderId = null,
  adminUid = null,
}: {
  backend: AtivacoesBackend
  section: AtivacoesSection
  /** Pedido para abrir já na tela de pedidos (link da agenda). */
  orderId?: string | null
  /** A admin logada: guarda a última visita ao sino das movimentações. */
  adminUid?: string | null
}) {
  const isWide = useMediaQuery('(min-width: 900px)')
  // A bolinha da aba Pedidos: a mesma das movimentações por ler, quando alguma é de pedido.
  const [hasUnreadOrders, setHasUnreadOrders] = useState(false)
  const bell = (
    <ActivityBell
      backend={backend}
      uid={adminUid}
      isWide={isWide}
      onUnreadOrders={setHasUnreadOrders}
    />
  )
  const unreadDot = (id: AtivacoesSection) =>
    id === 'pedidos' && hasUnreadOrders ? (
      <span
        aria-label="movimentação por ler"
        role="img"
        className="ml-1 inline-block size-2 shrink-0 -translate-y-2.5 self-center rounded-full bg-accent"
      />
    ) : null
  const panel =
    section === 'pedidos' ? (
      <OrdersPanel backend={backend} isWide={isWide} initialOrderId={orderId} />
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
                {unreadDot(s.id)}
              </a>
            ))}
            {/* O sino das movimentações, à direita das seções (mock aprovado, C). */}
            <div className="ml-auto flex items-center">{bell}</div>
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
      <div className="sticky top-13 z-30 flex h-11 items-center border-b border-line bg-bg/90 backdrop-blur">
        <nav
          aria-label="Ativação individual"
          className="flex h-full min-w-0 flex-1 gap-5 overflow-x-auto px-4 [scrollbar-width:none]"
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
              {unreadDot(s.id)}
            </a>
          ))}
        </nav>
        {/* O sino fica fora da faixa que desliza, sempre à vista. */}
        <div className="shrink-0 pr-3 pl-1">{bell}</div>
      </div>
      {panel}
    </>
  )
}
