import { useContext, useEffect, useSyncExternalStore } from 'react'
import { JourneyContext } from './JourneyContext'

const noSubscription = () => () => {}

/** A imagem de um bloco: `undefined` enquanto carrega, `null` se não existe, ou a data URL. */
export function useMediaImage(mediaId: string): string | null | undefined {
  const media = useContext(JourneyContext)?.media ?? null
  const image = useSyncExternalStore(media ? media.subscribe : noSubscription, () =>
    media && mediaId ? media.get(mediaId) : null,
  )
  useEffect(() => {
    if (mediaId) media?.request(mediaId)
  }, [media, mediaId])
  return image
}
