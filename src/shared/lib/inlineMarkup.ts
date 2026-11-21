export type InlineNode =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'em'; children: InlineNode[] }
  | { type: 'link'; href: string; children: InlineNode[] }

// Só links https e rotas internas (#/...): nada de javascript: ou outros esquemas.
const TOKEN = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(((?:https:\/\/|#\/)[^)\s]+)\)/s

/** Interpreta a marcação mínima dos textos: **negrito**, *itálico* e [texto](link). */
export function parseInlineMarkup(input: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let rest = input

  while (rest.length > 0) {
    const match = TOKEN.exec(rest)
    if (!match) {
      nodes.push({ type: 'text', text: rest })
      break
    }
    if (match.index > 0) nodes.push({ type: 'text', text: rest.slice(0, match.index) })

    const [whole, strong, em, linkText, href] = match
    if (strong !== undefined) nodes.push({ type: 'strong', children: parseInlineMarkup(strong) })
    else if (em !== undefined) nodes.push({ type: 'em', children: parseInlineMarkup(em) })
    else if (linkText !== undefined && href !== undefined)
      nodes.push({ type: 'link', href, children: parseInlineMarkup(linkText) })

    rest = rest.slice(match.index + whole.length)
  }

  return nodes
}

export function isExternalHref(href: string): boolean {
  return href.startsWith('https://')
}
