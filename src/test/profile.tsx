import type { ReactNode } from 'react'
import { createInMemoryProfileSource } from '../shared/profile/profileSource'
import { ProfileSourceContext } from '../shared/profile/ProfileSourceContext'
import { COMPLETE_PROFILE } from './completeProfile'

/** Toda pessoa que entrar já tem o cadastro completo. */
export function WithCompleteProfile({ children }: { children: ReactNode }) {
  return (
    <ProfileSourceContext.Provider value={createInMemoryProfileSource({}, COMPLETE_PROFILE)}>
      {children}
    </ProfileSourceContext.Provider>
  )
}
