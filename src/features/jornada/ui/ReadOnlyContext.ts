import { createContext, useContext } from 'react'

/**
 * Jornada só para reler (ADR-035): Indisponível e com o acesso vencido. Tudo fica aberto para leitura
 * e nada pode ser mudado.
 */
export const ReadOnlyContext = createContext(false)

export const useIsReadOnly = () => useContext(ReadOnlyContext)
