import { useState } from 'react'

/**
 * A hora em que a tela abriu, para decidir se um acesso venceu. Não muda enquanto a tela está aberta:
 * um acesso que vence no meio da leitura só some na próxima visita.
 */
export function useNow(): number {
  const [now] = useState(Date.now)
  return now
}
