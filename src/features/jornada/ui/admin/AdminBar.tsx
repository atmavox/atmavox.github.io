import { useCatalog } from '../../../../shared/catalog/CatalogContext'
import { AdminHeader } from '../../../../shared/ui/AdminHeader'
import { useJourney } from '../useJourney'
import { EditorIcon } from './EditorIcon'

/** A faixa azul do editor da jornada: a mesma das outras telas do Modo Andreía, com o Histórico. */
export function AdminBar({ onHistory }: { onHistory?: () => void }) {
  const { journey } = useJourney()
  const product = useCatalog().find(journey.id)
  const name =
    product && product.kind === 'journey'
      ? `${product.title} · ${product.durationLabel}`
      : 'A Chama Interna · 21 dias'
  return (
    <AdminHeader
      context={name}
      actions={
        onHistory && (
          <button
            type="button"
            onClick={onHistory}
            aria-label="Histórico"
            className="inline-flex items-center gap-2 rounded-full border border-on-admin/45 px-3 py-1.5 text-sm hover:bg-on-admin/10"
          >
            <EditorIcon name="clock" size={18} />
            <span className="hidden sm:inline">Histórico</span>
          </button>
        )
      }
    />
  )
}
