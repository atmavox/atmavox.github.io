// Quem de fato abriu um conteúdo (pedido de 2026-11-25): é o que o Modo Andreía conta como "já
// acessaram", grátis ou pago. Fica em `users/{uid}/opened/{productId}`, só com a data da última vez.
import { useEffect } from 'react'
import { useAuthSession } from '../auth/AuthContext'
import { readFirebaseConfig } from '../firebase/config'
import {
  patchDocument,
  restInteger,
  type FetchFn,
  type RestConfig,
} from '../firebase/firestoreRest'

export const OPENED_COLLECTION = 'opened'

/** Grava que a pessoa abriu o conteúdo agora. */
export async function recordOpened(
  config: RestConfig,
  uid: string,
  token: string,
  productId: string,
  now: number,
  fetchFn?: FetchFn,
): Promise<void> {
  await patchDocument(
    config,
    `users/${uid}/${OPENED_COLLECTION}/${productId}`,
    { lastOpenedAt: restInteger(now) },
    token,
    fetchFn,
  )
}

/** Uma gravação por pessoa e produto enquanto a página estiver aberta: o número é de pessoas. */
const recorded = new Set<string>()

/**
 * Registra a abertura quando `productId` chega (conteúdo na tela) e há alguém logado. Sem login ou
 * sem Firebase, não faz nada; falhar na rede não atrapalha a pessoa.
 */
export function useRecordOpened(productId: string | null): void {
  const { session, state } = useAuthSession()
  const uid = state?.user?.uid ?? null
  useEffect(() => {
    if (!productId || !uid || !session) return
    const key = `${uid}|${productId}`
    if (recorded.has(key)) return
    const config = readFirebaseConfig(import.meta.env)
    if (!config) return
    recorded.add(key)
    void (async () => {
      const token = await session.getIdToken()
      if (token) await recordOpened(config, uid, token, productId, Date.now())
    })().catch(() => recorded.delete(key))
  }, [productId, uid, session])
}
