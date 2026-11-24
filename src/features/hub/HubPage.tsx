import { lazy, Suspense, useEffect } from 'react'
import { BRAND_TAB_TITLE } from '../../shared/brand/links'
import { useMediaQuery } from '../../shared/lib/useMediaQuery'
import { HubMagazine } from './layouts/HubMagazine'
import { HubTabs } from './layouts/HubTabs'
import {
  hubSectionFromPath,
  meditationIdFromPath,
  confirmOrderFromPath,
  isActivationPath,
  orderReturnFromPath,
  isProfilePath,
  paymentReturnFromPath,
  tabOfSection,
  therapyFromPath,
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
  // Ao fundo do agendamento fica o hub Ativações, venha a pessoa de onde vier (também do perfil).
  const section = isActivation ? 'ativacoes' : hubSectionFromPath(path)
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
          <AtivacaoFlow
            orderReturn={orderReturnFromPath(path)}
            confirmOrderId={confirmOrderFromPath(path)}
            initialTherapyId={therapyFromPath(path)}
          />
        </Suspense>
      )}
    </>
  )
}
