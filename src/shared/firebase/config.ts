export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
}

type Env = Partial<Record<string, string | undefined>>

/** Só devolve a configuração se as quatro variáveis existirem; sem elas, o login fica escondido. */
export function readFirebaseConfig(env: Env): FirebaseConfig | null {
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY?.trim() ?? '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
    projectId: env.VITE_FIREBASE_PROJECT_ID?.trim() ?? '',
    appId: env.VITE_FIREBASE_APP_ID?.trim() ?? '',
  }
  return Object.values(config).every((value) => value !== '') ? config : null
}
