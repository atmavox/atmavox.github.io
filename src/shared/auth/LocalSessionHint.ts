import type { SessionHint } from '../application/account'

const KEY = 'atmavox:sessao'

/** Só um "1": nenhum dado pessoal. Diz se vale carregar o Firebase ao abrir o site. */
export function createLocalSessionHint(storage: Storage = localStorage): SessionHint {
  return {
    get() {
      try {
        return storage.getItem(KEY) === '1'
      } catch {
        return false
      }
    },
    set(value) {
      try {
        if (value) storage.setItem(KEY, '1')
        else storage.removeItem(KEY)
      } catch {
        // Armazenamento bloqueado: a pessoa só precisará tocar em "Entrar" de novo.
      }
    },
  }
}
