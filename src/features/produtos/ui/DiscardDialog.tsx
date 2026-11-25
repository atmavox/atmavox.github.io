import type { Product } from '../../../shared/catalog/product'
import { Overlay } from './ativacoes/Overlay'

/** Confirmação de "Descartar": numa janela, para os botões do editor não mudarem de lugar. */
export function DiscardDialog({
  product,
  isWide,
  isBusy,
  onConfirm,
  onClose,
}: {
  product: Product
  isWide: boolean
  isBusy: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Overlay
      title={`Descartar "${product.title}"?`}
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
            {isBusy ? 'Descartando…' : 'Descartar'}
          </button>
        </div>
      }
    >
      <p className="text-ink-muted">
        {product.kind === 'journey' ? 'A jornada' : 'A meditação'} sai da lista de produtos
        {product.kind === 'journey' ? ', junto com o rascunho do conteúdo' : ''}. Isso não tem
        volta.
      </p>
    </Overlay>
  )
}
