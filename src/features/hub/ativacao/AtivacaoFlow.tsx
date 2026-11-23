import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AnamnesisForm } from '../../../shared/ativacao/anamnesis'
import {
  answeredCount,
  answersFor,
  initialAnswers,
  sectionErrors,
  type Answer,
  type Answers,
} from '../../../shared/ativacao/answers'
import {
  localDate,
  longDate,
  timeLabel,
  type Availability,
} from '../../../shared/ativacao/availability'
import type { Therapy } from '../../../shared/ativacao/therapy'
import { useAuthSession } from '../../../shared/auth/AuthContext'
import { LoginDialog } from '../../../shared/auth/LoginDialog'
import { whatsAppMessage } from '../../../shared/brand/links'
import { formatPrice } from '../../../shared/catalog/offer'
import { readFirebaseConfig } from '../../../shared/firebase/config'
import { useMediaQuery } from '../../../shared/lib/useMediaQuery'
import { useNow } from '../../../shared/lib/useNow'
import { UiIcon } from '../../../shared/ui/UiIcon'
import { SocialIcon } from '../components/SocialIcon'
import { WIDE_LAYOUT_QUERY } from '../navigation'
import { AnswerField } from './AnswerField'
import {
  createInMemoryAtivacaoSource,
  createRestAtivacaoSource,
  type AtivacaoSource,
} from './ativacaoSource'
import { DateStep, type Preference } from './DateStep'
import { StepBar, StepDots, StepList } from './FlowSteps'
import { SummaryStep } from './SummaryStep'
import { TherapyStep } from './TherapyStep'

/** Etapas dentro da janela, depois do login (o índice é o mesmo de FLOW_STEPS). */
type Step = 1 | 2 | 3 | 4

interface Loaded {
  therapies: Therapy[]
  form: AnamnesisForm
  availability: Availability
}

/** O objeto sem uma chave (para limpar o erro de um campo). */
function without(record: Record<string, string>, key: string): Record<string, string> {
  const next = { ...record }
  delete next[key]
  return next
}

const goTo = (hash: string) => {
  window.location.hash = hash
}

const primary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50'
const ghost =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line px-5 text-ink-muted transition-colors hover:border-accent hover:text-ink'

/**
 * A ativação individual (mock aprovado, `atmavox-ativacao-pessoa-v3.html`): do login ao resumo, tudo
 * numa janela sobre o hub desfocado. Fechar antes de entrar volta ao início; depois, ao perfil.
 */
export function AtivacaoFlow({ source: injected }: { source?: AtivacaoSource }) {
  const { session, state } = useAuthSession()
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY)
  const today = localDate(useNow())
  const user = state?.user ?? null
  const titleId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)

  const source = useMemo<AtivacaoSource>(() => {
    if (injected) return injected
    const config = readFirebaseConfig(import.meta.env)
    if (!config || !session) return createInMemoryAtivacaoSource()
    return createRestAtivacaoSource(config, () => session.getIdToken())
  }, [injected, session])

  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [answers, setAnswers] = useState<Answers | null>(null)
  const [consent, setConsent] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [section, setSection] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [therapyId, setTherapyId] = useState<string | null>(null)
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [preference, setPreference] = useState<Preference | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      source.loadTherapies().catch(() => []),
      source.loadAnamnesis(),
      source.loadAvailability(),
    ]).then(([therapies, form, availability]) => {
      if (cancelled) return
      const visible = therapies.filter((t) => t.active && t.priceCents > 0)
      setLoaded({ therapies: visible, form, availability })
    })
    return () => {
      cancelled = true
    }
  }, [source])

  // As respostas de antes voltam preenchidas (para conferir); o nome da conta entra se faltar.
  const uid = user?.uid ?? null
  const displayName = user?.displayName ?? null
  useEffect(() => {
    if (!uid) return
    let cancelled = false
    void source
      .loadMyAnamnesis(uid)
      .catch(() => null)
      .then((saved) => {
        if (cancelled) return
        setAnswers(initialAnswers(saved, displayName))
        setConsent(saved?.consent ?? false)
      })
    return () => {
      cancelled = true
    }
  }, [uid, displayName, source])

  const close = () => goTo(user ? '#/perfil' : '#/')

  useEffect(() => {
    if (!user) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') goTo('#/perfil')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [user])

  useEffect(() => {
    bodyRef.current?.scrollTo?.({ top: 0 })
  }, [step, section])

  if (!state?.authChecked) return null

  if (!user || !session) {
    if (!session) return null
    return (
      <LoginDialog
        account={session}
        variant="ativacao"
        onClose={() => goTo('#/')}
        onSignedIn={() => {}}
        aside={
          <div className="flex flex-col gap-5">
            <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">
              Ativação individual
            </p>
            <StepList current={0} />
          </div>
        }
        header={<StepBar current={0} />}
      />
    )
  }

  const therapy = loaded?.therapies.find((t) => t.id === therapyId) ?? null
  const form = loaded?.form
  const sections = form?.sections ?? []
  const current = sections[section]
  const isLastSection = section === sections.length - 1

  function answer(id: string, value: Answer) {
    setAnswers((a) => ({ ...(a ?? {}), [id]: value }))
    setErrors((e) => without(e, id))
  }

  async function saveAnswers() {
    if (!form || !answers || !uid) return
    setIsSaving(true)
    try {
      await source.saveMyAnamnesis(uid, {
        answers: answersFor(form, answers),
        consent,
        updatedAt: Date.now(),
      })
      setNotice(null)
    } catch {
      // Sem rede (ou regras ainda não publicadas): segue com as respostas nesta janela.
      setNotice('Não deu para guardar suas respostas na conta agora. Elas seguem aqui com você.')
    } finally {
      setIsSaving(false)
    }
  }

  async function next() {
    if (!loaded || !answers) return
    if (step === 1 && current) {
      const found = sectionErrors(current, answers)
      if (isLastSection && !consent) found.consent = 'Marque para seguir.'
      setErrors(found)
      if (Object.keys(found).length) return
      if (!isLastSection) {
        setSection(section + 1)
        return
      }
      await saveAnswers()
      // Como no mock, a primeira terapia já vem escolhida (no computador, o banner dela aparece).
      setTherapyId((id) => id ?? loaded.therapies[0]?.id ?? null)
      setStep(2)
      return
    }
    if (step === 2) {
      if (!therapy) {
        setErrors({ therapy: 'Escolha uma terapia para seguir.' })
        return
      }
      const missing = Object.fromEntries(
        therapy.questions
          .filter((q) => !extra[q.id]?.trim())
          .map((q) => [q.id, 'Responda esta pergunta para seguir.']),
      )
      setErrors(missing)
      if (Object.keys(missing).length) return
      setStep(3)
      return
    }
    if (step === 3) {
      if (!preference) {
        setErrors({ preference: 'Escolha um dia e um horário.' })
        return
      }
      setErrors({})
      setStep(4)
    }
  }

  function back() {
    setErrors({})
    if (step === 1) {
      if (section > 0) setSection(section - 1)
      return
    }
    if (step === 2) {
      setStep(1)
      setSection(sections.length - 1)
      return
    }
    setStep((step - 1) as Step)
  }

  function edit(target: 1 | 2 | 3) {
    setErrors({})
    setStep(target)
    if (target === 1) setSection(0)
  }

  /* ---------- corpo de cada etapa ---------- */

  let body: React.ReactNode = <p className="p-6 text-ink-muted">Carregando…</p>
  if (loaded && answers && form && current) {
    if (step === 1) {
      body = (
        <div className="flex flex-col gap-5">
          {!isWide && <h2 className="font-display text-[1.5rem] text-ink">{current.title}</h2>}
          {current.questions.map((question) => (
            <AnswerField
              key={question.id}
              question={question}
              value={answers[question.id]}
              error={errors[question.id]}
              onChange={(value) => answer(question.id, value)}
            />
          ))}
          {isLastSection && (
            <label className="flex cursor-pointer gap-3 rounded-2xl bg-accent/9 px-4 py-3.5 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked)
                  setErrors((e) => without(e, 'consent'))
                }}
                className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
              />
              <span>
                {form.consent}
                {errors.consent && <span className="mt-1 block text-accent">{errors.consent}</span>}
              </span>
            </label>
          )}
        </div>
      )
    } else if (step === 2) {
      body = (
        <>
          <TherapyStep
            therapies={loaded.therapies}
            selectedId={therapyId}
            onSelect={(id) => {
              setTherapyId(id)
              setPreference(null)
              setErrors({})
            }}
            extra={extra}
            errors={errors}
            onExtra={(id, value) => {
              setExtra((e) => ({ ...e, [id]: value }))
              setErrors((e) => without(e, id))
            }}
            isWide={isWide}
          />
          {errors.therapy && <p className="mt-3 text-sm text-accent">{errors.therapy}</p>}
        </>
      )
    } else if (step === 3 && therapy) {
      body = (
        <>
          <DateStep
            therapy={therapy}
            availability={loaded.availability}
            today={today}
            value={preference}
            onChange={(value) => {
              setPreference(value)
              setErrors({})
            }}
            isWide={isWide}
          />
          {errors.preference && <p className="mt-3 text-sm text-accent">{errors.preference}</p>}
        </>
      )
    } else if (step === 4 && therapy && preference) {
      body = (
        <SummaryStep
          therapy={therapy}
          preference={preference}
          answered={answeredCount(form, answers)}
          onEdit={edit}
          isWide={isWide}
        />
      )
    }
  }

  /* ---------- rodapé ---------- */

  const nextLabel =
    step === 1
      ? isLastSection
        ? 'Enviar e escolher a terapia'
        : 'Continuar'
      : step === 2
        ? 'Escolher a data'
        : 'Revisar e pagar'
  const canGoBack = step > 1 || section > 0
  const combine =
    therapy && preference
      ? whatsAppMessage(
          `Olá, Andreía! Quero agendar ${therapy.name}. Data que prefiro: ${longDate(preference.date).toLowerCase()}, às ${timeLabel(preference.start)}.`,
        )
      : null

  const footer =
    step === 4 && therapy ? (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {isWide ? (
            <button type="button" onClick={back} className={ghost}>
              <UiIcon name="back" size={16} />
              Voltar
            </button>
          ) : (
            <span className="flex flex-col">
              <span className="text-[13px] text-ink-faint">Total</span>
              <b className="font-display text-xl font-medium text-ink">
                {formatPrice(therapy.priceCents)}
              </b>
            </span>
          )}
          <button type="button" disabled className={`${primary} ${isWide ? '' : 'flex-1'}`}>
            Pagamento em breve
          </button>
        </div>
        <p className="text-[13px] text-ink-faint">
          O pagamento pelo site abre em breve.{' '}
          {combine && (
            <a
              href={combine}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              <SocialIcon id="whatsapp" size={14} />
              Por enquanto, combine com a Andreía
            </a>
          )}
        </p>
      </div>
    ) : (
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          aria-label="Voltar"
          className={`${ghost} ${canGoBack ? '' : 'invisible'} ${isWide ? '' : 'px-4'}`}
        >
          <UiIcon name="back" size={16} />
          {isWide && 'Voltar'}
        </button>
        <button
          type="button"
          onClick={() => void next()}
          disabled={!loaded || !answers || isSaving}
          className={`${primary} ${isWide ? '' : 'flex-1'}`}
        >
          {isSaving ? 'Guardando…' : nextLabel}
          {isWide && <UiIcon name="next" size={16} />}
        </button>
      </div>
    )

  /* ---------- a janela ---------- */

  const sectionInfo =
    step === 1 && current
      ? {
          fraction: (section + 1) / sections.length,
          detail: `${section + 1} de ${sections.length}`,
        }
      : null

  return createPortal(
    <div className="fixed inset-0 z-40 grid animate-[fade-in_250ms_ease-out] place-items-center bg-[color-mix(in_oklab,var(--bg)_35%,rgb(20_14_10/0.4))] backdrop-blur-[5px] sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex flex-col overflow-hidden border-line bg-surface shadow-[0_30px_80px_rgb(20_14_10/0.35)] ${
          isWide
            ? 'h-[min(760px,92dvh)] w-full max-w-[820px] animate-[dialog-in_320ms_ease-out] rounded-3xl border'
            : 'fixed inset-0 animate-[sheet-up_360ms_cubic-bezier(.2,.8,.2,1)]'
        }`}
      >
        <div className="flex flex-col gap-4 border-b border-line px-6 pt-4.5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <h2
              id={titleId}
              className="text-xs font-semibold tracking-[0.24em] text-accent uppercase"
            >
              Ativação individual
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Fechar e ir para o meu perfil"
              title="Fechar e ir para o meu perfil"
              className="grid size-9 place-items-center rounded-full bg-field text-ink-muted hover:text-ink"
            >
              <UiIcon name="close" size={17} />
            </button>
          </div>
          {isWide ? (
            <>
              <StepDots current={step} />
              {sectionInfo && current && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[13px] text-ink-faint">
                    <span>
                      <b className="font-semibold text-ink">{current.title}</b> · etapa{' '}
                      {sectionInfo.detail}
                    </span>
                  </div>
                  <div aria-hidden="true" className="flex gap-1">
                    {sections.map((s, i) => (
                      <span
                        key={s.id}
                        className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= section ? 'bg-accent' : 'bg-line'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <StepBar current={step} {...(sectionInfo ?? {})} />
          )}
        </div>
        <div
          ref={bodyRef}
          key={`${step}-${section}`}
          className="flex-1 animate-[page-in_350ms_ease-out] overflow-y-auto px-6 py-5"
        >
          {notice && (
            <p
              role="status"
              className="mb-4 rounded-xl bg-field px-3.5 py-2.5 text-sm text-ink-muted"
            >
              {notice}
            </p>
          )}
          {body}
        </div>
        <div className="border-t border-line px-6 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  )
}
