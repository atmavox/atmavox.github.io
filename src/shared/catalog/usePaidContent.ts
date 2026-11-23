import { useEffect, useState } from 'react'
import { useAuthSession } from '../auth/AuthContext'
import { readFirebaseConfig } from '../firebase/config'
import { documentsUrl, fieldsOf, getJson, stringField } from '../firebase/firestoreRest'

type PaidContent =
  | { status: 'idle' | 'loading' | 'missing' | 'error'; json: null }
  | { status: 'ready'; json: string }

/**
 * O conteúdo protegido de um produto (`published/{id}`, campo `content`), lido com o token do login:
 * as regras só entregam a quem tem acesso válido (ADR-020). `enabled` falso não busca nada.
 */
export function usePaidContent(productId: string, enabled: boolean): PaidContent {
  const { session } = useAuthSession()
  const [result, setResult] = useState<{ key: string; content: PaidContent } | null>(null)

  useEffect(() => {
    const config = readFirebaseConfig(import.meta.env)
    if (!enabled || !session || !config) return
    let cancelled = false
    const finish = (content: PaidContent) => {
      if (!cancelled) setResult({ key: productId, content })
    }
    void (async () => {
      try {
        const token = await session.getIdToken()
        const body = await getJson(
          documentsUrl(config, `published/${productId}`, '&mask.fieldPaths=content'),
          token,
        )
        const fields = fieldsOf(body)
        const json = fields ? stringField(fields, 'content') : undefined
        finish(json ? { status: 'ready', json } : { status: 'missing', json: null })
      } catch {
        finish({ status: 'error', json: null })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [productId, enabled, session])

  if (!enabled) return { status: 'idle', json: null }
  return result?.key === productId ? result.content : { status: 'loading', json: null }
}
