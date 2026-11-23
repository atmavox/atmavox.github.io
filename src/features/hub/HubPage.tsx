import { useEffect } from 'react'
import { BRAND_TAB_TITLE } from '../../shared/brand/links'
import { useMediaQuery } from '../../shared/lib/useMediaQuery'
import { HubMagazine } from './layouts/HubMagazine'
import { HubTabs } from './layouts/HubTabs'
import {
  hubSectionFromPath,
  meditationIdFromPath,
  isProfilePath,
  paymentReturnFromPath,
  tabOfSection,
  WIDE_LAYOUT_QUERY,
} from './navigation'

/** Escolhe a composição do hub pela largura da tela (ADR-010). */
export function HubPage({ path }: { path: string }) {
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY)
  const section = hubSectionFromPath(path)
  const meditationId = meditationIdFromPath(path)
  const payment = paymentReturnFromPath(path)
  const isProfile = isProfilePath(path)

  useEffect(() => {
    document.title = BRAND_TAB_TITLE
  }, [])

  return isWide ? (
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
}
