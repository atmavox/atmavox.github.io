import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuthSession } from '../auth/AuthContext'
import type { AuthSession } from '../auth/session'
import { readFirebaseConfig } from '../firebase/config'
import { compressAvatarInBrowser } from '../media/compressImage'
import { applyAccountPrefill, type AccountInfo, type PhotoLoader } from './accountPrefill'
import { EMPTY_PROFILE, type PersonProfile } from './profile'
import { ProfileSourceContext } from './ProfileSourceContext'
import {
  createInMemoryProfileSource,
  createRestProfileSource,
  type ProfileSource,
  type StoredProfile,
} from './profileSource'

export type MyProfile =
  { status: 'loading'; profile: null } | { status: 'ready' | 'error'; profile: PersonProfile }

const loadPhotoInBrowser: PhotoLoader = async (url) => {
  const response = await fetch(url, { referrerPolicy: 'no-referrer' })
  if (!response.ok) throw new Error(`foto ${response.status}`)
  return (await compressAvatarInBrowser(await response.blob())).dataUrl
}

/** Só nos campos ainda vazios, para não desfazer algo que a pessoa salvou nesse meio-tempo. */
function fillEmpty(profile: PersonProfile, change: Partial<PersonProfile>): PersonProfile {
  return {
    ...profile,
    fullName: profile.fullName || change.fullName || '',
    photo: profile.photo || change.photo || '',
  }
}

// Várias telas usam o perfil ao mesmo tempo: uma fonte por sessão de login, e o preenchimento pela
// conta roda uma vez por pessoa em cada fonte.
const restSources = new WeakMap<AuthSession, ProfileSource>()
const prefills = new WeakMap<ProfileSource, Map<string, Promise<Partial<PersonProfile> | null>>>()

function prefillOnce(
  source: ProfileSource,
  uid: string,
  stored: StoredProfile,
  account: AccountInfo,
  loadPhoto: PhotoLoader,
) {
  const bySource = prefills.get(source) ?? new Map<string, Promise<Partial<PersonProfile> | null>>()
  prefills.set(source, bySource)
  let running = bySource.get(uid)
  if (!running) {
    running = applyAccountPrefill(stored, account, (c) => source.save(uid, c), loadPhoto)
    bySource.set(uid, running)
  }
  return running
}

/**
 * Os dados da pessoa logada (aba Conta e, depois, o "Complete seu cadastro"). `save` grava e já
 * mostra a mudança; devolve `false` se não deu para gravar (a tela avisa e mantém o que estava).
 * No primeiro cadastro, o nome e a foto da conta Google entram sozinhos.
 */
export function useMyProfile(
  injected?: ProfileSource,
  loadPhoto: PhotoLoader = loadPhotoInBrowser,
) {
  const { session, state } = useAuthSession()
  const user = state?.user ?? null
  const uid = user?.uid ?? null
  const displayName = user?.displayName ?? null
  const photoUrl = user?.photoUrl ?? null
  const fromContext = useContext(ProfileSourceContext)
  const source = useMemo<ProfileSource>(() => {
    if (injected) return injected
    if (fromContext) return fromContext
    const config = readFirebaseConfig(import.meta.env)
    if (!config || !session) return createInMemoryProfileSource()
    const shared =
      restSources.get(session) ?? createRestProfileSource(config, () => session.getIdToken())
    restSources.set(session, shared)
    return shared
  }, [injected, fromContext, session])

  const [loaded, setLoaded] = useState<{ uid: string; value: MyProfile } | null>(null)

  useEffect(() => {
    if (!uid) return
    let cancelled = false
    const show = (value: MyProfile) => {
      if (!cancelled) setLoaded({ uid, value })
    }
    void (async () => {
      let stored: StoredProfile
      try {
        stored = await source.load(uid)
      } catch {
        show({ status: 'error', profile: EMPTY_PROFILE })
        return
      }
      show({ status: 'ready', profile: stored.profile })
      const change = await prefillOnce(source, uid, stored, { displayName, photoUrl }, loadPhoto)
      if (!change || cancelled) return
      setLoaded((current) =>
        current?.uid === uid && current.value.profile
          ? { uid, value: { status: 'ready', profile: fillEmpty(current.value.profile, change) } }
          : current,
      )
    })()
    return () => {
      cancelled = true
    }
  }, [uid, displayName, photoUrl, source, loadPhoto])

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
