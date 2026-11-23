import { useEffect, useState } from 'react'
import { readFirebaseConfig } from '../firebase/config'
import { documentsUrl, fieldsOf, getJson, stringField } from '../firebase/firestoreRest'

const DATA_URL = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/

/** Uma busca por imagem, dividida entre todos os cartões que a mostram. */
const cache = new Map<string, Promise<string | null>>()

/** A imagem de `media/{id}` (ADR-014), lida por REST sem login; só data URL de imagem é aceita. */
export function loadBannerImage(mediaId: string): Promise<string | null> {
  const config = readFirebaseConfig(import.meta.env)
  if (!config) return Promise.resolve(null)
  let pending = cache.get(mediaId)
  if (!pending) {
    pending = getJson(documentsUrl(config, `media/${mediaId}`, '&mask.fieldPaths=dataUrl'), null)
      .then((body) => {
        const fields = fieldsOf(body)
        const dataUrl = fields ? stringField(fields, 'dataUrl') : undefined
        return dataUrl && DATA_URL.test(dataUrl) ? dataUrl : null
      })
      .catch(() => {
        cache.delete(mediaId) // sem rede: tenta de novo na próxima vez
        return null
      })
    cache.set(mediaId, pending)
  }
  return pending
}

/** Guarda já carregada a imagem que a Andreía acabou de enviar (não precisa buscar de novo). */
export function rememberBannerImage(mediaId: string, dataUrl: string) {
  cache.set(mediaId, Promise.resolve(dataUrl))
}

/** A imagem do banner de um produto, ou `null` enquanto carrega ou se não houver. */
export function useBannerImage(mediaId: string | undefined): string | null {
  const [image, setImage] = useState<{ id: string; url: string | null } | null>(null)
  useEffect(() => {
    if (!mediaId) return
    let cancelled = false
    void loadBannerImage(mediaId).then((url) => {
      if (!cancelled) setImage({ id: mediaId, url })
    })
    return () => {
      cancelled = true
    }
  }, [mediaId])
  return mediaId && image?.id === mediaId ? image.url : null
}
