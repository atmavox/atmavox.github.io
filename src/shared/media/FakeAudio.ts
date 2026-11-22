import type { AudioElementLike } from './audioPlayer'

/** <audio> de mentira para testes: dispara os mesmos eventos, sem som nem rede. */
export class FakeAudio extends EventTarget implements AudioElementLike {
  src = ''
  currentTime = 0
  duration = Number.NaN
  private level = 1
  private readonly ignoresVolume: boolean

  /** `ignoresVolume` simula o iPhone/iPad, onde o Safari ignora o volume definido pela página. */
  constructor(ignoresVolume = false) {
    super()
    this.ignoresVolume = ignoresVolume
  }

  get volume() {
    return this.level
  }
  set volume(value: number) {
    if (!this.ignoresVolume) this.level = value
  }

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
