import { useEffect, useState } from 'react'
import { parseSocialFeed, type SocialPost } from './feeds'

// O `social.json` é gerado no deploy (ADR-028) e vem junto com o site: lido uma vez por visita.
let request: Promise<SocialPost[]> | null = null

function loadSocialPosts(): Promise<SocialPost[]> {
  request ??= fetch(`${import.meta.env.BASE_URL}social.json`)
    .then((response) => (response.ok ? response.json() : null))
    .then((json: unknown) => parseSocialFeed(json))
    // Sem o arquivo (rodando localmente) ou sem rede: a seção mostra só os ícones.
    .catch(() => [])
  return request
}

/** As últimas publicações das redes; vazio enquanto carrega ou se não houver nada. */
export function useSocialPosts(): readonly SocialPost[] {
  const [posts, setPosts] = useState<readonly SocialPost[]>([])
  useEffect(() => {
    let active = true
    void loadSocialPosts().then((loaded) => {
      if (active) setPosts(loaded)
    })
    return () => {
      active = false
    }
  }, [])
  return posts
}
