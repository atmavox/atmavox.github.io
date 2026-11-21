import { describe, expect, it } from 'vitest'
import { buildWhatsAppLink } from './whatsapp'

describe('buildWhatsAppLink', () => {
  it('mantém só os dígitos do telefone', () => {
    expect(buildWhatsAppLink('+55 (47) 99188-9442')).toBe('https://wa.me/5547991889442')
  })

  it('codifica a mensagem pronta no parâmetro text', () => {
    expect(buildWhatsAppLink('5547991889442', 'Olá, Andreia! Quero saber mais.')).toBe(
      'https://wa.me/5547991889442?text=Ol%C3%A1%2C%20Andreia!%20Quero%20saber%20mais.',
    )
  })
})
