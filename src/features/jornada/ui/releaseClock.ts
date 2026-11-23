import { useSyncExternalStore } from 'react'
import { calendarDay, nextMidnight } from '../domain/release'

/**
 * Um relógio só para toda a jornada: muda à meia-noite de Brasília (o dia novo abre sem recarregar) e
 * quando a pessoa volta para a aba num dia diferente (o celular pode ter dormido no meio).
 */
let now = Date.now()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | undefined

function tick() {
  now = Date.now()
  listeners.forEach((listener) => listener())
  schedule()
}

function schedule() {
  clearTimeout(timer)
  // Um segundo de folga: o timer pode disparar um pouco antes da hora.
  timer = setTimeout(tick, nextMidnight(now) - now + 1000)
}

function onVisible() {
  if (document.visibilityState === 'visible' && calendarDay(Date.now()) !== calendarDay(now)) tick()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    if (calendarDay(Date.now()) !== calendarDay(now)) now = Date.now()
    schedule()
    document.addEventListener('visibilitychange', onVisible)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }
}

/** A hora atual, atualizada a cada dia novo da jornada. */
export function useReleaseClock(): number {
  return useSyncExternalStore(subscribe, () => now)
}
