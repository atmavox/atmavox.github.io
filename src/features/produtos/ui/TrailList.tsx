import type { ReactNode } from 'react'
import { UiIcon } from '../../../shared/ui/UiIcon'
import { useSortable } from '../../../shared/ui/useSortable'
import { inputClass } from './styles'

export interface TrailItem {
  id: string
  title: string
}

interface TrailListProps {
  items: readonly TrailItem[]
  /** O que vai na bolinha (I, 2, 14…): segue a posição, não se digita. */
  mark: (index: number) => string
  /** Nome do item para leitores de tela ("Semana II", "Dia 4"). */
  name: (index: number) => string
  placeholder: (index: number) => string
  /** Linha embaixo do nome (faixa de dias da semana ou da parte). */
  sub?: (index: number) => ReactNode
  onRename: (id: string, title: string) => void
  onMove: (from: number, to: number) => void
  onRemove?: (id: string) => void
  canRemove?: boolean
  disabled?: boolean
  /** Computador: puxador à esquerda e setas ▲ ▼. Celular: segurar o item arrasta. */
  isWide: boolean
  /** Versão fina, para os títulos dos dias. */
  compact?: boolean
}

const iconButton =
  'grid size-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-admin/12 hover:text-admin-ink disabled:pointer-events-none disabled:opacity-30'

/** Lista em trilha (mock aprovado, opção C): bolinhas ligadas por um fio, na ordem em que se abrem. */
export function TrailList({
  items,
  mark,
  name,
  placeholder,
  sub,
  onRename,
  onMove,
  onRemove,
  canRemove = true,
  disabled = false,
  isWide,
  compact = false,
}: TrailListProps) {
  const sortable = useSortable({ ids: items.map((item) => item.id), onMove, disabled })
  const dot = compact
    ? 'size-[30px] border-[1.5px] text-[0.8rem] font-semibold'
    : 'size-10 border-2 font-display'
  // A linha que liga as bolinhas passa pelo centro delas (o puxador vem antes, no computador).
  const line = compact
    ? isWide
      ? 'before:left-[50px] before:top-[30px] before:-bottom-2'
      : 'before:left-[14px] before:top-[30px] before:-bottom-2'
    : isWide
      ? 'before:left-[57px] before:top-10 before:-bottom-3.5'
      : 'before:left-[19px] before:top-10 before:-bottom-3.5'

  return (
    <ol className={`flex flex-col ${compact ? 'gap-2' : 'gap-3.5'}`}>
      {items.map((item, index) => (
        <li
          key={item.id}
          {...sortable.itemProps(item.id, !isWide)}
          className={`relative grid items-center gap-2.5 rounded-[14px] transition-colors duration-300 before:absolute before:w-0.5 before:bg-accent/30 last:before:hidden data-[dragging=true]:z-10 data-[dragging=true]:bg-surface data-[dragging=true]:shadow-[0_12px_28px_rgb(20_14_10/0.22)] data-[dragging=true]:outline data-[dragging=true]:outline-admin/45 data-[dragging=true]:before:hidden data-[pressing=true]:bg-admin/10 ${line} ${
            isWide
              ? 'grid-cols-[28px_auto_minmax(0,1fr)_auto]'
              : 'grid-cols-[auto_minmax(0,1fr)_auto]'
          } ${isWide ? '' : '[-webkit-touch-callout:none]'}`}
        >
          <button
            type="button"
            {...sortable.handleProps(item.id)}
            disabled={disabled}
            aria-label={`Arrastar ${name(index)} (ou use as setas do teclado)`}
            className={
              isWide
                ? 'grid h-10 w-7 cursor-grab touch-none place-items-center rounded-[10px] text-ink-faint hover:bg-admin/12 hover:text-admin-ink active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30'
                : 'sr-only'
            }
          >
            <UiIcon name="grip" />
          </button>
          <span
            aria-hidden="true"
            className={`z-[1] grid shrink-0 place-items-center rounded-full border-accent bg-surface text-accent ${dot}`}
          >
            {mark(index)}
          </span>
          <div className="min-w-0">
            <input
              aria-label={`Nome: ${name(index)}`}
              placeholder={placeholder(index)}
              value={item.title}
              disabled={disabled}
              onChange={(event) => onRename(item.id, event.target.value)}
              className={`${inputClass} ${compact ? 'min-h-9 text-[0.92rem]' : ''} disabled:opacity-60`}
            />
            {sub && <div className="mt-1.5 text-[0.8rem] text-ink-faint">{sub(index)}</div>}
          </div>
          <span className="flex items-center">
            {isWide && !compact && (
              <>
                <button
                  type="button"
                  aria-label={`Mover ${name(index)} para cima`}
                  disabled={disabled || index === 0}
                  onClick={() => sortable.move(index, index - 1)}
                  className={iconButton}
                >
                  <UiIcon name="up" />
                </button>
                <button
                  type="button"
                  aria-label={`Mover ${name(index)} para baixo`}
                  disabled={disabled || index === items.length - 1}
                  onClick={() => sortable.move(index, index + 1)}
                  className={iconButton}
                >
                  <UiIcon name="down" />
                </button>
              </>
            )}
            {onRemove && (
              <button
                type="button"
                aria-label={`Apagar ${name(index)}`}
                disabled={disabled || !canRemove}
                onClick={() => onRemove(item.id)}
                className={`${iconButton} hover:bg-wine/10 hover:text-wine`}
              >
                <UiIcon name="trash" size={17} />
              </button>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}
