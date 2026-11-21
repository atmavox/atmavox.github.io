import type { ReactNode } from 'react'
import { isExternalHref, parseInlineMarkup, type InlineNode } from '../lib/inlineMarkup'

function renderNodes(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'text':
        return node.text
      case 'strong':
        return (
          <strong key={index} className="font-medium text-ink">
            {renderNodes(node.children)}
          </strong>
        )
      case 'em':
        return <em key={index}>{renderNodes(node.children)}</em>
      case 'link':
        return (
          <a
            key={index}
            href={node.href}
            className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
            {...(isExternalHref(node.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {renderNodes(node.children)}
          </a>
        )
    }
  })
}

interface RichTextProps {
  text: string
  as?: 'p' | 'span' | 'div'
  className?: string
}

/** Texto com a marcação mínima do conteúdo. Quebras de linha (\n) são preservadas. */
export function RichText({ text, as: Tag = 'p', className = '' }: RichTextProps) {
  return (
    <Tag className={`whitespace-pre-line ${className}`}>{renderNodes(parseInlineMarkup(text))}</Tag>
  )
}
