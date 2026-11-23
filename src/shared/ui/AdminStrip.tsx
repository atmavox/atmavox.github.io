import { ArrowUpRight } from 'lucide-react'
import { AdminTag } from './AdminTag'

/**
 * Faixa azul do Modo Andreía para quando a admin está navegando pelo site (hubs): deixa claro que é a
 * conta dela e leva à edição. Produtos, Acessos e Ativações ficam no cabeçalho das telas de edição.
 * Mesma altura (52 px) da faixa das telas de edição, sem quebrar linha.
 */
export function AdminStrip() {
  return (
    <div className="flex h-13 animate-[fade-in_300ms_ease-out] items-center gap-3 overflow-hidden bg-admin px-4 text-sm text-on-admin sm:px-5">
      <AdminTag note="você está vendo o site como a admin" />
      <a
        href="#/admin/produtos"
        className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[0.95rem] whitespace-nowrap transition-colors hover:bg-on-admin/12"
      >
        Começar a editar
        <ArrowUpRight aria-hidden size={16} />
      </a>
    </div>
  )
}
