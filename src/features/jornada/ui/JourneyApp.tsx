import { Lock } from 'lucide-react'
import { lazy, Suspense, useEffect, useSyncExternalStore, type ReactNode } from 'react'
import {
  editorJourneyId,
  journeyTabs,
  partOfTab,
  routeFromPath,
  tabHref,
  type JourneyTabId,
} from '../application/navigation'
import { LoginGate } from './account/LoginGate'
import { EmailConfirmDialog } from '../../../shared/auth/EmailConfirmDialog'
import { needsEmailConfirmation } from '../../../shared/auth/emailConfirmation'
import { localDate } from '../../../shared/ativacao/availability'
import { missingProfileFields } from '../../../shared/profile/profile'
import { ProfileGateDialog } from '../../../shared/profile/ProfileGateDialog'
import { useMyProfile } from '../../../shared/profile/useMyProfile'
import { furthestUnlockedTab, isTabUnlocked } from '../application/tabAccess'
import { JourneyHeader } from './JourneyHeader'
import { ClosingPage } from './pages/ClosingPage'
import { CoverPage } from './pages/CoverPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { VictoriesPage } from './pages/VictoriesPage'
import { ThemePage } from './pages/ThemePage'
import { WeekPage } from './pages/WeekPage'
import { structureOf } from '../domain/journey'
import { BRAND_TAB_TITLE } from '../../../shared/brand/links'
import { useCatalog } from '../../../shared/catalog/CatalogContext'
import { useAccess } from '../../../shared/catalog/AccessContext'
import { useNow } from '../../../shared/lib/useNow'
import { canStillUse } from '../../../shared/catalog/retired'
import { wasPublished } from '../../../shared/catalog/product'
import { hasStarted } from '../../../shared/progress/progressSummary'
import { useProgressSummaries } from '../../../shared/progress/useProgressSummaries'
import { RetiredNotice } from '../../../shared/ui/RetiredNotice'
import { UiIcon } from '../../../shared/ui/UiIcon'
import { ReadOnlyContext } from './ReadOnlyContext'
import { useAccount } from './useAccount'
import { useJourney } from './useJourney'

/** Quem abre o link de uma aba ainda fechada vê o que falta e um atalho para onde está. */
function LockedTab({ tab }: { tab: JourneyTabId }) {
  const { journey, progress, access } = useJourney()
  const tabs = journeyTabs(journey)
  const index = tabs.findIndex((t) => t.id === tab)
  const previous = tabs[index - 1]
  const furthest = tabs.find((t) => t.id === furthestUnlockedTab(journey, progress, access))
  const opensByCalendar = partOfTab(journey, tab) !== undefined && structureOf(journey) !== 'themes'
  const label = tabs[index]?.label ?? ''
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full border border-line text-ink-faint">
        <Lock aria-hidden size={22} />
      </span>
      <h1 className="font-display text-3xl text-ink">Esta etapa ainda está fechada</h1>
      <p className="max-w-md text-ink-muted">
        {opensByCalendar
          ? `A jornada se abre aos poucos: um dia novo a cada meia-noite. “${label}” abre junto com o primeiro dia dela.`
          : `A jornada se abre aos poucos: complete ${previous ? `“${previous.label}”` : 'a etapa anterior'} para liberar “${label}”.`}
      </p>
      {furthest && (
        <a
          href={tabHref(journey.id, furthest.id)}
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90"
        >
          Continuar em {furthest.label} →
        </a>
      )}
    </div>
  )
}

function TabContent({ tab }: { tab: JourneyTabId }) {
  const { journey, progress, access } = useJourney()
  if (!isTabUnlocked(tab, journey, progress, access)) return <LockedTab tab={tab} />
  const part = partOfTab(journey, tab)
  if (part) {
    return structureOf(journey) === 'themes' ? <ThemePage part={part} /> : <WeekPage week={part} />
  }
  if (tab === 'revisoes') return <ReviewsPage />
  if (tab === 'vitorias') return <VictoriesPage />
  if (tab === 'encerramento') return <ClosingPage />
  return <CoverPage />
}

// O editor só é baixado por quem abre o Modo Andreía: as participantes não carregam esse código.
const EditorApp = lazy(() => import('./admin/EditorApp').then((m) => ({ default: m.EditorApp })))

interface JourneyAppProps {
  path: string
  /** Fica desfocado atrás da janela de login (o hub de jornadas, vindo de `app/`). */
  loginBackground?: ReactNode
}

export function JourneyApp({ path, loginBackground }: JourneyAppProps) {
  if (editorJourneyId(path) === null) {
    return <ParticipantApp path={path} loginBackground={loginBackground} />
  }
  return (
    <Suspense fallback={<p className="py-20 text-center text-ink-muted">Carregando…</p>}>
      <EditorApp />
    </Suspense>
  )
}

const DATE = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })

/** O aviso do topo quando a jornada é só para reler (ADR-035). */
function RereadBanner({ until }: { until: number }) {
  return (
    <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-gray-state/12 px-4 py-3 text-sm text-ink-muted">
      <span className="mt-0.5 text-ink-faint">
        <UiIcon name="book" size={18} />
      </span>
      <span>
        <b className="font-semibold text-ink">Só para reler.</b> Esta jornada saiu do ar e seu
        acesso terminou em {DATE.format(until)}. Aqui você relê o que escreveu; nada pode ser
        mudado.
      </span>
    </p>
  )
}

/** Link para uma jornada que ainda não existe aqui (ex.: uma "Em breve"). */
function UnavailableJourney() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl text-ink">Esta jornada ainda não está disponível</h1>
      <p className="max-w-md text-ink-muted">Veja as jornadas abertas e as que estão por vir.</p>
      <a
        href="#/jornadas"
        className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90"
      >
        Ver as jornadas →
      </a>
    </div>
  )
}

/** Jornada paga sem acesso: volta para o hub, onde está o preço (ADR-020). */
function PaidJourney({ title }: { title: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-14 place-items-center rounded-full border border-line text-accent">
        <Lock aria-hidden size={22} />
      </span>
      <h1 className="font-display text-3xl text-ink">{title} é uma jornada paga</h1>
      <p className="max-w-md text-ink-muted">
        Para começar, libere o acesso na lista de jornadas. Seu progresso fica guardado na sua
        conta.
      </p>
      <a
        href="#/jornadas"
        className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90"
      >
        Ver o preço →
      </a>
    </div>
  )
}

function ParticipantApp({ path, loginBackground }: JourneyAppProps) {
  const { journeyId, tab } = routeFromPath(path)
  const { journey, content, isAdmin } = useJourney()
  const availability = useSyncExternalStore(content.subscribe, content.getAvailability)
  const { account, state } = useAccount()
  const access = useAccess()
  const now = useNow()
  const product = useCatalog().find(journeyId)
  const my = useMyProfile()
  const userId = state?.user?.uid
  // Jornada Indisponível (ADR-035): a grátis continua para quem já tinha começado; a paga, até o prazo.
  const retired = product?.status === 'retired' && !isAdmin ? product : null
  const retiredProgress = useProgressSummaries(retired?.pricing.type === 'free' ? [journeyId] : [])

  // Quem acabou de entrar pode ter acesso a uma jornada paga: busca de novo, agora com o login.
  useEffect(() => {
    if (userId) void content.refresh()
  }, [userId, content])

  useEffect(() => {
    document.title = BRAND_TAB_TITLE
    window.scrollTo({ top: 0 })
  }, [tab])

  // Rascunho e Em breve: ninguém entra, nem com acesso liberado; só a Andreía (pedido de 2026-11-25).
  if (product && !wasPublished(product.status) && !isAdmin) {
    return <UnavailableJourney />
  }
  if (retired && account && state && !state.user) {
    // Quem ainda tem acesso entra primeiro; aí se vê se continua.
    return state.authChecked ? (
      <LoginGate account={account} journeyId={journeyId} background={loginBackground} />
    ) : (
      <p aria-busy="true" className="py-20 text-center text-ink-muted">
        Carregando…
      </p>
    )
  }
  // Indisponível paga, com o acesso vencido: quem já teve acesso relê o que escreveu (ADR-035).
  let rereadUntil: number | null = null
  if (retired) {
    const hasProgress = hasStarted(retiredProgress.byJourney.get(journeyId))
    const productAccess = access.accessOf(journeyId)
    if (!canStillUse(retired, { access: productAccess, hasProgress, now })) {
      const isChecking =
        retired.pricing.type === 'free' && state?.user
          ? retiredProgress.status !== 'ready'
          : access.status === 'loading'
      if (isChecking) {
        return (
          <p aria-busy="true" className="py-20 text-center text-ink-muted">
            Carregando…
          </p>
        )
      }
      if (retired.pricing.type === 'paid' && productAccess?.expiresAt != null) {
        rereadUntil = productAccess.expiresAt
      } else {
        return <RetiredNotice title={retired.title} kind="journey" className="min-h-dvh" />
      }
    }
  }
  const isReadOnly = rereadUntil !== null
  // Sem a regra nova publicada (ou sem o conteúdo), não há o que reler: vale o aviso de sempre.
  if (isReadOnly && retired && availability === 'unavailable') {
    return <RetiredNotice title={retired.title} kind="journey" className="min-h-dvh" />
  }

  // A Andreía vê a jornada nova antes de publicar ("Ver como participante").
  if (journeyId !== journey.id || (availability === 'unavailable' && !isAdmin)) {
    return <UnavailableJourney />
  }
  if (availability === 'loading' && !isAdmin) {
    return (
      <p aria-busy="true" className="py-20 text-center text-ink-muted">
        Carregando…
      </p>
    )
  }
  const activeTab = journeyTabs(journey).some((t) => t.id === tab) ? tab : 'abertura'
  // Jornada pede login (ADR-020). Sem Firebase configurado (testes, desenvolvimento) não há como entrar.
  if (account && state && !state.user) {
    if (!state.authChecked) {
      return (
        <p aria-busy="true" className="py-20 text-center text-ink-muted">
          Carregando…
        </p>
      )
    }
    return <LoginGate account={account} journeyId={journeyId} background={loginBackground} />
  }
  // Conta criada com e-mail e ainda sem confirmar (pedido de 2026-11-24): a janela pede a confirmação;
  // confirmado, a jornada aparece no lugar.
  if (state && needsEmailConfirmation(state.user) && !isAdmin) {
    return (
      <>
        <div
          aria-hidden="true"
          className="pointer-events-none min-h-dvh blur-[7px] saturate-90 select-none"
        >
          {loginBackground}
        </div>
        <EmailConfirmDialog
          onClose={() => {
            window.location.hash = '#/jornadas'
          }}
        />
      </>
    )
  }
  // Cadastro completo (nome, apelido, celular e nascimento) antes de começar (pedido de 2026-11-24).
  if (account && state?.user && !isAdmin) {
    if (!my.profile) {
      return (
        <p aria-busy="true" className="py-20 text-center text-ink-muted">
          Carregando…
        </p>
      )
    }
    const missing = missingProfileFields(my.profile, localDate(now))
    if (missing.length > 0) {
      return (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none min-h-dvh blur-[7px] saturate-90 select-none"
          >
            {loginBackground}
          </div>
          <ProfileGateDialog
            missing={missing}
            returnTo={{ href: `#/jornada/${journeyId}`, title: product?.title ?? 'a jornada' }}
            onClose={() => {
              window.location.hash = '#/jornadas'
            }}
          />
        </>
      )
    }
  }
  if (
    product?.pricing.type === 'paid' &&
    !isAdmin &&
    !isReadOnly &&
    !access.owns(product.id, now)
  ) {
    if (access.status === 'loading') {
      return (
        <p aria-busy="true" className="py-20 text-center text-ink-muted">
          Carregando…
        </p>
      )
    }
    return <PaidJourney title={product.title} />
  }

  return (
    <ReadOnlyContext.Provider value={isReadOnly}>
      <div className="min-h-dvh">
        <JourneyHeader activeTab={activeTab} />
        <main
          key={activeTab}
          className="mx-auto max-w-2xl animate-[page-in_400ms_ease-out] px-4 pb-16 lg:max-w-3xl"
        >
          {rereadUntil !== null && <RereadBanner until={rereadUntil} />}
          {/* Só leitura: o fieldset desativa todos os campos e botões da página de uma vez. */}
          <fieldset
            disabled={isReadOnly}
            className="contents [&_textarea:disabled]:cursor-default [&_textarea:disabled]:text-ink [&_textarea:disabled]:opacity-100"
          >
            <TabContent tab={activeTab} />
          </fieldset>
        </main>
      </div>
    </ReadOnlyContext.Provider>
  )
}
