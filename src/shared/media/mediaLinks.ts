/** Id de 11 caracteres de um link do YouTube (youtu.be, watch?v=, shorts, embed), ou null. */
export function youtubeIdFromUrl(url: string): string | null {
  const match = /(?:youtu\.be\/|[?&]v=|shorts\/|embed\/)([\w-]{11})(?![\w-])/.exec(url)
  return match?.[1] ?? null
}

/** Nome do site de um link ("vimeo.com"), para o cartão "Assistir ↗". */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/** Link direto para um arquivo de áudio (tocável no player do site). */
export function isAudioFileUrl(url: string): boolean {
  try {
    return /\.(mp3|m4a|aac|ogg|oga|opus|wav)$/i.test(new URL(url).pathname)
  } catch {
    return false
  }
}

/**
 * Como mostrar um link de vídeo ou áudio:
 * - youtube: miniatura que vira player ao tocar;
 * - audio-file: toca no player do site (com mini player);
 * - external: cartão que abre o site do link (Drive, SoundCloud, Instagram…), onde ele toca de verdade.
 */
export type MediaLink =
  | { kind: 'youtube'; videoId: string }
  | { kind: 'audio-file'; src: string }
  | { kind: 'external'; host: string }

export function classifyMediaLink(url: string): MediaLink {
  const videoId = youtubeIdFromUrl(url)
  if (videoId) return { kind: 'youtube', videoId }
  if (isAudioFileUrl(url)) return { kind: 'audio-file', src: url }
  return { kind: 'external', host: hostOf(url) }
}
