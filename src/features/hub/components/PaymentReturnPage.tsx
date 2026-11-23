import { ArrowRight, CheckCircle2, Clock, MessageCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuthSession } from '../../../shared/auth/AuthContext'
import { useAccess } from '../../../shared/catalog/AccessContext'
import { seedCatalog } from '../../../shared/catalog/seedCatalog'
import { useNow } from '../../../shared/lib/useNow'
import { contactCta } from '../content'
import type { PaymentReturn } from '../navigation'

/** Até ~1 minuto conferindo: o aviso do Mercado Pago costuma chegar em segundos. */
const POLL_MS = 3000
const MAX_POLLS = 20

const button =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90'
const ghost =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-accent/50 px-6 font-semibold text-accent hover:bg-accent/10'

/** Volta do Mercado Pago (ADR-023): aprovado, em análise ou não concluído. */
export function PaymentReturnPage({
  payment,
  layout,
}: {
  payment: PaymentReturn
  layout: 'wide' | 'narrow'
}) {
  const product = seedCatalog.find((p) => p.id === payment.productId)
  const access = useAccess()
  const { state } = useAuthSession()
  const now = useNow()
  const [polls, setPolls] = useState(0)
  const owns = product ? access.owns(product.id, now) : false
  const isLogged = !!state?.user
  const isWaiting = payment.status === 'aprovado' && !owns && isLogged && polls < MAX_POLLS

  // Aprovado e o acesso ainda não chegou: confere de novo de tempos em tempos.
  useEffect(() => {
    if (!isWaiting) return
    const timer = setTimeout(() => {
      void access.refresh().finally(() => setPolls((n) => n + 1))
    }, POLL_MS)
    return () => clearTimeout(timer)
  }, [isWaiting, polls, access])

  const productHref = product
    ? product.kind === 'journey'
      ? `#/jornada/${product.id}`
      : `#/meditacao/${product.id}`
    : '#/'
  const backHref = product?.kind === 'meditation' ? '#/meditacoes' : '#/jornadas'
  const wrap =
    layout === 'wide'
      ? 'mx-auto flex w-full max-w-xl flex-col items-center gap-5 px-6 py-20 text-center'
      : 'flex flex-col items-center gap-5 py-10 text-center'

  if (payment.status === 'recusado') {
    return (
      <section className={wrap}>
        <XCircle aria-hidden size={44} className="text-accent" />
        <h1 className="font-display text-3xl text-ink">O pagamento não foi concluído</h1>
        <p className="text-ink-muted">
          Você pode tentar de novo, com Pix ou outro cartão. Se algo foi cobrado, o Mercado Pago
          devolve automaticamente.
        </p>
        <a href={backHref} className={button}>
          Voltar e tentar de novo
        </a>
      </section>
    )
  }

  if (payment.status === 'pendente') {
    return (
      <section className={wrap}>
        <Clock aria-hidden size={44} className="text-accent" />
        <h1 className="font-display text-3xl text-ink">Pagamento em análise</h1>
        <p className="text-ink-muted">
          Assim que o Mercado Pago confirmar, o acesso é liberado sozinho na sua conta
          {product ? ` e ${product.title} aparece como "Sua"` : ''}.
        </p>
        <a href={backHref} className={ghost}>
          Voltar para a lista
        </a>
      </section>
    )
  }

  if (owns && product) {
    return (
      <section className={wrap}>
        <CheckCircle2 aria-hidden size={44} className="text-ok" />
        <h1 className="font-display text-3xl text-ink">Pronto, {product.title} é sua</h1>
        <p className="text-ink-muted">Obrigada pela confiança. Seu acesso já está na sua conta.</p>
        <a href={productHref} className={button}>
          {product.kind === 'journey' ? 'Começar agora' : 'Ouvir agora'}
          <ArrowRight aria-hidden size={18} />
        </a>
      </section>
    )
  }

  return (
    <section className={wrap} aria-busy={isWaiting}>
      <CheckCircle2 aria-hidden size={44} className="text-ok" />
      <h1 className="font-display text-3xl text-ink">Pagamento aprovado</h1>
      {!isLogged ? (
        <p className="text-ink-muted">
          Entre na sua conta para ver o acesso: ele fica guardado nela.
        </p>
      ) : isWaiting ? (
        <p className="text-ink-muted" role="status">
          Liberando o seu acesso…
        </p>
      ) : (
        <>
          <p className="text-ink-muted">
            O acesso está a caminho e aparece na sua conta em alguns minutos. Se demorar, fale com a
            Andreía.
          </p>
          <a href={contactCta.href} target="_blank" rel="noopener noreferrer" className={ghost}>
            <MessageCircle aria-hidden size={18} />
            {contactCta.label}
          </a>
        </>
      )}
      <a href={backHref} className="text-sm text-ink-muted underline underline-offset-4">
        Voltar para a lista
      </a>
    </section>
  )
}
