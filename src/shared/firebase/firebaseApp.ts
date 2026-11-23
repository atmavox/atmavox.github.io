// Carregado com import() só quando alguém entra na conta (ADR-005).
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import type { FirebaseConfig } from './config'

/** Um app do Firebase só, dividido entre o login (`shared/auth`) e a nuvem da jornada. */
export function getFirebaseApp(config: FirebaseConfig): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(config)
}
