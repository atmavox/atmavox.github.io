import { useState } from 'react'
import { createServices } from './infrastructure/createServices'
import { JourneyApp } from './ui/JourneyApp'
import { JourneyContext } from './ui/JourneyContext'

/** Porta de entrada da jornada (carregada sob demanda): cria os serviços uma vez e monta a UI. */
export function JourneyEntry({ path }: { path: string }) {
  const [services] = useState(createServices)
  return (
    <JourneyContext.Provider value={services}>
      <JourneyApp path={path} />
    </JourneyContext.Provider>
  )
}
