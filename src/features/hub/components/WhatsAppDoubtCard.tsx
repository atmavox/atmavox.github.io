import { contactCta } from '../content'
import { SocialIcon } from './SocialIcon'

/**
 * "Ficou com alguma dúvida?" com o botão do WhatsApp (Contato e hub Ativações). No celular, o texto
 * fica inteiro numa linha com o ícone e o botão ocupa a largura toda embaixo; com espaço, tudo numa
 * linha só (pedido de 2026-11-25: o botão espremido ao lado quebrava o texto).
 */
export function WhatsAppDoubtCard({ note }: { note: string }) {
  return (
    <div className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-surface p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink">
          <SocialIcon id="whatsapp" size={21} />
        </span>
        <span className="min-w-0">
          <b className="block font-display text-lg leading-snug font-medium text-ink">
            Ficou com alguma dúvida?
          </b>
          <span className="block text-sm leading-snug text-ink-faint">{note}</span>
        </span>
      </div>
      <a
        href={contactCta.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent sm:w-auto"
      >
        <SocialIcon id="whatsapp" size={16} />
        Chamar no WhatsApp
      </a>
    </div>
  )
}
