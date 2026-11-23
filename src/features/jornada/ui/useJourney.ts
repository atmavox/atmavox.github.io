import { useContext, useSyncExternalStore } from 'react'
import type { AccessOptions } from '../domain/access'
import { JourneyContext } from './JourneyContext'
import { useReleaseClock } from './releaseClock'

const noSubscription = () => () => {}
const notAdmin = () => false

export function useJourney() {
  const services = useContext(JourneyContext)
  if (!services) throw new Error('useJourney precisa estar dentro de JourneyContext')
  const { content, store, account } = services
  const journey = useSyncExternalStore(content.subscribe, content.getSnapshot)
  const progress = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const isAdmin = useSyncExternalStore(
    account ? account.subscribe : noSubscription,
    account ? () => account.getSnapshot().isAdmin : notAdmin,
  )
  const now = useReleaseClock()
  /** A admin vê tudo, sem cadeados (ADR-013); os dias abrem pelo calendário (ADR-024). */
  const access: AccessOptions = { bypass: isAdmin, now }
  return { journey, content, store, progress, access, isAdmin }
}
