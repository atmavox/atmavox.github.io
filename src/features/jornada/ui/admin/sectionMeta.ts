import {
  AlignLeft,
  Flame,
  Gauge,
  Headphones,
  Image,
  Minus,
  Moon,
  PenLine,
  Quote,
  Sparkles,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type { SectionType } from '../../domain/journey'

/** Nome, ícone e explicação curta de cada tipo de bloco (o menu "+ bloco" usa ícones, não emojis). */
export const SECTION_META: Record<SectionType, { name: string; icon: LucideIcon; about: string }> =
  {
    ritual: { name: 'Ritual', icon: Flame, about: 'Uma prática guiada, com "Feito".' },
    prompt: { name: 'Pergunta', icon: PenLine, about: 'A pessoa escreve a resposta.' },
    affirmation: { name: 'Afirmação', icon: Sparkles, about: 'Frase + versão da pessoa.' },
    closing: { name: 'Fechamento', icon: Moon, about: 'Temperatura energética + texto.' },
    checkin: { name: 'Check-in', icon: Gauge, about: 'Como a pessoa chega hoje.' },
    text: { name: 'Texto', icon: AlignLeft, about: 'Um parágrafo para ler.' },
    quote: { name: 'Citação', icon: Quote, about: 'Frase em destaque.' },
    divider: { name: 'Divisor', icon: Minus, about: 'Uma linha para separar.' },
    image: { name: 'Imagem', icon: Image, about: 'Uma foto ou ilustração.' },
    video: { name: 'Vídeo', icon: Video, about: 'Link do YouTube ou outro site.' },
    audio: { name: 'Áudio', icon: Headphones, about: 'Link do Drive, SoundCloud…' },
  }
