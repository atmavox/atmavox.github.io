import { useContext, useState, type ReactNode } from 'react'
import { AuthContext } from '../../shared/auth/AuthContext'
import { createServices } from './infrastructure/createServices'
import { JourneyApp } from './ui/JourneyApp'
import { JourneyContext } from './ui/JourneyContext'

/** Porta de entrada da jornada (carregada sob demanda): cria os serviços uma vez e monta a UI. */
export function JourneyEntry({
  path,
  loginBackground,
}: {
  path: string
  loginBackground?: ReactNode
}) {
  // A sessão de login é do site todo (ADR-022): vem de `app/`, e a jornada sincroniza por cima dela.
  const session = useContext(AuthContext)
  const [services] = useState(() => createServices(session))
  return (
    <JourneyContext.Provider value={services}>
      <JourneyApp path={path} loginBackground={loginBackground} />
    </JourneyContext.Provider>
  )
}
