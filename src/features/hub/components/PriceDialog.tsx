import { ArrowLeft, ArrowRight, Check, Clock, Lock, ShieldCheck, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuthSession } from '../../../shared/auth/AuthContext'
import { useAccess } from '../../../shared/catalog/AccessContext'
import { paymentsUrl, requestCheckout } from '../../../shared/catalog/checkout'
import { formatPrice } from '../../../shared/catalog/offer'
import type { Product } from '../../../shared/catalog/product'
import { TONE_BY_TERRITORY } from '../../../shared/ui/bannerTones'
import { ProductBanner } from '../../../shared/ui/ProductBanner'
import { journeyStructureLabel } from '../journeyFilters'
import { formatDuration, mediaLabel } from '../meditations'

interface PriceDialogProps {
  product: Product
  onClose: () => void
}

const pill =
  'inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/82 px-2.5 py-0.5 text-xs text-ink-muted'

function accessText(months: number | null): string {
  if (months === null) return 'Acesso para sempre, a partir da compra'
  return `Acesso por ${months} ${months === 1 ? 'mês' : 'meses'} a partir da compra`
}

/**
 * Preço de um produto pago, depois do login (mock aprovado, F·2). "Pagar" abre o Mercado Pago pelo
 */
export function PriceDialog({ product, onClose }: PriceDialogProps) {
  const titleId = useId()
  const { session } = useAuthSession()
  const access = useAccess()
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const workerUrl = paymentsUrl(import.meta.env)

  async function pay(url: string) {
    setIsBusy(true)
    setError(null)
    const result = await requestCheckout({
      workerUrl: url,
      productId: product.id,
      idToken: session ? await session.getIdToken() : null,
    })
    if (result.kind === 'redirect') {
      window.location.assign(result.url)
      return
    }
    setIsBusy(false)
    if (result.kind === 'already-owned') {
      // Já tinha acesso (outro aparelho, liberação manual): atualiza e fecha.
      await access.refresh()
      onClose()
    } else if (result.kind === 'login') {
      setError('Sua sessão expirou. Entre de novo para continuar.')
    } else {
      setError('Não foi possível abrir o pagamento agora. Tente de novo em instantes.')
    }
  }
  const dialogRef = useRef<HTMLDivElement>(null)
  const pricing = product.pricing
  const isJourney = product.kind === 'journey'

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const appRoot = document.getElementById('root')
    appRoot?.setAttribute('inert', '')
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      appRoot?.removeAttribute('inert')
      previouslyFocused?.focus()
    }
  }, [onClose])

  if (pricing.type !== 'paid') return null

  const includes = isJourney
    ? [
        `${product.durationLabel} de rituais, escrita e presença, ${journeyStructureLabel(product).toLowerCase()}`,
        accessText(pricing.accessMonths),
        'Progresso e reflexões salvos na sua conta',
      ]
    : [
        `${mediaLabel(product)} de ${formatDuration(product.durationSec)}, quantas vezes quiser`,
        ...(product.ebook ? [`E-book em PDF (${product.ebook.pages} páginas) para baixar`] : []),
        accessText(pricing.accessMonths),
      ]

  return createPortal(
    <div className="fixed inset-0 z-40 grid animate-[fade-in_250ms_ease-out] place-items-end bg-[color-mix(in_oklab,var(--bg)_35%,rgb(20_14_10/0.35))] sm:place-items-center">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-dvh w-full max-w-[520px] animate-[dialog-in_320ms_ease-out] flex-col gap-4 overflow-y-auto rounded-t-3xl border border-line bg-bg p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_30px_80px_rgb(20_14_10/0.35)] sm:rounded-3xl sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-full border border-line bg-bg text-ink-muted hover:text-accent"
        >
          <X aria-hidden size={16} />
        </button>
        <ProductBanner
          tone={TONE_BY_TERRITORY[product.territory]}
          mediaId={product.bannerMediaId}
          className="aspect-video rounded-[18px]"
        >
          <span className="absolute bottom-3 left-3.5 flex gap-1.5">
            <span className={pill}>
              <Clock aria-hidden size={13} />
              {isJourney ? product.durationLabel : formatDuration(product.durationSec)}
            </span>
          </span>
        </ProductBanner>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">
            {isJourney ? 'Jornada paga' : 'Meditação paga'}
          </p>
          <h2 id={titleId} className="font-display text-[1.75rem] leading-tight text-ink">
            {product.title}
          </h2>
        </div>
        <p className="flex items-baseline gap-2 font-display text-[2.6rem] leading-none text-ink">
          {formatPrice(pricing.priceCents)}
          <small className="font-sans text-[0.95rem] text-ink-faint">pagamento único</small>
        </p>
        <ul className="flex flex-col gap-2.5">
          {includes.map((text) => (
            <li key={text} className="flex items-start gap-2.5 leading-snug text-ink-muted">
              <Check aria-hidden size={18} className="mt-0.5 shrink-0 text-accent" />
              {text}
            </li>
          ))}
          <li className="flex items-start gap-2.5 leading-snug text-ink-muted">
            <ShieldCheck aria-hidden size={18} className="mt-0.5 shrink-0 text-accent" />
            Pagamento seguro pelo Mercado Pago, com Pix ou cartão
          </li>
        </ul>
        {error && (
          <p role="alert" className="text-sm text-accent">
            {error}
          </p>
        )}
        {workerUrl ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => void pay(workerUrl)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-bg hover:opacity-90 disabled:opacity-60"
          >
            {isBusy ? 'Abrindo o Mercado Pago…' : isJourney ? 'Pagar e começar' : 'Pagar e ouvir'}
            {!isBusy && <ArrowRight aria-hidden size={18} />}
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-bg disabled:opacity-55"
          >
            <Lock aria-hidden size={18} />
            Pagamento em breve
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full font-semibold text-ink-muted hover:text-accent"
        >
          <ArrowLeft aria-hidden size={18} />
          {isJourney ? 'Voltar para as jornadas' : 'Voltar para as meditações'}
        </button>
      </div>
    </div>,
    document.body,
  )
}
