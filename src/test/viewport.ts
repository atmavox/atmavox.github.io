// O jsdom não tem matchMedia. Este falso responde "tela larga?" conforme o teste pedir.
let isWide = false

export function setWideViewport(wide: boolean) {
  isWide = wide
}

export function installMatchMedia() {
  window.matchMedia = (query: string) =>
    ({
      // Testes rodam como "reduzir movimento": as janelas fecham na hora, sem esperar a animação.
      matches: query.includes('min-width') ? isWide : query.includes('reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
