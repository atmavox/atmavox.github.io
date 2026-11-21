import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { brandLinks } from '../../shared/brand/links'
import { HubPage } from './HubPage'

describe('HubPage', () => {
  it('mostra o título da marca', () => {
    render(<HubPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Saindo do Estado Cinza')
  })

  it('leva ao áudio grátis, ao Instagram e ao WhatsApp em nova aba', () => {
    render(<HubPage />)
    const expected = [
      ['Ouvir o áudio grátis (5 min)', brandLinks.freeAudio],
      ['Instagram', brandLinks.instagram],
      ['WhatsApp', brandLinks.whatsapp],
    ] as const

    for (const [name, href] of expected) {
      const link = screen.getByRole('link', { name })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })
})
