import { ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { durationLabel, MODALITY_LABELS, type Therapy } from '../../../shared/ativacao/therapy'
import { useAuthSession } from '../../../shared/auth/AuthContext'
import { readFirebaseConfig } from '../../../shared/firebase/config'
import { LoadingNote } from '../../../shared/ui/LoadingNote'
import { TherapyBadge } from '../../../shared/ui/TherapyIcon'
import { Portrait } from '../components/Portrait'
import { WhatsAppDoubtCard } from '../components/WhatsAppDoubtCard'
import { activationsIntro as copy } from '../content'
import {
  createInMemoryAtivacaoSource,
  createRestAtivacaoSource,
  type AtivacaoSource,
} from './ativacaoSource'

type Layout = 'wide' | 'narrow'

const primaryButton =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg transition-opacity hover:opacity-90'

/** "Agendar esta": o agendamento abre já com a terapia escolhida. */
const scheduleHref = (therapy: Therapy) => `#/ativacao/terapia/${therapy.id}`

/** As terapias ativas, na ordem da Andreía; `null` enquanto carrega. */
function useActiveTherapies(injected?: AtivacaoSource): Therapy[] | null {
  const { session } = useAuthSession()
  const source = useMemo<AtivacaoSource>(() => {
    if (injected) return injected
    const config = readFirebaseConfig(import.meta.env)
    if (!config || !session) return createInMemoryAtivacaoSource()
    return createRestAtivacaoSource(config, () => session.getIdToken())
  }, [injected, session])
  const [therapies, setTherapies] = useState<Therapy[] | null>(null)
  useEffect(() => {
    let cancelled = false
    void source
      .loadTherapies()
      .catch(() => [])
      .then((list) => {
        if (!cancelled) setTherapies(list.filter((t) => t.active && t.priceCents > 0))
      })
    return () => {
      cancelled = true
    }
  }, [source])
  return therapies
}

/**
 * Os anéis do fundo (o desenho da opção C do mock, parados): o centro fica perto do canto de cima à
 * esquerda, então o topo e a lateral cortam o círculo e o resto aparece quase inteiro.
 */
function Rings({ layout }: { layout: Layout }) {
  const isWide = layout === 'wide'
  const size = isWide ? 580 : 360
  const halo = isWide ? [60, 130] : [45, 95]
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/22"
      style={{
        width: size,
        height: size,
        left: isWide ? 170 : 40,
        top: isWide ? 120 : 250,
        boxShadow: `0 0 0 ${halo[0]}px color-mix(in oklab, var(--accent) 4%, transparent), 0 0 0 ${halo[1]}px color-mix(in oklab, var(--accent) 3%, transparent)`,
      }}
    />
  )
}

function Title({ className }: { className: string }) {
  return (
    <h1 className={`font-display leading-tight text-ink ${className}`}>
      {copy.titleStart}
      <em className="font-normal text-accent">{copy.titleAccent}</em>
      {copy.titleEnd}
    </h1>
  )
}

function Meta({ therapy }: { therapy: Therapy }) {
  return (
    <p className="text-sm text-ink-faint">
      {durationLabel(therapy.durationMin)} · {MODALITY_LABELS[therapy.modality]}
    </p>
  )
}

function Steps({ layout }: { layout: Layout }) {
  return (
    <ol className={`grid gap-4 ${layout === 'wide' ? 'grid-cols-2 gap-x-8' : ''}`}>
      {copy.steps.map((step, index) => (
        <li key={step.title} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full border border-accent/45 font-display text-accent"
          >
            {index + 1}
          </span>
          <span className="flex flex-col">
            <b className="font-semibold text-ink">{step.title}</b>
            <span className="text-sm leading-snug text-ink-faint">{step.detail}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

const whatsAppCard = <WhatsAppDoubtCard note="Fale direto com a Andreía antes de agendar." />

function TherapyList({ therapies, layout }: { therapies: Therapy[] | null; layout: Layout }) {
  if (!therapies) return <LoadingNote className="text-ink-muted" />
  if (therapies.length === 0) return <p className="text-ink-muted">{copy.empty}</p>
  if (layout === 'narrow') {
    return (
      <ul className="flex flex-col gap-2.5">
        {therapies.map((therapy) => (
          <li key={therapy.id}>
            <a
              href={scheduleHref(therapy)}
              aria-label={`Agendar: ${therapy.name}`}
              className="flex items-center gap-3.5 rounded-[18px] border border-line bg-surface p-3.5 transition-colors hover:border-accent"
            >
              <TherapyBadge icon={therapy.icon} tone={therapy.tone} size={42} />
              <span className="min-w-0 flex-1">
                <b className="block font-display text-base font-medium text-ink">{therapy.name}</b>
                <Meta therapy={therapy} />
              </span>
            </a>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {therapies.map((therapy) => (
        <li
          key={therapy.id}
          className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-surface p-[18px]"
        >
          <TherapyBadge icon={therapy.icon} tone={therapy.tone} size={46} />
          <b className="font-display text-lg leading-snug font-medium text-ink">{therapy.name}</b>
          <p className="flex-1 text-sm leading-relaxed text-ink-muted">{therapy.description}</p>
          <Meta therapy={therapy} />
          <a
            href={scheduleHref(therapy)}
            aria-label={`Agendar: ${therapy.name}`}
            className="text-sm font-semibold text-accent hover:underline"
          >
            Agendar esta
          </a>
        </li>
      ))}
    </ul>
  )
}

/**
 * Hub de ativações (`#/ativacoes`, mock aprovado D): o convite com o retrato da Andreía sobre os
 * anéis, as terapias ativas, como funciona e a dúvida pelo WhatsApp. O agendamento (`#/ativacao`)
 * abre numa janela por cima desta página.
 */
export default function ActivationsHub({
  layout,
  source,
}: {
  layout: Layout
  source?: AtivacaoSource
}) {
  const therapies = useActiveTherapies(source)
  const glow =
    'bg-[radial-gradient(45%_70%_at_14%_22%,color-mix(in_oklab,var(--accent)_20%,transparent),transparent_70%)]'

  if (layout === 'narrow') {
    return (
      <div className="flex flex-col gap-8">
        <section className="relative -mx-5 overflow-hidden px-5 pt-2 pb-2 bg-[radial-gradient(70%_45%_at_10%_52%,color-mix(in_oklab,var(--accent)_20%,transparent),transparent_70%)]">
          <Rings layout="narrow" />
          <div className="relative flex flex-col gap-4">
            <Portrait sizes="(max-width: 700px) 100vw, 600px" />
            <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-accent uppercase">
              {copy.eyebrow}
            </p>
            <Title className="text-[1.95rem]" />
            <p className="leading-relaxed text-ink-muted">{copy.introShort}</p>
            <a href="#/ativacao" className={`${primaryButton} w-full`}>
              {copy.cta}
            </a>
          </div>
        </section>
        <section aria-labelledby="praticas-titulo" className="flex flex-col gap-3">
          <h2 id="praticas-titulo" className="font-display text-[1.35rem] text-ink">
            Escolha a prática
          </h2>
          <TherapyList therapies={therapies} layout="narrow" />
        </section>
        <section aria-labelledby="como-titulo" className="flex flex-col gap-4">
          <h2 id="como-titulo" className="font-display text-[1.35rem] text-ink">
            Como funciona
          </h2>
          <Steps layout="narrow" />
        </section>
        {whatsAppCard}
      </div>
    )
  }

  return (
    <div className="pb-10">
      <section className={`relative overflow-hidden ${glow}`}>
        <Rings layout="wide" />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 md:px-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col gap-5">
            <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">
              {copy.eyebrow}
            </p>
            <Title className="text-4xl lg:text-5xl" />
            <p className="max-w-[46ch] text-lg leading-relaxed text-ink-muted">{copy.intro}</p>
            <div>
              <a href="#/ativacao" className={primaryButton}>
                {copy.cta}
                <ArrowRight aria-hidden size={18} />
              </a>
            </div>
          </div>
          <Portrait sizes="(min-width: 1000px) 520px, 90vw" />
        </div>
      </section>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-8 md:px-12">
        <section aria-labelledby="praticas-titulo" className="flex flex-col gap-5">
          <h2 id="praticas-titulo" className="font-display text-[1.7rem] text-ink">
            Escolha a prática
          </h2>
          <TherapyList therapies={therapies} layout="wide" />
        </section>
        <section
          aria-labelledby="como-titulo"
          className="grid items-start gap-10 lg:grid-cols-[1.3fr_1fr]"
        >
          <div className="flex flex-col gap-5">
            <h2 id="como-titulo" className="font-display text-[1.7rem] text-ink">
              Como funciona
            </h2>
            <Steps layout="wide" />
          </div>
          <div className="lg:pt-14">{whatsAppCard}</div>
        </section>
      </div>
    </div>
  )
}
