import { useEffect, useRef } from 'react'
import { getAudioPlayer } from './useAudioPlayer'

/**
 * Cada área do site (hub ou jornada) tem o seu áudio: ao passar de uma para a outra, o que estava
 * tocando para e o mini player fecha (pedido do cliente: o áudio da página inicial não deve "ir junto"
 * para a jornada). Dentro da mesma área (trocar de aba), o áudio continua.
 */
export function useStopAudioOnAreaChange(area: string) {
  const previous = useRef(area)
  useEffect(() => {
    if (previous.current === area) return
    previous.current = area
    const player = getAudioPlayer()
    if (player.getSnapshot().track) player.close()
  }, [area])
}
