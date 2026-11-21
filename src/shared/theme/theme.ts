export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'atmavox:theme'

export function parseTheme(value: unknown): Theme | null {
  return value === 'light' || value === 'dark' ? value : null
}

/** Escolha salva vence; sem escolha, segue o sistema; na dúvida, escuro (padrão da marca). */
export function resolveInitialTheme(stored: unknown, systemPrefersLight: boolean): Theme {
  return parseTheme(stored) ?? (systemPrefersLight ? 'light' : 'dark')
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}
