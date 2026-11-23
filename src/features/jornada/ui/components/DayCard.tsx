import { Check, Lock } from 'lucide-react'
import { useId, useState } from 'react'
import {
  canCompleteDay,
  dayOpensAt,
  dayStepCount,
  isDayUnlocked,
  isStepDone,
  isStepSatisfied,
  isStepUnlocked,
} from '../../domain/access'
import type { DaySection, JourneyDay } from '../../domain/journey'
import { lockedDayHint } from '../releaseLabel'
import { useJourney } from '../useJourney'
import { DaySectionView } from './DaySectionView'

const SECTION_NAMES: Record<DaySection['type'], string> = {
  checkin: 'Check-in energético',
  ritual: 'Ritual',
  prompt: 'Reflexão',
  affirmation: 'Afirmação',
  closing: 'Fechamento',
  text: 'Texto',
  quote: 'Citação',
  divider: 'Divisor',
  image: 'Imagem',
  video: 'Vídeo',
  audio: 'Áudio',
}

function sectionTitle(section: DaySection): string {
  return 'label' in section ? section.label : SECTION_NAMES[section.type]
}

/** Etapa ainda fechada: mostra só o nome, para a pessoa ver o caminho do dia. */
function LockedStep({ section }: { section: DaySection }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-ink-faint">
      <Lock aria-hidden size={14} />
      <span>{sectionTitle(section)}</span>
      <span className="ml-auto text-xs">conclua a etapa anterior</span>
    </div>
  )
}

/** "Feito ✦" no fim de cada etapa aberta; perguntas pedem uma resposta antes. */
function StepDoneButton({ day, section }: { day: number; section: DaySection }) {
  const { progress, store } = useJourney()
  const satisfied = isStepSatisfied(progress, day, section)
  const hintId = useId()
  const hint =
    section.type === 'prompt'
      ? 'Escreva sua resposta para marcar como feito.'
      : 'Escolha sua temperatura energética ou escreva algo para marcar como feito.'

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={!satisfied}
        aria-describedby={satisfied ? undefined : hintId}
        onClick={() => store.markStepDone(section.id)}
        className="rounded-full border border-accent px-4 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:border-line disabled:text-ink-faint disabled:hover:bg-transparent"
      >
        Feito ✦
      </button>
      {!satisfied && (
        <span id={hintId} className="text-xs text-ink-faint">
          {hint}
        </span>
      )}
    </div>
  )
}

export function DayCard({ day }: { day: JourneyDay }) {
  const { journey, progress, store, access } = useJourney()
  const [isOpen, setIsOpen] = useState(false)
  const contentId = useId()
  const isDone = progress.completedDays.includes(day.number)
  const isUnlocked = isDayUnlocked(journey, progress, day.number, access)
  const isHighlighted = isDone || day.isReview
  const dayLabel = String(day.number).padStart(2, '0')
  const canComplete = canCompleteDay(progress, day)
  const steps = dayStepCount(progress, day)

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-surface transition-colors ${
        isHighlighted ? 'border-accent/50' : 'border-line hover:border-accent/30'
      } ${isUnlocked ? '' : 'opacity-70'}`}
    >
      <div className="flex items-center gap-3 p-4">
        <h2 className="flex-1">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={contentId}
            disabled={!isUnlocked}
            onClick={() => setIsOpen((open) => !open)}
            className="flex w-full items-center gap-4 text-left disabled:cursor-not-allowed"
          >
            <span
              aria-hidden="true"
              className={`min-w-10 font-display text-3xl font-bold ${isHighlighted ? 'text-accent' : 'text-gray-state'}`}
            >
              {dayLabel}
            </span>
            <span className="flex-1">
              {/* Os espaços explícitos evitam que leitores de tela leiam as partes coladas. */}
              <span className="sr-only">{`Dia ${day.number}:`}</span>{' '}
              <span className="block font-display leading-snug font-bold text-ink">
                {day.title}
                {day.isReview && (
                  <span aria-hidden="true" className="text-accent">
                    {' '}
                    ✦
                  </span>
                )}
              </span>
              <span className="sr-only">.</span>{' '}
              <span className="block text-sm text-ink-muted">
                {isUnlocked
                  ? day.subtitle
                  : lockedDayHint(dayOpensAt(journey, progress, day.number), access.now ?? 0)}
              </span>
            </span>
            {isUnlocked && (
              <span
                aria-hidden="true"
                className={`text-ink-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                ▾
              </span>
            )}
          </button>
        </h2>
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full border text-sm ${
            isDone ? 'border-accent bg-accent/15 text-accent' : 'border-line text-ink-faint'
          }`}
          title={isDone ? 'Dia concluído' : isUnlocked ? 'Em andamento' : 'Fechado'}
        >
          {isUnlocked ? (
            <span aria-hidden="true">{isDone ? '✦' : `${steps.done}/${steps.total}`}</span>
          ) : (
            <Lock aria-hidden size={14} />
          )}
          <span className="sr-only">
            {isDone
              ? `Dia ${day.number} concluído`
              : isUnlocked
                ? `Dia ${day.number}: ${steps.done} de ${steps.total} etapas feitas`
                : `Dia ${day.number} fechado`}
          </span>
        </span>
      </div>

      <div
        id={contentId}
        hidden={!isOpen || !isUnlocked}
        className="flex flex-col gap-6 border-t border-line px-4 pt-4 pb-5"
      >
        {day.sections.map((section, index) => {
          if (!isStepUnlocked(progress, day, index, access)) {
            return <LockedStep key={section.id} section={section} />
          }
          return (
            <div key={section.id}>
              <DaySectionView day={day.number} section={section} />
              {!isStepDone(progress, day.number, section) && (
                <StepDoneButton day={day.number} section={section} />
              )}
            </div>
          )
        })}
        {isDone ? (
          <p className="flex items-center gap-2 self-start rounded-full border border-accent px-5 py-2.5 text-sm font-medium text-accent">
            <Check aria-hidden size={16} /> Dia concluído
          </p>
        ) : (
          <button
            type="button"
            disabled={!canComplete}
            onClick={() => store.completeDay(day.number)}
            className="self-start rounded-full bg-accent px-5 py-2.5 text-sm font-medium tracking-wide text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {canComplete ? 'Concluir dia ✦' : 'Conclua as etapas para fechar o dia'}
          </button>
        )}
      </div>
    </article>
  )
}
