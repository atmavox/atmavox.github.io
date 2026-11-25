import { describe, expect, it } from 'vitest'

// Regra de conventions.md: sem emoji no site (cada aparelho desenha de um jeito e foge da marca).
// Sinais tipográficos da marca continuam valendo; o check de texto não (o sinal de feito é o ícone "check" do UiIcon).
const ALLOWED = new Set(['✦', '✕', '↗', '←', '→', '↑', '↓', '·', '©'])

const sources = import.meta.glob<string>('/src/**/*.{ts,tsx,css}', {
  query: '?raw',
  import: 'default',
  eager: true,
})

describe('sem emoji no código do site', () => {
  it('nenhum arquivo usa emoji (use ícones SVG próprios)', () => {
    const found = Object.entries(sources).flatMap(([path, text]) =>
      [...text.matchAll(/\p{Extended_Pictographic}/gu)]
        .map((match) => match[0])
        .filter((char) => !ALLOWED.has(char))
        .map((char) => `${path}: ${char}`),
    )
    expect(found).toEqual([])
  })
})
