import type { Product } from '../../../shared/catalog/product'
import { whoStillHasAccess, type AccessStats } from '../domain/availability'
import { Overlay } from './ativacoes/Overlay'

/**
 * Confirmação de "Inativar produto" (mock aprovado, "Tirar do ar" A): o que acontece com o site, com
 * quem tem acesso e com o perfil dessas pessoas, antes de decidir.
 */
export function RetireDialog({
  product,
  stats,
  isWide,
  isBusy,
  onConfirm,
  onClose,
}: {
  product: Product
  stats: AccessStats | null
  isWide: boolean
  isBusy: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const isJourney = product.kind === 'journey'
  const isFree = product.pricing.type === 'free'
  const who = isFree
    ? 'Quem já começou continua com acesso.'
    : stats
      ? `${whoStillHasAccess(stats)} Elas continuam até o fim do prazo delas.`
      : 'Quem tem acesso continua até o fim do prazo.'
  return (
    <Overlay
      title={`Inativar "${product.title}"?`}
      isWide={isWide}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center rounded-full border border-line px-[18px] text-sm font-semibold text-ink-muted transition-colors hover:border-admin hover:text-admin-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className="inline-flex min-h-10 items-center rounded-full bg-wine px-[18px] text-sm font-semibold text-on-admin transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isBusy ? 'Inativando…' : 'Inativar produto'}
          </button>
        </div>
      }
    >
      <ul className="flex list-disc flex-col gap-2 pl-5 text-ink-muted marker:text-ink-faint">
        <li>Sai da vitrine, dos hubs e da busca, e ninguém mais {isFree ? 'começa' : 'compra'}.</li>
        <li>{who}</li>
        <li>
          No perfil delas, a {isJourney ? 'jornada' : 'meditação'} aparece como{' '}
          <b className="font-semibold text-ink">"Em recolhimento"</b>, com o que fizeram guardado.
        </li>
        <li>Você pode publicar de novo quando quiser.</li>
      </ul>
    </Overlay>
  )
}
