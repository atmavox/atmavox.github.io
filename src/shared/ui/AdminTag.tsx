/**
 * A marca do Modo Andreía: uma tag pequena no canto da faixa azul, com uma linha bem pequena ao lado
 * dizendo que é a área da admin. Igual no site e nas telas de edição.
 */
export function AdminTag({ note = 'área da admin' }: { note?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2 whitespace-nowrap">
      <b className="shrink-0 rounded-full bg-on-admin/18 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
        Modo Andreía
      </b>
      <span className="hidden truncate text-[11px] text-on-admin/70 sm:inline">{note}</span>
    </span>
  )
}
