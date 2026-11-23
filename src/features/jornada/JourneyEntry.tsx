import { useState, type ReactNode } from 'react'
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
  const [services] = useState(createServices)
  return (
    <JourneyContext.Provider value={services}>
      <JourneyApp path={path} loginBackground={loginBackground} />
    </JourneyContext.Provider>
  )
}
