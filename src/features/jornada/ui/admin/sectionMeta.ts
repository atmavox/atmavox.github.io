import type { SectionType } from '../../domain/journey'

/** Nome e descrição curta de cada bloco no menu "Adicionar bloco" (textos do protótipo aprovado). */
export const SECTION_META: Record<SectionType, { name: string; about: string }> = {
  checkin: { name: 'Check-in', about: 'Como chega ao dia' },
  ritual: { name: 'Ritual', about: 'Prática guiada' },
  prompt: { name: 'Pergunta', about: 'Para escrever' },
  affirmation: { name: 'Afirmação', about: 'Frase em destaque' },
  closing: { name: 'Fechamento', about: 'Temperatura do dia' },
  audio: { name: 'Áudio', about: 'Link do áudio' },
  video: { name: 'Vídeo', about: 'Link do YouTube ou outro' },
  image: { name: 'Imagem', about: 'Foto ou ilustração' },
  quote: { name: 'Citação', about: 'Trecho em destaque' },
  text: { name: 'Texto', about: 'Parágrafo livre' },
  divider: { name: 'Divisor', about: 'Um respiro' },
}

/** Ordem dos ladrilhos no menu, como no protótipo. */
export const PICKER_ORDER: readonly SectionType[] = [
  'checkin',
  'ritual',
  'prompt',
  'affirmation',
  'closing',
  'audio',
  'video',
  'image',
  'quote',
  'text',
  'divider',
]
