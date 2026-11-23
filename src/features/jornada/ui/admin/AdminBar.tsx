import { useCatalog } from '../../../../shared/catalog/CatalogContext'
import { useJourney } from '../useJourney'
import { EditorIcon } from './EditorIcon'

const pill = 'rounded-full bg-on-admin/16 px-3 py-0.5 text-[13px]'

/** A barra azul do Modo Andreía: deixa claro, o tempo todo, que ela está editando. */
export function AdminBar({ onHistory }: { onHistory?: () => void }) {
  const { journey } = useJourney()
  const product = useCatalog().find(journey.id)
  const name =
    product && product.kind === 'journey'
      ? `${product.title} · ${product.durationLabel}`
      : 'A Chama Interna · 21 dias'
  return (
    <header className="sticky top-0 z-40 flex h-13 items-center gap-3 bg-admin px-4 text-on-admin sm:px-5">
      <span className="font-display tracking-[0.12em]">ATMAVOX</span>
      <span className={pill}>Modo Andreía</span>
      <span className={`${pill} hidden sm:inline`}>{name}</span>
      <a href="#/admin/produtos" className="hidden text-sm hover:underline sm:inline">
        Produtos
      </a>
      <span className="flex-1" />
      {onHistory && (
        <button
          type="button"
          onClick={onHistory}
          className="inline-flex items-center gap-2 rounded-full border border-on-admin/45 px-3.5 py-1.5 text-sm hover:bg-on-admin/10"
        >
          <EditorIcon name="clock" size={18} />
          Histórico
        </button>
      )}
    </header>
  )
}
