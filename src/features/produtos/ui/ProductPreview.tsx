import { Clock } from 'lucide-react'
import { cardTiles } from '../../../shared/catalog/journeyLayout'
import { formatPrice } from '../../../shared/catalog/offer'
import type { Product } from '../../../shared/catalog/product'
import { TONE_BY_TERRITORY } from '../../../shared/ui/bannerTones'
import { ProductBanner } from '../../../shared/ui/ProductBanner'

const pill =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-muted'

function durationOf(product: Product): string {
  return product.kind === 'journey'
    ? product.durationLabel
    : `${Math.round(product.durationSec / 60)} min`
}

/** Como o produto aparece no hub (cartão) e na janela de preço, antes de salvar (mock aprovado). */
export function ProductPreview({ product }: { product: Product }) {
  const pricing = product.pricing
  return (
    <div className="flex flex-col gap-3">
      <article className="overflow-hidden rounded-[18px] border border-line bg-surface">
        <ProductBanner
          tone={TONE_BY_TERRITORY[product.territory]}
          mediaId={product.bannerMediaId}
          className="h-40"
        />
        <div className="flex flex-col gap-2 px-4 pt-3.5 pb-4">
          <div className="flex flex-wrap gap-1.5">
            <span className={pill}>
              <Clock aria-hidden size={12} />
              {durationOf(product)}
            </span>
            {product.status === 'soon' && <span className={pill}>Em breve</span>}
            {pricing.type === 'paid' ? (
              <span className={`${pill} border-accent/45 font-semibold text-accent`}>
                {formatPrice(pricing.priceCents)}
              </span>
            ) : (
              <span className={pill}>Grátis</span>
            )}
          </div>
          <b className="font-display text-xl font-medium text-ink">{product.title || 'Sem nome'}</b>
          {product.phrase && (
            <span className="font-display text-ink-muted italic">{product.phrase}</span>
          )}
          {product.kind === 'journey' && cardTiles(product).length > 0 && (
            <ul className="grid grid-cols-3 gap-2">
              {cardTiles(product).map((theme) => (
                <li
                  key={`${theme.label}-${theme.title}`}
                  className="flex aspect-square flex-col justify-between rounded-[10px] border border-line bg-[color-mix(in_oklab,var(--gold)_10%,var(--surface))] p-2 text-[0.7rem] text-ink-muted"
                >
                  <b className="font-display text-base font-medium text-accent">{theme.label}</b>
                  {theme.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
      {pricing.type === 'paid' && (
        <div className="flex flex-col gap-2 rounded-[18px] border border-line bg-surface p-4">
          <span className="text-xs tracking-[0.2em] text-ink-faint uppercase">Janela de preço</span>
          <b className="font-display text-3xl font-medium text-ink">
            {formatPrice(pricing.priceCents)}{' '}
            <small className="font-sans text-sm text-ink-faint">pagamento único</small>
          </b>
          <span className="text-sm text-ink-muted">
            ✓{' '}
            {pricing.accessMonths === null
              ? 'Acesso para sempre'
              : `Acesso por ${pricing.accessMonths} ${pricing.accessMonths === 1 ? 'mês' : 'meses'}`}{' '}
            a partir da compra
          </span>
        </div>
      )}
      {product.status === 'draft' && (
        <p className="text-sm text-ink-faint">Rascunho: ainda não aparece no site.</p>
      )}
    </div>
  )
}
