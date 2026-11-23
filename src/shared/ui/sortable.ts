// Arrastar para ordenar (listas e grades), sem biblioteca: pointer events, que valem para mouse e dedo.
// - Puxador: segurar e arrastar na hora (mouse ou dedo).
// - Celular: segurar o cartão em qualquer lugar por meio segundo ativa o arrastar; mexer o dedo antes
//   disso é rolar a página.
// - Teclado: setas no puxador movem o item.
// Os outros itens escorregam para abrir espaço e, ao soltar, todos deslizam até o lugar novo (FLIP).

export const LONG_PRESS_MS = 450
/** Quanto o dedo pode mexer durante o "segurar" sem virar rolagem. */
const PRESS_TOLERANCE_PX = 8
const SLIDE = { duration: 260, easing: 'cubic-bezier(.2,.7,.2,1)' }

interface Point {
  x: number
  y: number
}

const centerOf = (rect: DOMRect): Point => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
})

/** O lugar mais perto do centro do item arrastado (serve para lista e para grade). */
export function nearestIndex(rects: readonly DOMRect[], point: Point): number {
  let best = 0
  let bestDistance = Infinity
  rects.forEach((rect, index) => {
    const center = centerOf(rect)
    const distance = Math.hypot(center.x - point.x, center.y - point.y)
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  })
  return best
}

/** Onde fica o item que estava em `index` quando o arrastado sai de `from` e vai para `to`. */
export function shiftedIndex(index: number, from: number, to: number): number {
  if (index === from) return to
  if (from < index && index <= to) return index - 1
  if (to <= index && index < from) return index + 1
  return index
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Drag {
  id: string
  ids: string[]
  from: number
  to: number
  start: Point
  rects: DOMRect[]
}

interface Press {
  id: string
  element: HTMLElement
  start: Point
  last: Point
  pointerId: number
  timer: ReturnType<typeof setTimeout>
}

export interface SortableOptions {
  ids: readonly string[]
  onMove: (from: number, to: number) => void
  disabled?: boolean
}

/** O motor do arrastar de uma lista; a parte React fica em `useSortable`. */
export class SortableEngine {
  private options: SortableOptions = { ids: [], onMove: () => {} }
  private readonly items = new Map<string, HTMLElement>()
  private readonly handles = new Map<string, HTMLElement>()
  private drag: Drag | null = null
  private press: Press | null = null
  private pendingFlip: Map<string, DOMRect> | null = null
  private focusAfter: string | null = null
  private suppressClick = false

  setOptions(options: SortableOptions) {
    this.options = options
  }

  registerItem(id: string, element: HTMLElement | null) {
    if (element) this.items.set(id, element)
    else this.items.delete(id)
  }

  registerHandle(id: string, element: HTMLElement | null) {
    if (element) this.handles.set(id, element)
    else this.handles.delete(id)
  }

  get isActive() {
    return this.drag !== null
  }

  /** Move com animação (setas na tela ou no teclado) e devolve o foco ao puxador do item. */
  move(from: number, to: number, focusId?: string) {
    const { ids, onMove } = this.options
    if (from === to || to < 0 || to >= ids.length) return
    this.pendingFlip = this.snapshot()
    if (focusId) this.focusAfter = focusId
    onMove(from, to)
  }

  /**
   * Depois de cada render: anima o que mudou de lugar e devolve o foco. Se a lista mudou por fora
   * (item criado ou apagado), os que ficaram deslizam até o lugar novo e o novo aparece suave.
   */
  afterRender() {
    const idsKey = this.options.ids.join('|')
    const listChanged = this.lastIdsKey !== null && idsKey !== this.lastIdsKey
    const before = this.pendingFlip ?? (listChanged ? this.lastRects : null)
    this.pendingFlip = null
    if (before) this.playFlip(before, listChanged)
    if (this.focusAfter) {
      this.handles.get(this.focusAfter)?.focus({ preventScroll: true })
      this.focusAfter = null
    }
    this.lastIdsKey = idsKey
    this.lastRects = this.snapshot()
  }

  private lastIdsKey: string | null = null
  private lastRects: Map<string, DOMRect> | null = null

  handlePointerDown(id: string, event: PointerEvent) {
    if (this.options.disabled || event.button > 0) return
    event.preventDefault()
    event.stopPropagation()
    this.startDrag(id, { x: event.clientX, y: event.clientY }, event.pointerId, event.target)
  }

  handleKeyDown(id: string, event: KeyboardEvent) {
    const delta = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[event.key]
    if (delta === undefined || this.options.disabled) return
    event.preventDefault()
    const from = this.options.ids.indexOf(id)
    this.move(from, from + delta, id)
  }

  /** Dedo no cartão: segurar meio segundo sem mexer ativa o arrastar. */
  itemPointerDown(id: string, event: PointerEvent) {
    if (this.options.disabled || event.pointerType !== 'touch' || this.drag || this.press) return
    const element = this.items.get(id)
    if (!element) return
    const start = { x: event.clientX, y: event.clientY }
    const timer = setTimeout(() => {
      const press = this.press
      this.endPress()
      if (!press) return
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      navigator.vibrate?.(12)
      this.suppressClick = true
      this.startDrag(press.id, press.last, press.pointerId, press.element)
    }, LONG_PRESS_MS)
    this.press = { id, element, start, last: start, pointerId: event.pointerId, timer }
    element.dataset.pressing = 'true'
    this.listen()
  }

  destroy() {
    this.endPress()
    this.unlisten()
  }

  /** Posição na página (não na tela): rolar entre dois renders não conta como mudar de lugar. */
  private pageRect(element: HTMLElement): DOMRect {
    const rect = element.getBoundingClientRect()
    return new DOMRect(
      rect.left + window.scrollX,
      rect.top + window.scrollY,
      rect.width,
      rect.height,
    )
  }

  private snapshot(): Map<string, DOMRect> {
    return new Map([...this.items].map(([id, element]) => [id, this.pageRect(element)]))
  }

  private playFlip(before: Map<string, DOMRect>, animateNew = false) {
    if (prefersReducedMotion()) return
    for (const [id, element] of this.items) {
      if (typeof element.animate !== 'function') continue
      const old = before.get(id)
      if (!old) {
        if (animateNew) {
          element.animate(
            [
              { opacity: 0, transform: 'scale(0.96)' },
              { opacity: 1, transform: 'none' },
            ],
            SLIDE,
          )
        }
        continue
      }
      const now = this.pageRect(element)
      const dx = old.left - now.left
      const dy = old.top - now.top
      if (dx === 0 && dy === 0) continue
      element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], SLIDE)
    }
  }

  private startDrag(id: string, start: Point, pointerId: number, capture: EventTarget | null) {
    const ids = [...this.options.ids]
    const from = ids.indexOf(id)
    if (from === -1) return
    const rects = ids.map(
      (itemId) => this.items.get(itemId)?.getBoundingClientRect() ?? new DOMRect(),
    )
    if (capture instanceof Element) {
      try {
        capture.setPointerCapture(pointerId)
      } catch {
        // O dedo já saiu: o arrastar termina no próximo "soltar".
      }
    }
    this.drag = { id, ids, from, to: from, start, rects }
    const reduced = prefersReducedMotion()
    for (const [itemId, element] of this.items) {
      if (itemId === id) element.dataset.dragging = 'true'
      else if (!reduced) element.style.transition = `transform 200ms ${SLIDE.easing}`
    }
    document.body.style.userSelect = 'none'
    this.listen()
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    const point = { x: event.clientX, y: event.clientY }
    if (this.press) {
      this.press.last = point
      const moved = Math.hypot(point.x - this.press.start.x, point.y - this.press.start.y)
      if (moved > PRESS_TOLERANCE_PX) this.endPress()
      return
    }
    const drag = this.drag
    if (!drag) return
    const dx = point.x - drag.start.x
    const dy = point.y - drag.start.y
    this.items
      .get(drag.id)
      ?.style.setProperty('transform', `translate(${dx}px, ${dy}px) scale(1.02)`)
    const origin = drag.rects[drag.from]
    if (!origin) return
    const center = centerOf(origin)
    drag.to = nearestIndex(drag.rects, { x: center.x + dx, y: center.y + dy })
    drag.ids.forEach((itemId, index) => {
      if (index === drag.from) return
      const own = drag.rects[index]
      const slot = drag.rects[shiftedIndex(index, drag.from, drag.to)]
      const element = this.items.get(itemId)
      if (!own || !slot || !element) return
      const shift = slot.left !== own.left || slot.top !== own.top
      element.style.transform = shift
        ? `translate(${slot.left - own.left}px, ${slot.top - own.top}px)`
        : ''
    })
  }

  private readonly onPointerUp = () => {
    this.endPress()
    const drag = this.drag
    this.drag = null
    this.unlisten()
    if (!drag) return
    // Mede com os itens ainda deslocados: a animação parte de onde cada um está na tela.
    const before = this.snapshot()
    for (const element of this.items.values()) {
      element.style.transform = ''
      element.style.transition = ''
      delete element.dataset.dragging
    }
    document.body.style.userSelect = ''
    this.focusAfter = drag.id
    if (this.suppressClick) setTimeout(() => (this.suppressClick = false), 60)
    if (drag.to !== drag.from) {
      this.pendingFlip = before
      this.options.onMove(drag.from, drag.to)
    } else {
      this.playFlip(before)
      this.afterRender()
    }
  }

  /** Soltar depois de arrastar com o dedo não pode abrir o teclado nem clicar no que estava embaixo. */
  private readonly onClick = (event: MouseEvent) => {
    if (!this.suppressClick) return
    event.preventDefault()
    event.stopPropagation()
    this.suppressClick = false
  }

  /** Durante o arrastar a página não rola; o menu do "segurar" também não abre. */
  private readonly onTouchMove = (event: TouchEvent) => {
    if (this.drag) event.preventDefault()
  }

  private readonly onContextMenu = (event: Event) => {
    if (this.drag || this.press) event.preventDefault()
  }

  private endPress() {
    if (!this.press) return
    clearTimeout(this.press.timer)
    delete this.press.element.dataset.pressing
    this.press = null
    if (!this.drag) this.unlisten()
  }

  private listening = false

  private listen() {
    if (this.listening) return
    this.listening = true
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)
    window.addEventListener('click', this.onClick, true)
    document.addEventListener('touchmove', this.onTouchMove, { passive: false })
    document.addEventListener('contextmenu', this.onContextMenu)
  }

  private unlisten() {
    if (!this.listening) return
    this.listening = false
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointercancel', this.onPointerUp)
    document.removeEventListener('touchmove', this.onTouchMove)
    document.removeEventListener('contextmenu', this.onContextMenu)
    // O clique que vem logo depois do "soltar" ainda precisa ser engolido.
    setTimeout(() => {
      if (!this.listening) window.removeEventListener('click', this.onClick, true)
    }, 80)
  }
}
