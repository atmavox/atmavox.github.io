import type { AudioElementLike } from './audioPlayer'

/** <audio> de mentira para testes: dispara os mesmos eventos, sem som nem rede. */
export class FakeAudio extends EventTarget implements AudioElementLike {
  src = ''
  currentTime = 0
  duration = Number.NaN

  play() {
    this.dispatchEvent(new Event('playing'))
    return Promise.resolve()
  }
  pause() {
    this.dispatchEvent(new Event('pause'))
  }
  load() {
    this.duration = 300
    this.dispatchEvent(new Event('loadedmetadata'))
  }
  tick(seconds: number) {
    this.currentTime = seconds
    this.dispatchEvent(new Event('timeupdate'))
  }
}
