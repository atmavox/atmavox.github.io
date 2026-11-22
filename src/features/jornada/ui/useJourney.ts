import { useContext, useSyncExternalStore } from 'react'
import { JourneyContext } from './JourneyContext'

export function useJourney() {
  const services = useContext(JourneyContext)
  if (!services) throw new Error('useJourney precisa estar dentro de JourneyContext')
  const { content, store } = services
  const journey = useSyncExternalStore(content.subscribe, content.getSnapshot)
  const progress = useSyncExternalStore(store.subscribe, store.getSnapshot)
  return { journey, store, progress }
}
