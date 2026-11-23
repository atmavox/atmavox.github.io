import { createContext, useContext, useSyncExternalStore } from 'react'
import type { AuthSession, AuthSessionState } from './session'

/** `null` quando o Firebase não está configurado (desenvolvimento, testes): ninguém entra. */
export const AuthContext = createContext<AuthSession | null>(null)

const noSubscription = () => () => {}
const noState = () => null

/** A sessão de login do site e o estado dela (quem está logado). */
export function useAuthSession(): { session: AuthSession | null; state: AuthSessionState | null } {
  const session = useContext(AuthContext)
  const state = useSyncExternalStore(
    session ? session.subscribe : noSubscription,
    session ? session.getSnapshot : noState,
  )
  return { session, state }
}
