import { lazy, Suspense, useEffect } from 'react'
import { BRAND_TAB_TITLE } from '../../shared/brand/links'
import { useMediaQuery } from '../../shared/lib/useMediaQuery'
import { HubMagazine } from './layouts/HubMagazine'
import { HubTabs } from './layouts/HubTabs'
import {
  hubSectionFromPath,
  meditationIdFromPath,
  isActivationPath,
  orderReturnFromPath,
  isProfilePath,
  paymentReturnFromPath,
  tabOfSection,
  WIDE_LAYOUT_QUERY,
} from './navigation'

// O fluxo da ativação individual só é baixado por quem abre #/ativacao (ADR-029).
const AtivacaoFlow = lazy(() =>
  import('./ativacao/AtivacaoFlow').then((module) => ({ default: module.AtivacaoFlow })),
)

/** Escolhe a composição do hub pela largura da tela (ADR-010). */
export function HubPage({ path }: { path: string }) {
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY)
  const isActivation = isActivationPath(path)
  // Ao fundo da ativação fica o Contato, de onde ela foi aberta.
  const section = isActivation ? 'contato' : hubSectionFromPath(path)
  const meditationId = meditationIdFromPath(path)
  const payment = paymentReturnFromPath(path)
  const isProfile = isProfilePath(path)

  useEffect(() => {
    document.title = BRAND_TAB_TITLE
  }, [])

  const layout = isWide ? (
    <HubMagazine
      section={section}
      meditationId={meditationId}
      payment={payment}
      isProfile={isProfile}
    />
  ) : (
    <HubTabs
      activeTab={tabOfSection(section)}
      meditationId={meditationId}
      payment={payment}
      isProfile={isProfile}
    />
  )

  return (
    <>
      {layout}
      {isActivation && (
        <Suspense fallback={null}>
          <AtivacaoFlow orderReturn={orderReturnFromPath(path)} />
        </Suspense>
      )}
    </>
  )
}
