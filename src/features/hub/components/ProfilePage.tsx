import { ArrowRight } from 'lucide-react'
import { lazy, Suspense, useState, type ReactNode } from 'react'
import { useAuthSession } from '../../../shared/auth/AuthContext'
import { LoginDialog } from '../../../shared/auth/LoginDialog'
import { useAccess } from '../../../shared/catalog/AccessContext'
import type { ProductAccess } from '../../../shared/catalog/offer'
import type { JourneyProduct, Product } from '../../../shared/catalog/product'
import { useNow } from '../../../shared/lib/useNow'
import {
  journeyTrail,
  type ProgressLoader,
  type Trail,
} from '../../../shared/progress/progressSummary'
import { useProgressSummaries } from '../../../shared/progress/useProgressSummaries'
import { coverToneAt } from '../../../shared/ui/bannerTones'
import { ProductBanner } from '../../../shared/ui/ProductBanner'
import { formatDuration, mediaLabel, meditationHref } from '../meditations'
import { useCatalog } from '../../../shared/catalog/CatalogContext'

// A aba Ativações só é baixada por quem abre (ADR-029).
const ActivationsTab = lazy(() => import('../ativacao/ActivationsTab'))

type Tab = 'geral' | 'jornadas' | 'meditacoes' | 'ativacoes' | 'conta'
const TABS: readonly { id: Tab; label: string }[] = [
  { id: 'geral', label: 'Visão geral' },
  { id: 'jornadas', label: 'Jornadas' },
  { id: 'meditacoes', label: 'Meditações' },
  { id: 'ativacoes', label: 'Ativações' },
  { id: 'conta', label: 'Conta' },
]

const DATE = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })

/** "Grátis", "Para sempre", "Até 23/11/2027" ou "Venceu em …" (mock aprovado do perfil). */
export function AccessPill({
  product,
  access,
  now,
}: {
  product: Product
  access?: ProductAccess
  now: number
}) {
  const base =
    'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs'
  if (product.pricing.type === 'free') {
    return <span className={`${base} border-line text-ink-muted`}>Grátis</span>
  }
  if (!access) return <span className={`${base} border-line text-ink-muted`}>Sem acesso</span>
  if (access.expiresAt === null) {
    return (
      <span className={`${base} border-transparent bg-ok/14 font-semibold text-ok`}>
        Para sempre
      </span>
    )
  }
  if (access.expiresAt <= now) {
    return (
      <span className={`${base} border-accent/40 text-accent`}>
        Venceu em {DATE.format(access.expiresAt)}
      </span>
    )
  }
  return (
    <span className={`${base} border-transparent bg-ok/14 font-semibold text-ok`}>
      Até {DATE.format(access.expiresAt)}
    </span>
  )
}

function continueHref(journey: JourneyProduct, trail: Trail): string {
  const tab = { weeks: 'semana', parts: 'parte', themes: 'tema', days: null }[journey.structure]
  if (tab && trail.nextStep) return `#/jornada/${journey.id}/${tab}-${trail.nextStep}`
  if (journey.structure === 'days' && trail.nextDay) return `#/jornada/${journey.id}/dias`
  return `#/jornada/${journey.id}`
}

/** A trilha de uma jornada: trechos feitos, o próximo (com "Continuar") e os que vêm depois. */
function JourneyTrailCard({
  journey,
  trail,
  pill,
  compact,
}: {
  journey: JourneyProduct
  trail: Trail
  pill: ReactNode
  compact: boolean
}) {
  const finished = trail.nextDay === null
  const percent = trail.totalDays > 0 ? Math.round((trail.doneDays / trail.totalDays) * 100) : 0
  return (
    <section
      className={`flex flex-col gap-3.5 rounded-[22px] border border-line bg-surface ${compact ? 'p-[18px]' : 'p-6'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">
            {finished ? 'Jornada concluída' : 'Continue de onde parou'}
          </p>
          <h2 className={`font-display text-ink ${compact ? 'text-[1.45rem]' : 'text-[1.7rem]'}`}>
            {journey.title}
          </h2>
        </div>
        {pill}
      </div>
      <div
        role="progressbar"
        aria-label={`Progresso em ${journey.title}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 overflow-hidden rounded-full bg-line"
      >
        <span
          className="block h-full rounded-full bg-linear-to-r from-gray-state to-accent"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ol className="flex flex-col">
        {trail.steps.map((step, index) => {
          const isLast = index === trail.steps.length - 1
          return (
            <li
              key={`${step.label}-${step.title}`}
              className="relative grid grid-cols-[14px_1fr] gap-3.5 pb-[18px] last:pb-0"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute top-4 bottom-0 left-1.5 w-0.5 bg-line"
                />
              )}
              <span
                aria-hidden="true"
                className={`mt-1 size-3.5 rounded-full border-2 border-accent ${step.state === 'done' ? 'bg-accent' : 'bg-bg'} ${step.state === 'later' ? 'opacity-40' : ''}`}
              />
              <div className={step.state === 'later' ? 'text-ink-faint' : ''}>
                <b className="font-semibold">
                  {compact || !step.label ? step.title : `${step.label} · ${step.title}`}
                </b>
                <span className="sr-only">
                  {step.state === 'done'
                    ? ', feito'
                    : step.state === 'next'
                      ? ', em andamento'
                      : ', a seguir'}
                </span>
                {step.state === 'done' && (
                  <p className="text-sm text-ink-faint">
                    {step.lastDay - step.firstDay + 1} dias feitos
                  </p>
                )}
                {step.state === 'next' && trail.nextDay && (
                  <>
                    <p className="text-sm text-ink-faint">Próximo: dia {trail.nextDay}</p>
                    <a
                      href={continueHref(journey, trail)}
                      className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-bg hover:opacity-90"
                    >
                      {compact ? 'Continuar' : `Continuar no dia ${trail.nextDay}`}
                      <ArrowRight aria-hidden size={18} />
                    </a>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      {finished && <p className="text-sm text-ink-faint">Jornada concluída ✦</p>}
    </section>
  )
}

/** Perfil (`#/perfil`, mock aprovado): abas Visão geral, Jornadas, Meditações e Conta. */
export function ProfilePage({
  layout,
  progressLoader,
}: {
  layout: 'wide' | 'narrow'
  /** Para os testes; no site, lê do Firestore com o login. */
  progressLoader?: ProgressLoader
}) {
  const { session, state } = useAuthSession()
  const access = useAccess()
  const now = useNow()
  // "#/perfil/ativacoes" (para onde a janela da ativação leva ao fechar) abre direto na aba.
  const [tab, setTab] = useState<Tab>(() =>
    window.location.hash.startsWith('#/perfil/ativacoes') ? 'ativacoes' : 'geral',
  )
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isConfirmingExit, setIsConfirmingExit] = useState(false)
  const { journeys: allJourneys, meditations: allMeditations } = useCatalog()
  const progress = useProgressSummaries(
    allJourneys.map((j) => j.id),
    progressLoader,
  )
  const isWide = layout === 'wide'
  const compact = !isWide
  const wrap = isWide
    ? 'mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10 md:px-12'
    : 'flex flex-col gap-5'
  const user = state?.user ?? null

  if (!session || !state || !state.authChecked) {
    return <p className="py-20 text-center text-ink-muted">Carregando…</p>
  }

  if (!user) {
    return (
      <section className={`${wrap} items-center text-center`}>
        <h1 className="font-display text-3xl text-ink">Seu perfil</h1>
        <p className="max-w-md text-ink-muted">
          Entre na sua conta para ver suas jornadas, o seu progresso e as meditações que são suas.
        </p>
        <button
          type="button"
          onClick={() => setIsLoginOpen(true)}
          className="inline-flex min-h-12 items-center rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90"
        >
          Entrar
        </button>
        {isLoginOpen && (
          <LoginDialog account={session} variant="hub" onClose={() => setIsLoginOpen(false)} />
        )}
      </section>
    )
  }

  // Jornadas que a pessoa começou ou tem; meditações grátis e as que são dela.
  const journeys = allJourneys.flatMap((journey) => {
    const summary = progress.byJourney.get(journey.id)
    const hasAccess = access.accessOf(journey.id)
    if (!summary && !hasAccess) return []
    const trail = journeyTrail(
      journey,
      summary ?? { completedDays: [], reflections: 0, victories: 0 },
    )
    return [{ journey, trail, summary }]
  })
  const current =
    journeys.find((j) => j.trail.nextDay !== null && j.trail.doneDays > 0) ??
    journeys.find((j) => j.trail.nextDay !== null)
  const meditations = allMeditations.filter(
    (m) => m.pricing.type === 'free' || access.accessOf(m.id) !== undefined,
  )
  const totals = journeys.reduce(
    (sum, j) => ({
      days: sum.days + j.trail.doneDays,
      reflections: sum.reflections + (j.summary?.reflections ?? 0),
      victories: sum.victories + (j.summary?.victories ?? 0),
    }),
    { days: 0, reflections: 0, victories: 0 },
  )
  const initial = (user.displayName ?? user.email ?? '?').trim().charAt(0).toUpperCase()
  const pillOf = (product: Product) => (
    <AccessPill product={product} access={access.accessOf(product.id)} now={now} />
  )
  const loading = progress.status === 'loading' || access.status === 'loading'

  const emptyJourneys = (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line p-6">
      <p className="text-ink-muted">Você ainda não começou nenhuma jornada.</p>
      <a href="#/jornadas" className="font-medium text-accent underline underline-offset-4">
        Ver as jornadas
      </a>
    </div>
  )

  const panels: Record<Tab, ReactNode> = {
    geral: (
      <>
        {loading ? (
          <p className="text-ink-muted" role="status">
            Carregando…
          </p>
        ) : current ? (
          <JourneyTrailCard
            journey={current.journey}
            trail={current.trail}
            pill={pillOf(current.journey)}
            compact={compact}
          />
        ) : (
          emptyJourneys
        )}
        <ul className={`grid gap-3 ${isWide ? 'grid-cols-4' : 'grid-cols-2'}`}>
          {(
            [
              [totals.days, 'dias concluídos'],
              [totals.reflections, 'reflexões escritas'],
              [totals.victories, 'vitórias registradas'],
              [meditations.length, 'meditações suas'],
            ] as const
          ).map(([value, label]) => (
            <li key={label} className="rounded-[22px] border border-line bg-surface p-4">
              <b className="block font-display text-3xl font-medium text-ink">{value}</b>
              <span className="text-sm text-ink-faint">{label}</span>
            </li>
          ))}
        </ul>
      </>
    ),
    jornadas: loading ? (
      <p className="text-ink-muted">Carregando…</p>
    ) : journeys.length === 0 ? (
      emptyJourneys
    ) : (
      <div className={`grid gap-5 ${isWide ? 'grid-cols-2' : ''}`}>
        {journeys.map(({ journey, trail }) => (
          <JourneyTrailCard
            key={journey.id}
            journey={journey}
            trail={trail}
            pill={pillOf(journey)}
            compact={compact}
          />
        ))}
      </div>
    ),
    meditacoes: (
      <ul className="flex flex-col">
        {meditations.map((m, index) => (
          <li
            key={m.id}
            className="grid grid-cols-[64px_1fr_auto] items-center gap-3.5 border-b border-line py-3"
          >
            <ProductBanner
              tone={coverToneAt(index)}
              mediaId={m.bannerMediaId}
              className="aspect-square rounded-xl"
            />
            <div className="min-w-0">
              <a href={meditationHref(m.id)} className="font-medium text-ink hover:text-accent">
                {m.title}
              </a>
              <p className="text-sm text-ink-faint">
                {mediaLabel(m)} · {formatDuration(m.durationSec)}
                {m.ebook ? ' · com e-book' : ''}
              </p>
            </div>
            {pillOf(m)}
          </li>
        ))}
      </ul>
    ),
    ativacoes: (
      <Suspense fallback={<p className="text-ink-muted">Carregando…</p>}>
        <ActivationsTab isWide={isWide} />
      </Suspense>
    ),
    conta: (
      <section className="flex flex-col gap-3 rounded-[22px] border border-line bg-surface p-5">
        <p className="text-ink">{user.email ?? user.displayName}</p>
        <p className="text-sm text-ink-faint">Suas reflexões ficam guardadas só para você.</p>
        {isConfirmingExit ? (
          <div className="flex flex-col gap-3 border-t border-line pt-3">
            <p className="text-sm text-ink-muted">
              Suas respostas continuam na sua conta e são apagadas deste aparelho.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  void session.signOut().then(() => {
                    window.location.hash = '#/'
                  })
                }
                className="min-h-10 flex-1 rounded-full bg-accent text-sm font-semibold text-bg"
              >
                Sair
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingExit(false)}
                className="min-h-10 flex-1 rounded-full border border-line text-sm text-ink-muted"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingExit(true)}
            className="min-h-10 self-start rounded-full border border-line px-5 text-sm text-ink-muted hover:border-accent hover:text-accent"
          >
            Sair da conta
          </button>
        )}
      </section>
    ),
  }

  return (
    <div className={wrap}>
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className={`grid shrink-0 place-items-center rounded-full bg-accent/20 font-display text-accent ${isWide ? 'size-[72px] text-3xl' : 'size-14 text-2xl'}`}
        >
          {initial}
        </span>
        <div className="min-w-0">
          <h1 className={`font-display text-ink ${isWide ? 'text-[2.2rem]' : 'text-[1.7rem]'}`}>
            {user.displayName ?? 'Seu perfil'}
          </h1>
          <p className="truncate text-ink-faint">{user.email}</p>
        </div>
      </header>
      <div
        role="tablist"
        aria-label="Perfil"
        className={`flex overflow-x-auto border-b border-line [scrollbar-width:none] ${isWide ? 'gap-7' : 'gap-5 text-[0.92rem]'}`}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`perfil-aba-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`perfil-painel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 py-3 transition-colors ${tab === t.id ? 'border-accent text-ink' : 'border-transparent text-ink-muted hover:text-accent'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`perfil-painel-${tab}`}
        aria-labelledby={`perfil-aba-${tab}`}
        className="flex flex-col gap-5"
      >
        {panels[tab]}
      </div>
    </div>
  )
}
