import { UiIcon } from '../../../shared/ui/UiIcon'
import type { SaveNotice } from './useSaveNotice'

/**
 * A linha do aviso de salvamento (com `useSaveNotice`), sempre montada: aparecer, mudar ou sumir não
 * empurra nada na tela. O sinal de salvo é o ícone do projeto, não um caractere.
 */
export function SaveStatus({
  notice,
  isVisible,
  className = '',
}: {
  notice: SaveNotice | null
  isVisible: boolean
  className?: string
}) {
  return (
    <p
      role="status"
      className={`inline-flex items-center gap-1.5 text-sm transition-opacity duration-500 ${
        notice?.kind === 'error' ? 'text-accent' : 'text-ok'
      } ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      {notice?.kind === 'ok' && <UiIcon name="check" size={15} />}
      {notice?.text}
    </p>
  )
}
