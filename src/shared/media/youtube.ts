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
