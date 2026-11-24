import { useEffect, useMemo, useState } from 'react'
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
import { EmailConfirmDialog } from '../../../shared/auth/EmailConfirmDialog'
import { needsEmailConfirmation } from '../../../shared/auth/emailConfirmation'
import { missingProfileFields } from '../../../shared/profile/profile'
import { ProfileGateDialog } from '../../../shared/profile/ProfileGateDialog'
import { useMyProfile } from '../../../shared/profile/useMyProfile'
import { whatsAppMessage } from '../../../shared/brand/links'
import { paymentsUrl, requestCheckout } from '../../../shared/catalog/checkout'
import { formatPrice } from '../../../shared/catalog/offer'
import { readFirebaseConfig } from '../../../shared/firebase/config'
import { useMediaQuery } from '../../../shared/lib/useMediaQuery'
import { useNow } from '../../../shared/lib/useNow'
import { UiIcon } from '../../../shared/ui/UiIcon'
import { REQUIRED_MARK } from '../../../shared/ui/requiredMark'
import { SocialIcon } from '../components/SocialIcon'
import { WIDE_LAYOUT_QUERY, type OrderReturn } from '../navigation'
import { AnswerField } from './AnswerField'
import {
  createInMemoryAtivacaoSource,
  createRestAtivacaoSource,
  type AtivacaoSource,
} from './ativacaoSource'
import { ConfirmStep } from './ConfirmStep'
import { DateStep, type Preference } from './DateStep'
import { FlowShell } from './FlowShell'
import { StepBar, StepList } from './FlowSteps'
import { PaidStep } from './PaidStep'
import { SummaryStep } from './SummaryStep'
import { TherapyStep } from './TherapyStep'
import { LoadingNote } from '../../../shared/ui/LoadingNote'

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
export function AtivacaoFlow({
  source: injected,
  orderReturn = null,
  confirmOrderId = null,
  workerUrl = paymentsUrl(import.meta.env),
  redirect = (url) => window.location.assign(url),
}: {
  source?: AtivacaoSource
  /** A volta do Mercado Pago (`#/ativacao/pedido/{código}/{resultado}`). */
  orderReturn?: OrderReturn | null
  /** O link de confirmação do horário (`#/ativacao/confirmar/{código}`). */
  confirmOrderId?: string | null
  /** Endereço do Worker de pagamentos; sem ele, "Pagamento em breve". */
  workerUrl?: string | null
  redirect?: (url: string) => void
}) {
  const { session, state } = useAuthSession()
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY)
  const now = useNow()
  const today = localDate(now)
  const user = state?.user ?? null

  const source = useMemo<AtivacaoSource>(() => {
    if (injected) return injected
    const config = readFirebaseConfig(import.meta.env)
    if (!config || !session) return createInMemoryAtivacaoSource()
    return createRestAtivacaoSource(config, () => session.getIdToken())
  }, [injected, session])

  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [answers, setAnswers] = useState<Answers | null>(null)
  // Já vem marcada (pedido de 2026-11-24); a pessoa pode desmarcar, mas sem ela não segue.
  const [consent, setConsent] = useState(true)
  const [step, setStep] = useState<Step>(1)
  const [section, setSection] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [therapyId, setTherapyId] = useState<string | null>(null)
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [preference, setPreference] = useState<Preference | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  /** De volta à etapa "Entrar" já logada: conferir a conta ou trocar (pedido de 2026-11-24). */
  const [isAtLogin, setIsAtLogin] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

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
  // Os dados da aba Conta entram em "Seus dados" (pedido de 2026-11-24: um cadastro só).
  const my = useMyProfile()
  const known = my.profile
  const fullName = known?.fullName ?? ''
  const phone = known?.phone ?? ''
  const nickname = known?.nickname ?? ''
  const birthDate = known?.birthDate ?? ''
  useEffect(() => {
    if (!uid) return
    let cancelled = false
    void source
      .loadMyAnamnesis(uid)
      .catch(() => null)
      .then((saved) => {
        if (cancelled) return
        setAnswers(
          initialAnswers(saved, displayName, {
            nome: fullName,
            telefone: phone,
            apelido: nickname,
            nascimento: birthDate,
          }),
        )
        setConsent(saved?.consent ?? true)
      })
    return () => {
      cancelled = true
    }
  }, [uid, displayName, source, fullName, phone, nickname, birthDate])

  // Trocou de conta: volta para a primeira pergunta com as respostas da conta nova (ajuste durante a
  // renderização, como a documentação do React recomenda para estado que depende de outro valor).
  const [flowUid, setFlowUid] = useState(uid)
  if (uid !== flowUid) {
    setFlowUid(uid)
    setIsAtLogin(false)
    setStep(1)
    setSection(0)
  }

  const close = () => goTo(user ? '#/perfil/ativacoes' : '#/')

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

  // Conta criada com e-mail e ainda sem confirmar: a ativação (uma compra) espera a confirmação.
  if (needsEmailConfirmation(user)) {
    return <EmailConfirmDialog onClose={() => goTo('#/')} />
  }
  // E o cadastro completo (aba Conta), como antes de começar uma jornada ou comprar.
  if (!my.profile) return null
  const missing = missingProfileFields(my.profile, today)
  if (missing.length > 0) {
    return (
      <ProfileGateDialog
        missing={missing}
        returnTo={{ href: '#/ativacao', title: 'a ativação individual' }}
        onClose={() => goTo('#/')}
      />
    )
  }

  async function checkout(orderId: string) {
    if (!workerUrl || !session) return
    const result = await requestCheckout({
      workerUrl,
      orderId,
      idToken: await session.getIdToken(),
    })
    if (result.kind === 'redirect') redirect(result.url)
    else setNotice('Não deu para abrir o pagamento agora. Tente de novo em instantes.')
  }

  if (isAtLogin) {
    const switchAccount = async () => {
      setIsSwitching(true)
      try {
        await session.signOut()
      } finally {
        setIsSwitching(false)
      }
    }
    return (
      <FlowShell
        isWide={isWide}
        current={0}
        bodyKey="entrar"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void switchAccount()}
              disabled={isSwitching}
              className={ghost}
            >
              {isSwitching ? 'Saindo…' : 'Entrar com outra conta'}
            </button>
            <button
              type="button"
              onClick={() => setIsAtLogin(false)}
              className={`${primary} ${isWide ? '' : 'flex-1'}`}
            >
              Continuar com esta conta
              {isWide && <UiIcon name="next" size={16} />}
            </button>
          </div>
        }
        onClose={close}
      >
        <div className="flex flex-col gap-2">
          <h3 className="font-display text-[1.9rem] text-ink">Você está na sua conta</h3>
          <p className="text-ink-muted">
            {user.displayName ? (
              <>
                <b className="font-semibold text-ink">{user.displayName}</b> ·{' '}
              </>
            ) : null}
            {user.email}
          </p>
          <p className="text-sm text-ink-faint">
            Quer usar outra conta? Saia desta e entre com a outra; suas respostas ficam guardadas em
            cada conta.
          </p>
        </div>
      </FlowShell>
    )
  }

  if (confirmOrderId) {
    return (
      <ConfirmStep
        uid={user.uid}
        orderId={confirmOrderId}
        source={source}
        isWide={isWide}
        now={now}
        onClose={close}
      />
    )
  }

  if (orderReturn) {
    return (
      <PaidStep
        uid={user.uid}
        orderReturn={orderReturn}
        source={source}
        isWide={isWide}
        onClose={close}
        onRetry={(id) => void checkout(id)}
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
      else setIsAtLogin(true)
      return
    }
    if (step === 2) {
      setStep(1)
      setSection(sections.length - 1)
      return
    }
    setStep((step - 1) as Step)
  }

  /** Cria o pedido ("Aguardando pagamento") e segue para o Mercado Pago. */
  async function pay() {
    if (!uid || !therapy || !preference || !answers) return
    setIsPaying(true)
    setNotice(null)
    try {
      const orderId = await source.createOrder(uid, {
        therapyId: therapy.id,
        therapyName: therapy.name,
        durationMin: therapy.durationMin,
        priceCents: therapy.priceCents,
        preference,
        extra,
        name: String(answers.nome ?? displayName ?? ''),
        phone: String(answers.telefone ?? ''),
      })
      await checkout(orderId)
    } catch {
      setNotice('Não deu para criar o pedido agora. Confira a internet e tente de novo.')
    } finally {
      setIsPaying(false)
    }
  }

  function edit(target: 1 | 2 | 3) {
    setErrors({})
    setStep(target)
    if (target === 1) setSection(0)
  }

  /* ---------- corpo de cada etapa ---------- */

  let body: React.ReactNode = <LoadingNote className="p-6 text-ink-muted" />
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
                aria-required="true"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked)
                  setErrors((e) => without(e, 'consent'))
                }}
                className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
              />
              <span>
                <span className={REQUIRED_MARK}>{form.consent}</span>
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
  const canGoBack = true
  const combine =
    therapy && preference
      ? whatsAppMessage(
          `Quero agendar ${therapy.name}. Data que prefiro: ${longDate(preference.date).toLowerCase()}, às ${timeLabel(preference.start)}.`,
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
          {workerUrl ? (
            <button
              type="button"
              onClick={() => void pay()}
              disabled={isPaying}
              className={`${primary} ${isWide ? '' : 'flex-1'}`}
            >
              <UiIcon name="lock" size={16} />
              {isPaying ? 'Abrindo o pagamento…' : `Pagar ${formatPrice(therapy.priceCents)}`}
            </button>
          ) : (
            <button type="button" disabled className={`${primary} ${isWide ? '' : 'flex-1'}`}>
              Pagamento em breve
            </button>
          )}
        </div>
        {!workerUrl && (
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
        )}
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

  return (
    <FlowShell
      isWide={isWide}
      current={step}
      section={
        step === 1 && current
          ? { title: current.title, index: section, ids: sections.map((s) => s.id) }
          : null
      }
      bodyKey={`${step}-${section}`}
      notice={notice}
      footer={footer}
      onClose={close}
    >
      {body}
    </FlowShell>
  )
}
