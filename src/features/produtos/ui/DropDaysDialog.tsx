import { Overlay } from './ativacoes/Overlay'

/**
 * A estrutura nova tem menos dias e alguns dos que saem já têm blocos no editor: a Andreía vê quais e
 * confirma antes de salvar.
 */
export function DropDaysDialog({
  days,
  isWide,
  isBusy,
  onConfirm,
  onClose,
}: {
  days: readonly { number: number; title: string }[]
  isWide: boolean
  isBusy: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Overlay
      title={days.length === 1 ? 'Um dia com conteúdo vai sair' : 'Dias com conteúdo vão sair'}
      isWide={isWide}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center rounded-full border border-line px-[18px] text-sm font-semibold text-ink-muted transition-colors hover:border-admin hover:text-admin-ink"
          >
            Voltar e ajustar
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className="inline-flex min-h-10 items-center rounded-full bg-wine px-[18px] text-sm font-semibold text-on-admin transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isBusy ? 'Salvando…' : 'Salvar assim mesmo'}
          </button>
        </div>
      }
    >
      <p className="text-ink-muted">
        Com a estrutura nova, a jornada fica com menos dias. Estes já têm blocos no editor e saem
        junto:
      </p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-ink marker:text-ink-faint">
        {days.map((day) => (
          <li key={day.number}>{day.title || `Dia ${day.number}`}</li>
        ))}
      </ul>
    </Overlay>
  )
}
