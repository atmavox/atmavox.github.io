import type { Account } from './account'
import type { JourneyContent } from './JourneyContent'
import type { JourneyEditor } from './JourneyEditor'
import type { JourneyStore } from './JourneyStore'
import type { MediaCache } from './MediaCache'

export interface JourneyServices {
  /** O conteúdo da jornada (versão publicada pela Andreía, ou a do site). */
  content: JourneyContent
  store: JourneyStore
  /** `null` quando o Firebase não está configurado: o botão "Entrar" não aparece. */
  account: Account | null
  /** Imagens dos blocos (sem ele, os blocos de imagem não aparecem). */
  media?: MediaCache
  /** Cria o editor do modo Andreía; `null` sem Firebase (não há onde gravar). */
  createEditor?: (() => JourneyEditor) | null
}
