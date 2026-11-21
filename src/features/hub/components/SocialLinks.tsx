import { socials } from '../content'
import { SocialIcon } from './SocialIcon'

/** "icons": fileira de ícones redondos. "list": linhas com nome e @ (aba Contato do celular). */
export function SocialLinks({ variant }: { variant: 'icons' | 'list' }) {
  if (variant === 'list') {
    return (
      <ul aria-label="Redes sociais" className="flex flex-col">
        {socials.map((social) => (
          <li key={social.id}>
            <a
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center gap-4 border-b border-line text-ink hover:text-accent"
            >
              <span className="text-gold">
                <SocialIcon id={social.id} size={20} />
              </span>
              <span className="flex-1">{social.name}</span>
              <span className="text-sm text-ink-faint">{social.handle}</span>
            </a>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul aria-label="Redes sociais" className="flex flex-wrap gap-2">
      {socials.map((social) => (
        <li key={social.id}>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.name}
            className="grid size-11 place-items-center rounded-full border border-line text-gold transition-colors hover:border-accent hover:text-accent"
          >
            <SocialIcon id={social.id} />
          </a>
        </li>
      ))}
    </ul>
  )
}
