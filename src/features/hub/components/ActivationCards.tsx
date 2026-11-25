import { DEFAULT_THERAPIES } from '../../../shared/ativacao/therapy'
import { TherapyBadge } from '../../../shared/ui/TherapyIcon'
import { contactCta } from '../content'
import { SocialIcon } from './SocialIcon'
import { WhatsAppDoubtCard } from './WhatsAppDoubtCard'

/**
 * Contato (mock aprovado, C): a ativação individual em destaque e a dúvida pelo WhatsApp ao lado.
 * "Quero agendar" leva ao hub Ativações (`#/ativacoes`), de onde o agendamento abre.
 */
export function ActivationCards({ layout }: { layout: 'wide' | 'narrow' }) {
  const isWide = layout === 'wide'
  const icons = (size: number) => (
    <span className="flex items-center gap-1.5">
      {DEFAULT_THERAPIES.map((t) => (
        <TherapyBadge key={t.id} icon={t.icon} tone={t.tone} size={size} />
      ))}
    </span>
  )

  const activation = (
    <div
      className={`flex gap-4 rounded-[18px] border border-accent/35 bg-surface ${
        isWide ? 'items-center px-5 py-4.5' : 'flex-col p-4'
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
            Ativação individual
          </p>
          {!isWide && icons(22)}
        </div>
        <b className="font-display text-xl font-medium text-ink">Um encontro só seu</b>
        {isWide && (
          <span className="flex items-center gap-2.5">
            {icons(28)}
            <span className="text-sm text-ink-faint">presencial ou a distância</span>
          </span>
        )}
      </div>
      <a
        href="#/ativacoes"
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold whitespace-nowrap text-bg transition-opacity hover:opacity-90"
      >
        Quero agendar
      </a>
    </div>
  )

  const whatsapp = isWide ? (
    <div className="flex flex-col gap-2 rounded-[18px] border border-line bg-surface px-5 py-4.5">
      <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
        <SocialIcon id="whatsapp" size={15} />
        WhatsApp
      </p>
      <b className="font-display text-xl font-medium text-ink">Ficou com alguma dúvida?</b>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-ink-faint">Fale direto com a Andreía.</span>
        <a
          href={contactCta.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-ink transition-colors hover:border-accent"
        >
          <SocialIcon id="whatsapp" size={16} />
          Chamar no WhatsApp
        </a>
      </div>
    </div>
  ) : (
    <WhatsAppDoubtCard note="Fale direto com a Andreía." />
  )

  return isWide ? (
    <div className="grid grid-cols-[1.25fr_1fr] gap-3.5">
      {activation}
      {whatsapp}
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      {activation}
      {whatsapp}
    </div>
  )
}
