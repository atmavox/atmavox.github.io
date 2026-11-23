import { useEffect, useLayoutEffect, useState, type HTMLAttributes } from 'react'
import { SortableEngine, type SortableOptions } from './sortable'

type ElementRef = (element: HTMLElement | null) => void

export interface Sortable {
  /** No elemento de cada item (o que se move). `holdAnywhere`: no celular, segurar o item arrasta. */
  itemProps(id: string, holdAnywhere?: boolean): HTMLAttributes<HTMLElement> & { ref: ElementRef }
  /** No puxador (um botão): arrastar na hora, setas do teclado movem. */
  handleProps(id: string): HTMLAttributes<HTMLElement> & { ref: ElementRef }
  /** Move com animação (para as setas ▲ ▼ visíveis). */
  move(from: number, to: number): void
}

/** Arrastar para ordenar uma lista ou grade (`sortable.ts`). `onMove` recebe as posições. */
export function useSortable(options: SortableOptions): Sortable {
  const [engine] = useState(() => new SortableEngine())

  // Depois de cada render: as opções mais novas, a animação de quem mudou de lugar e o foco.
  useLayoutEffect(() => {
    engine.setOptions(options)
    engine.afterRender()
  })

  useEffect(() => () => engine.destroy(), [engine])

  return {
    itemProps: (id, holdAnywhere = false) => ({
      ref: (element: HTMLElement | null) => engine.registerItem(id, element),
      ...(holdAnywhere
        ? { onPointerDown: (event) => engine.itemPointerDown(id, event.nativeEvent) }
        : {}),
    }),
    handleProps: (id) => ({
      ref: (element: HTMLElement | null) => engine.registerHandle(id, element),
      onPointerDown: (event) => engine.handlePointerDown(id, event.nativeEvent),
      onKeyDown: (event) => engine.handleKeyDown(id, event.nativeEvent),
    }),
    move: (from, to) => engine.move(from, to),
  }
}
