import { createContext } from 'react'
import type { ProfileSource } from './profileSource'

/** Onde ler os dados da pessoa: no site, ninguém fornece (vai ao Firestore); nos testes, a memória. */
export const ProfileSourceContext = createContext<ProfileSource | null>(null)
