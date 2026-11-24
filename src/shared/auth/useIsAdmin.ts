import { useEffect, useState } from 'react'
import { readFirebaseConfig } from '../firebase/config'
import { documentsUrl, getJson } from '../firebase/firestoreRest'
import { useAuthSession } from './AuthContext'
import type { AuthSession } from './session'

/** Uma conferência por pessoa: `admins/{uid}` existe = é a admin (só a própria pessoa lê o dela). */
const cache = new Map<string, Promise<boolean>>()

export function checkAdmin(session: AuthSession, uid: string): Promise<boolean> {
  const config = readFirebaseConfig(import.meta.env)
  if (!config) return Promise.resolve(false)
  let pending = cache.get(uid)
  if (!pending) {
    pending = session
      .getIdToken()
      .then((token) =>
        token
          ? getJson(documentsUrl(config, `admins/${uid}`), token).then((doc) => doc !== null)
          : false,
      )
      .catch(() => {
        cache.delete(uid)
        return false
      })
    cache.set(uid, pending)
  }
  return pending
}

/**
 * A pessoa logada é a Andreía (admin)? Fora do Firebase ou sem login, não. Com `enabled: false` (quem
 * chama já sabe a resposta, como nos testes), não consulta nada.
 */
export function useIsAdmin(enabled = true): boolean {
  const { session, state } = useAuthSession()
  const uid = enabled ? (state?.user?.uid ?? null) : null
  const [result, setResult] = useState<{ uid: string; isAdmin: boolean } | null>(null)
  useEffect(() => {
    if (!session || !uid) return
    let cancelled = false
    void checkAdmin(session, uid).then((isAdmin) => {
      if (!cancelled) setResult({ uid, isAdmin })
    })
    return () => {
      cancelled = true
    }
  }, [session, uid])
  return !!uid && result?.uid === uid && result.isAdmin
}
