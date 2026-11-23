import { useEffect, useState } from 'react'
import { useAuthSession } from '../auth/AuthContext'
import { readFirebaseConfig } from '../firebase/config'
import {
  createRestProgressLoader,
  type ProgressLoader,
  type ProgressSummary,
} from './progressSummary'

export interface ProgressSummaries {
  status: 'idle' | 'loading' | 'ready'
  byJourney: ReadonlyMap<string, ProgressSummary>
}

const IDLE: ProgressSummaries = { status: 'idle', byJourney: new Map() }

/**
 * O progresso de cada jornada de quem está logado, para o perfil. Busca uma vez por pessoa e por lista
 * de jornadas; sem login (ou sem Firebase), fica vazio.
 */
export function useProgressSummaries(
  journeyIds: readonly string[],
  loader?: ProgressLoader,
): ProgressSummaries {
  const { session, state } = useAuthSession()
  const uid = state?.user?.uid ?? null
  const key = `${uid ?? ''}|${journeyIds.join(',')}`
  const [result, setResult] = useState<{ key: string; value: ProgressSummaries } | null>(null)

  useEffect(() => {
    const config = readFirebaseConfig(import.meta.env)
    const load = loader ?? (config ? createRestProgressLoader(config) : null)
    if (!uid || !session || !load) return
    let cancelled = false
    void (async () => {
      const token = await session.getIdToken()
      const entries = await Promise.all(
        journeyIds.map(async (id) => {
          try {
            return [id, token ? await load(uid, token, id) : null] as const
          } catch {
            return [id, null] as const
          }
        }),
      )
      if (cancelled) return
      const byJourney = new Map<string, ProgressSummary>()
      for (const [id, summary] of entries) if (summary) byJourney.set(id, summary)
      setResult({ key, value: { status: 'ready', byJourney } })
    })()
    return () => {
      cancelled = true
    }
    // `key` já reúne a pessoa e a lista de jornadas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, session, loader])

  if (!uid) return IDLE
  return result?.key === key ? result.value : { status: 'loading', byJourney: new Map() }
}
