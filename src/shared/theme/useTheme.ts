import { useCallback, useSyncExternalStore } from 'react'
import { DEFAULT_THEME, oppositeTheme, parseTheme, THEME_STORAGE_KEY, type Theme } from './theme'

// O tema inicial é aplicado por um script inline no index.html, antes da primeira pintura.
// Aqui o atributo data-theme do <html> é a fonte da verdade.
const listeners = new Set<() => void>()

function readTheme(): Theme {
  return parseTheme(document.documentElement.dataset.theme) ?? DEFAULT_THEME
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Navegação privada ou armazenamento bloqueado: o tema vale só para esta visita.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => DEFAULT_THEME)
  const toggleTheme = useCallback(() => applyTheme(oppositeTheme(readTheme())), [])
  return { theme, toggleTheme }
}
