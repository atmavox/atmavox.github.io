import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { AdminTag } from './AdminTag'

export type AdminArea = 'produtos' | 'acessos' | 'ativacoes'

/**
 * A faixa azul de todas as telas do Modo Andreía (produtos, acessos e o editor de cada jornada): as
 * mesmas áreas, "Voltar ao hub" e "Ver o site" sempre no mesmo lugar. Altura fixa (52 px): as barras
 * fixas do editor ficam logo abaixo dela (`top-13`).
 */
export function AdminHeader({
  active,
  context,
  actions,
  compact = false,
}: {
  /** Celular com as abas embaixo (`AdminTabBar`): a faixa fica só com a tag. */
  compact?: boolean
  /** A área aberta; no editor de uma jornada, nenhuma (a jornada aparece em `context`). */
  active?: AdminArea
  /** O que está sendo editado ("A Chama Interna · 21 dias"). */
  context?: string
  /** Botões da tela (ex.: "Histórico"). */
  actions?: ReactNode
}) {
  const area = (id: AdminArea, label: string) => (
    <a
      href={`#/admin/${id}`}
      aria-current={active === id ? 'page' : undefined}
      className={`rounded-full px-3 py-1 text-[0.95rem] transition-colors duration-300 md:flex md:items-center md:rounded-none md:border-b-2 md:px-0 md:pt-0.5 md:pb-0 md:text-base ${
        active === id
          ? 'bg-on-admin/18 text-on-admin md:border-on-admin md:bg-transparent'
          : 'text-on-admin/80 hover:text-on-admin md:border-transparent'
      }`}
    >
      {label}
    </a>
  )
  // O mesmo realce do "Começar a editar" da faixa do site.
  const exit =
    'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-on-admin/90 transition-colors hover:bg-on-admin/12 hover:text-on-admin sm:px-3'

  if (compact) {
    return (
      <header className="sticky top-0 z-40 flex h-13 items-center justify-between gap-3 bg-admin px-4 text-sm text-on-admin">
        <AdminTag />
        {actions}
      </header>
    )
  }

  return (
    // Computador: como o cabeçalho do site, as áreas no meio (Modo Andreía à esquerda, saídas à direita).
    <header className="sticky top-0 z-40 flex h-13 items-center gap-2 bg-admin px-4 text-sm text-on-admin sm:gap-4 sm:px-5 md:grid md:grid-cols-[1fr_auto_1fr]">
      <span className="hidden min-w-0 items-center gap-3 sm:flex">
        <AdminTag />
        {context && (
          <span className="hidden min-w-0 truncate rounded-full bg-on-admin/16 px-3 py-0.5 text-[13px] lg:inline">
            {context}
          </span>
        )}
      </span>
      <nav
        aria-label="Áreas do Modo Andreía"
        className="flex shrink-0 gap-0.5 md:gap-7 md:self-stretch"
      >
        {area('produtos', 'Produtos')}
        {area('ativacoes', 'Ativações')}
        {area('acessos', 'Acessos')}
      </nav>
      <span className="ml-auto flex shrink-0 items-center justify-end gap-1 sm:gap-2">
        <a href="#/jornadas" className={exit} aria-label="Voltar ao hub">
          <span className="hidden sm:inline">Voltar ao hub</span>
          <ArrowUpRight aria-hidden size={15} />
        </a>
        <a href="#/" className={exit} aria-label="Ver o site">
          <span className="hidden sm:inline">Ver o site</span>
          <ArrowUpRight aria-hidden size={15} />
        </a>
        {actions}
      </span>
    </header>
  )
}
