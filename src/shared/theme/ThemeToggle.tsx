import { useTheme } from './useTheme'

// Sol de raios e lua crescente em traço fino (mock `Downloads/atmavox-icones-emoji.html`, opção 1):
// sem emoji, que cada aparelho desenha de um jeito (conventions.md).
const SUN = (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M5.5 18.5l1.6-1.6M16.9 7.1l1.6-1.6" />
  </>
)
const MOON = <path d="M19.5 14.2A8 8 0 0 1 9.8 4.5a8 8 0 1 0 9.7 9.7z" />

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-gold transition-colors hover:bg-surface-2"
    >
      {/* No escuro mostra o sol (vai para o claro); no claro, a lua. A troca entra suave. */}
      <svg
        key={theme}
        aria-hidden="true"
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-[fade-in_250ms_ease-out]"
      >
        {theme === 'dark' ? SUN : MOON}
      </svg>
    </button>
  )
}
