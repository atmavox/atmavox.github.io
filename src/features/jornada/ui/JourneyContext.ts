import { createContext } from 'react'
import type { JourneyServices } from '../application/services'

export const JourneyContext = createContext<JourneyServices | null>(null)
