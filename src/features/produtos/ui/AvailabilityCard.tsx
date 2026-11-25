import { InfoTip } from '../../../shared/ui/InfoTip'
import type { Product } from '../../../shared/catalog/product'
import { whoStillHasAccess, type AccessStats } from '../domain/availability'

const DATE = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })

/** Os números do cartão: com acesso agora e quando vence o último (ou "Para sempre"). */
function StatTiles({ stats }: { stats: AccessStats }) {
  const last = stats.hasForever
    ? 'Para sempre'
    : stats.lastExpiresAt === null
      ? '—'
      : DATE.format(stats.lastExpiresAt)
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="rounded-[14px] border border-line bg-bg px-3 py-2.5">
        <b className="block font-display text-2xl font-medium text-ink">{stats.active}</b>
        <span className="text-xs text-ink-faint">com acesso agora</span>
      </div>
      <div className="rounded-[14px] border border-line bg-bg px-3 py-2.5">
        <b className="block font-display text-2xl font-medium text-ink">{last}</b>
        <span className="text-xs text-ink-faint">último acesso vence</span>
      </div>
    </div>
  )
}

/**
 * Produto que já foi ao ar (mock aprovado, "Tirar do ar" C): Publicada, com quem tem acesso e o botão
 * "Inativar produto"; ou Indisponível, em cinza (o "Publicar de novo" fica na linha dos botões).
 */
export function AvailabilityCard({
  product,
  stats,
  isBusy,
  onRetire,
}: {
  product: Product
  /** `null` enquanto carrega (ou sem conexão). */
  stats: AccessStats | null
  isBusy: boolean
  onRetire: () => void
}) {
  const isFree = product.pricing.type === 'free'
  const noun = product.kind === 'journey' ? 'jornada' : 'meditação'

  if (product.status === 'retired') {
    return (
      <div className="flex flex-col gap-3 rounded-[14px] bg-gray-state/10 p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-state/18 px-3 py-0.5 text-sm font-semibold text-ink-muted">
              Indisponível
            </span>
            {product.retiredAt !== undefined && (
              <span className="text-sm text-ink-faint">desde {DATE.format(product.retiredAt)}</span>
            )}
          </p>
        </div>
        <p className="text-sm text-ink-muted">
          {isFree
            ? 'Quem já tinha começado continua com acesso.'
            : stats
              ? whoStillHasAccess(stats)
              : 'Quem tem acesso continua até o fim do prazo.'}{' '}
          Para essas pessoas, a {noun} aparece como "Em recolhimento". Para editar, publique de
          novo.
        </p>
      </div>
    )
  }

  // Publicada: quem tem acesso e o botão para tirar do ar, abaixo da Situação.
  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-sm text-ink-muted">
          Quem tem acesso
          {isFree && (
            <InfoTip label="Sobre os acessos">
              É grátis: aqui só entram os acessos liberados a alguém. Quem começou sem acesso
              liberado não aparece, mas continua com acesso se você inativar.
            </InfoTip>
          )}
        </span>
        <button
          type="button"
          disabled={isBusy}
          onClick={onRetire}
          className="inline-flex min-h-8 items-center rounded-full border border-wine/45 px-3.5 text-[13px] font-semibold whitespace-nowrap text-wine transition-colors duration-200 hover:border-wine disabled:opacity-60 motion-reduce:transition-none"
        >
          Inativar produto
        </button>
      </div>
      {stats ? <StatTiles stats={stats} /> : <p className="text-sm text-ink-faint">Carregando…</p>}
    </div>
  )
}
