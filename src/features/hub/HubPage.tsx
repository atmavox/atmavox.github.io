import { useEffect } from 'react'
import { BRAND_SLOGAN } from '../../shared/brand/links'
import { useMediaQuery } from '../../shared/lib/useMediaQuery'
import { HubMagazine } from './layouts/HubMagazine'
import { HubTabs } from './layouts/HubTabs'
import {
  hubSectionFromPath,
  meditationIdFromPath,
  tabOfSection,
  WIDE_LAYOUT_QUERY,
} from './navigation'

/** Escolhe a composição do hub pela largura da tela (ADR-010). */
export function HubPage({ path }: { path: string }) {
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY)
  const section = hubSectionFromPath(path)
  const meditationId = meditationIdFromPath(path)

  useEffect(() => {
    document.title = `ATMAVOX · ${BRAND_SLOGAN.replace(/\.$/, '')}`
  }, [])

  return isWide ? (
    <HubMagazine section={section} meditationId={meditationId} />
  ) : (
    <HubTabs activeTab={tabOfSection(section)} meditationId={meditationId} />
  )
}
