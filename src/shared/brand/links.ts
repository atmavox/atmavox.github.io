import { buildWhatsAppLink } from '../lib/whatsapp'

// Fonte única dos links da marca, usada pelo hub e pela jornada (.ai/brand.md).
export const WHATSAPP_PHONE = '5547991889442'

export const brandLinks = {
  freeAudio: 'https://youtu.be/jKuKSAQUTCA',
  instagram: 'https://instagram.com/atmavox',
  facebook: 'https://facebook.com/atmavox',
  youtube: 'https://youtube.com/@atmavox',
  whatsapp: buildWhatsAppLink(WHATSAPP_PHONE),
} as const

export const BRAND_SIGNATURE = 'Com presença e direção — Andreia Oliveira · ATMAVOX'
