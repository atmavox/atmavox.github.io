import { describe, expect, it } from 'vitest'
import { BRAND_PERSON, BRAND_SIGNATURE, whatsAppMessage } from './links'

describe('identidade da marca', () => {
  it('usa a grafia oficial do nome, com os dois acentos', () => {
    expect(BRAND_PERSON).toBe('Andreía Oliveirà')
    expect(BRAND_SIGNATURE).toBe('Com presença — Andreía Oliveirà')
  })

  it('não usa a palavra "direção" na assinatura', () => {
    expect(BRAND_SIGNATURE.toLowerCase()).not.toContain('direção')
  })

  it('monta a mensagem pronta do WhatsApp saudando pelo nome oficial', () => {
    const link = new URL(whatsAppMessage('Quero saber mais.'))
    expect(link.searchParams.get('text')).toBe('Olá, Andreía! Quero saber mais.')
  })
})
