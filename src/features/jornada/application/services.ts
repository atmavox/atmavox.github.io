import type { Account } from './account'
import type { JourneyContent } from './JourneyContent'
import type { JourneyEditor } from './JourneyEditor'
import type { JourneyStore } from './JourneyStore'

export interface JourneyServices {
  /** O conteúdo da jornada (versão publicada pela Andreía, ou a do site). */
  content: JourneyContent
  store: JourneyStore
  /** `null` quando o Firebase não está configurado: o botão "Entrar" não aparece. */
  account: Account | null
  /** Cria o editor do modo Andreía; `null` sem Firebase (não há onde gravar). */
  createEditor?: (() => JourneyEditor) | null
}
