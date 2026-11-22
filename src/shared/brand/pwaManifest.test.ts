import { describe, expect, it } from 'vitest'
import indexHtml from '../../../index.html?raw'
import manifestRaw from '../../../public/manifest.webmanifest?raw'

interface ManifestIcon {
  src: string
  sizes: string
  purpose?: string
}

const manifest = JSON.parse(manifestRaw) as {
  display: string
  start_url: string
  background_color: string
  theme_color: string
  icons: ManifestIcon[]
}

const iconFiles = Object.keys(import.meta.glob('/public/icons/*.png')).map((path) =>
  path.replace('/public', ''),
)

/** A cor Areia (tema claro, o padrão) que o index.html já usa na barra do navegador antes do React. */
const lightBackground = /name="theme-color" content="(#[0-9a-f]{6})"/i.exec(indexHtml)?.[1]

describe('PWA (instalar na tela inicial)', () => {
  it('abre como app, sem a barra do navegador', () => {
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
  })

  it('usa a cor Areia do tema claro no fundo e nas barras do sistema', () => {
    expect(lightBackground).toBeDefined()
    expect(manifest.background_color).toBe(lightBackground)
    expect(manifest.theme_color).toBe(lightBackground)
  })

  it('tem ícones de 192 e 512 px e um ícone maskable para o Android', () => {
    const sizes = manifest.icons.map((icon) => icon.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
  })

  it('aponta só para ícones que existem em public/icons', () => {
    for (const icon of manifest.icons) expect(iconFiles).toContain(icon.src)
    expect(iconFiles).toContain('/icons/apple-touch-icon.png')
  })

  it('está ligado no index.html', () => {
    expect(indexHtml).toContain('rel="manifest" href="/manifest.webmanifest"')
    expect(indexHtml).toContain('rel="apple-touch-icon"')
  })
})
