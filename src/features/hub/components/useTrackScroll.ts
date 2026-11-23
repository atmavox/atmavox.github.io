import { useCallback, useEffect, useRef, useState } from 'react'

interface TrackState {
  /** Os cartões passam da largura: só então as setas aparecem. */
  overflow: boolean
  atStart: boolean
  atEnd: boolean
  /** Cartão mais à esquerda visível (para os pontinhos do celular). */
  index: number
}

const INITIAL: TrackState = { overflow: false, atStart: true, atEnd: true, index: 0 }

/** Acompanha a rolagem de uma fileira de cartões (setas no computador, pontinhos no celular). */
export function useTrackScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [state, setState] = useState<TrackState>(INITIAL)

  useEffect(() => {
    const track = ref.current
    if (!track) return
    const update = () => {
      const items = Array.from(track.children) as HTMLElement[]
      const first = items[0]?.offsetLeft ?? 0
      const left = track.scrollLeft
      const max = track.scrollWidth - track.clientWidth
      let index = 0
      items.forEach((item, i) => {
        if (item.offsetLeft - first <= left + 4) index = i
      })
      if (max > 2 && left >= max - 2) index = items.length - 1
      setState({ overflow: max > 2, atStart: left <= 2, atEnd: left >= max - 2, index })
    }
    const frame = requestAnimationFrame(update)
    track.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(track)
    return () => {
      cancelAnimationFrame(frame)
      track.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer?.disconnect()
    }
  }, [])

  const scrollPage = useCallback((direction: 1 | -1) => {
    const track = ref.current
    if (!track) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollBy({
      left: direction * track.clientWidth * 0.85,
      behavior: reduced ? 'auto' : 'smooth',
    })
  }, [])

  return { ref, ...state, scrollPage }
}
