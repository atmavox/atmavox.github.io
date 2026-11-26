import { contactCta } from '../content'
import { SocialIcon } from './SocialIcon'

/**
 * "Ficou com alguma dúvida?" com o botão do WhatsApp (Contato e hub Ativações). Olha a largura do
 * próprio cartão, não a da tela: estreito (celular, coluna do hub Ativações), o ícone e o texto ficam em
 * cima e o botão na largura toda embaixo; largo, tudo numa linha (pedidos de 2026-11-25: o botão
 * espremido ao lado quebrava o título).
 */
export function WhatsAppDoubtCard({ note }: { note: string }) {
  return (
    <div className="@container rounded-[18px] border border-line bg-surface">
      <div className="flex flex-col gap-4 p-5 @lg:flex-row @lg:items-center @lg:gap-5 @lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink">
            <SocialIcon id="whatsapp" size={21} />
          </span>
          <span className="min-w-0">
            <b className="block font-display text-lg leading-snug font-medium text-ink">
              Ficou com alguma dúvida?
            </b>
            <span className="mt-0.5 block text-sm leading-snug text-ink-faint">{note}</span>
          </span>
        </div>
        <a
          href={contactCta.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent @lg:w-auto"
        >
          <SocialIcon id="whatsapp" size={16} />
          Chamar no WhatsApp
        </a>
      </div>
    </div>
  )
}
