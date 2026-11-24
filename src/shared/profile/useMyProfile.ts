import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthSession } from '../auth/AuthContext'
import { readFirebaseConfig } from '../firebase/config'
import { EMPTY_PROFILE, type PersonProfile } from './profile'
import {
  createInMemoryProfileSource,
  createRestProfileSource,
  type ProfileSource,
} from './profileSource'

export type MyProfile =
  { status: 'loading'; profile: null } | { status: 'ready' | 'error'; profile: PersonProfile }

/**
 * Os dados da pessoa logada (aba Conta e, depois, o "Complete seu cadastro"). `save` grava e já
 * mostra a mudança; devolve `false` se não deu para gravar (a tela avisa e mantém o que estava).
 */
export function useMyProfile(injected?: ProfileSource) {
  const { session, state } = useAuthSession()
  const uid = state?.user?.uid ?? null
  const source = useMemo<ProfileSource>(() => {
    if (injected) return injected
    const config = readFirebaseConfig(import.meta.env)
    if (!config || !session) return createInMemoryProfileSource()
    return createRestProfileSource(config, () => session.getIdToken())
  }, [injected, session])

  const [loaded, setLoaded] = useState<{ uid: string; value: MyProfile } | null>(null)

  useEffect(() => {
    if (!uid) return
    let cancelled = false
    void source
      .load(uid)
      .then((profile) => ({ status: 'ready' as const, profile }))
      .catch(() => ({
        status: 'error' as const,
        profile: EMPTY_PROFILE,
      }))
      .then((value) => {
        if (!cancelled) setLoaded({ uid, value })
      })
    return () => {
      cancelled = true
    }
  }, [uid, source])

  const save = useCallback(
    async (change: Partial<PersonProfile>): Promise<boolean> => {
      if (!uid) return false
      try {
        await source.save(uid, change)
      } catch {
        return false
      }
      setLoaded((current) =>
        current?.uid === uid && current.value.profile
          ? { uid, value: { status: 'ready', profile: { ...current.value.profile, ...change } } }
          : current,
      )
      return true
    },
    [uid, source],
  )

  const value: MyProfile =
    loaded && loaded.uid === uid ? loaded.value : { status: 'loading', profile: null }
  return { ...value, save }
}
