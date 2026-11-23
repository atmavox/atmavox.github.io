/**
 * Faixa azul do Modo Andreía para quando a admin está navegando pelo site (hubs): deixa claro que é a
 * conta dela e leva às áreas de edição. Cada jornada se edita pelo produto dela (ou pela faixa dentro
 * da própria jornada): um "Editar a jornada" solto não diria qual.
 */
export function AdminStrip() {
  const link = 'rounded-full px-3 py-1 hover:bg-on-admin/12'
  return (
    <div className="flex animate-[fade-in_300ms_ease-out] flex-wrap items-center gap-x-3 gap-y-1 bg-admin px-5 py-2 text-sm text-on-admin">
      <b className="font-semibold">Modo Andreía</b>
      <span className="text-on-admin/80">você está vendo o site como a admin</span>
      <nav aria-label="Áreas do Modo Andreía" className="ml-auto flex flex-wrap gap-1">
        <a href="#/admin/produtos" className={link}>
          Produtos
        </a>
        <a href="#/admin/acessos" className={link}>
          Acessos
        </a>
      </nav>
    </div>
  )
}
