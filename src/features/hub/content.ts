import { brandLinks } from '../../shared/brand/links'

export const comingSoon = {
  eyebrow: 'ATMAVOX · Protocolo de Ativação',
  title: 'Saindo do Estado Cinza',
  subtitle: 'Energia, presença e direção. Nossa nova casa está quase pronta.',
  primaryAction: { label: 'Ouvir o áudio grátis (5 min)', href: brandLinks.freeAudio },
  secondaryActions: [
    { label: 'Instagram', href: brandLinks.instagram },
    { label: 'WhatsApp', href: brandLinks.whatsapp },
  ],
} as const
