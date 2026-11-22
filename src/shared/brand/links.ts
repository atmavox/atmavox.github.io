import { buildWhatsAppLink } from '../lib/whatsapp'

// Fonte única da identidade e dos links da marca, usada pelo hub e pela jornada (.ai/brand.md).

/** Grafia oficial, com os dois acentos (numerologia). Use sempre esta constante em textos públicos. */
export const BRAND_PERSON = 'Andreía Oliveirà'
export const BRAND_FIRST_NAME = 'Andreía'
export const BRAND_SLOGAN = 'Consciência, presença e expansão.'
export const BRAND_SIGNATURE = `Com presença — ${BRAND_PERSON}`

export const WHATSAPP_PHONE = '5547991889442'

export const brandLinks = {
  /** Vídeo "Retorne ao Seu Centro" (5 min), usado na jornada (ritual do dia 5). */
  retorneAoSeuCentro: 'https://youtu.be/jKuKSAQUTCA',
  instagram: 'https://instagram.com/atmavox',
  facebook: 'https://facebook.com/atmavox',
  youtube: 'https://youtube.com/@atmavox',
  tiktok: 'https://www.tiktok.com/@atmavox',
  whatsapp: buildWhatsAppLink(WHATSAPP_PHONE),
} as const

/** Mensagem pronta de WhatsApp, já com a saudação no nome oficial. */
export function whatsAppMessage(text: string): string {
  return buildWhatsAppLink(WHATSAPP_PHONE, `Olá, ${BRAND_FIRST_NAME}! ${text}`)
}
