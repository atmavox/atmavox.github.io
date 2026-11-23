const button =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-[18px] text-sm font-semibold whitespace-nowrap transition-opacity'
export const adminButton = `${button} bg-admin text-on-admin hover:opacity-90 disabled:opacity-60`
export const ghostButton = `${button} border border-line bg-surface text-ink-muted hover:border-admin hover:text-admin-ink`

/** Campos de texto do Modo Andreía de produtos (foco azul, como a faixa). */
export const inputClass =
  'min-h-[42px] w-full rounded-xl border border-line bg-field px-3 text-ink placeholder:text-ink-faint transition-colors focus:border-admin focus:outline-none'
