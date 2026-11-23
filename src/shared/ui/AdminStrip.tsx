import { ArrowUpRight } from 'lucide-react'

/**
 * Faixa azul do Modo Andreía para quando a admin está navegando pelo site (hubs): deixa claro que é a
 * conta dela e leva à edição. Produtos, Acessos e Ativações ficam no cabeçalho das telas de edição.
 */
export function AdminStrip() {
  return (
    <div className="flex animate-[fade-in_300ms_ease-out] flex-wrap items-center gap-x-3 gap-y-1 bg-admin px-5 py-2 text-sm text-on-admin">
      <b className="font-semibold">Modo Andreía</b>
      <span className="text-on-admin/80">você está vendo o site como a admin</span>
      <a
        href="#/admin/produtos"
        className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.95rem] transition-colors hover:bg-on-admin/12"
      >
        Começar a editar
        <ArrowUpRight aria-hidden size={16} />
      </a>
    </div>
  )
}
