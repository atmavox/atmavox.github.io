import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

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
}: {
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
      className={`rounded-full px-3 py-1.5 transition-colors ${
        active === id
          ? 'bg-on-admin/18 font-medium text-on-admin'
          : 'text-on-admin/80 hover:text-on-admin'
      }`}
    >
      {label}
    </a>
  )
  const exit = 'inline-flex items-center gap-1.5 text-on-admin/90 hover:text-on-admin'

  return (
    <header className="sticky top-0 z-40 flex h-13 items-center gap-2 bg-admin px-4 text-sm text-on-admin sm:gap-4 sm:px-5">
      <b className="hidden shrink-0 font-semibold sm:inline">Modo Andreía</b>
      <nav aria-label="Áreas do Modo Andreía" className="flex shrink-0 gap-0.5">
        {area('produtos', 'Produtos')}
        {area('acessos', 'Acessos')}
        {area('ativacoes', 'Ativações')}
      </nav>
      {context && (
        <span className="hidden min-w-0 truncate rounded-full bg-on-admin/16 px-3 py-0.5 text-[13px] lg:inline">
          {context}
        </span>
      )}
      <span className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
        <a href="#/jornadas" className={exit} aria-label="Voltar ao hub">
          <ArrowLeft aria-hidden size={15} />
          <span className="hidden sm:inline">Voltar ao hub</span>
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
