export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'atmavox:theme'

/** Tema de quem chega pela primeira vez (decisão do cliente: claro "Areia"). */
export const DEFAULT_THEME: Theme = 'light'

export function parseTheme(value: unknown): Theme | null {
  return value === 'light' || value === 'dark' ? value : null
}

/** A escolha salva vence; sem escolha (primeira visita), o tema padrão. */
export function resolveInitialTheme(stored: unknown): Theme {
  return parseTheme(stored) ?? DEFAULT_THEME
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}
