import { useContext, useSyncExternalStore } from 'react'
import type { AccountState } from '../application/account'
import { JourneyContext } from './JourneyContext'

const noSubscription = () => () => {}
const noState = () => null

/** Conta e estado de sincronização; `account` é `null` quando o login não está configurado. */
export function useAccount() {
  const services = useContext(JourneyContext)
  if (!services) throw new Error('useAccount precisa estar dentro de JourneyContext')
  const { account } = services
  const state: AccountState | null = useSyncExternalStore(
    account ? account.subscribe : noSubscription,
    account ? account.getSnapshot : noState,
  )
  return { account, state }
}
