import type { AdminArea } from './AdminHeader'
import { UiIcon, type UiIconName } from './UiIcon'

const ITEMS: readonly { id: AdminArea | 'site'; label: string; href: string; icon: UiIconName }[] =
  [
    { id: 'produtos', label: 'Produtos', href: '#/admin/produtos', icon: 'box' },
    { id: 'ativacoes', label: 'Ativações', href: '#/admin/ativacoes', icon: 'spark' },
    { id: 'acessos', label: 'Acessos', href: '#/admin/acessos', icon: 'key' },
    { id: 'site', label: 'Ver o site', href: '#/', icon: 'out' },
  ]

/**
 * Celular (mock aprovado, A): as áreas do Modo Andreía nas abas de baixo, e o site na última. As
 * seções de cada área (Pedidos, Agenda…) ficam numa linha no topo da tela.
 */
export function AdminTabBar({ active }: { active: AdminArea }) {
  return (
    <nav
      aria-label="Áreas do Modo Andreía"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      {ITEMS.map((item) => (
        <a
          key={item.id}
          href={item.href}
          aria-current={item.id === active ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
            item.id === active ? 'font-semibold text-admin-ink' : 'text-ink-faint'
          }`}
        >
          <UiIcon name={item.icon} size={21} />
          {item.label}
        </a>
      ))}
    </nav>
  )
}
