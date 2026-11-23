// Respostas da anamnese de uma pessoa (ADR-029): guardadas por id de pergunta em
// `users/{uid}/anamnesis/current`. Funções puras: leitura, preenchimento inicial e validação.
import type { AnamnesisForm, AnamnesisQuestion, AnamnesisSection } from './anamnesis'

/** Texto (curto, longo, data "AAAA-MM-DD", telefone, uma opção, "sim"/"nao"), escala (número) ou várias opções. */
export type Answer = string | number | string[]
export type Answers = Record<string, Answer>

export interface SavedAnamnesis {
  answers: Answers
  consent: boolean
  updatedAt: number
}

export function parseSavedAnamnesis(raw: unknown): SavedAnamnesis | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.answers !== 'object' || r.answers === null) return null
  const answers: Answers = {}
  for (const [id, value] of Object.entries(r.answers as Record<string, unknown>)) {
    if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) {
      answers[id] = value
    } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      answers[id] = value as string[]
    }
  }
  return {
    answers,
    consent: r.consent === true,
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : 0,
  }
}

/** O que já se sabe da pessoa entra preenchido (o nome da conta), sem apagar o que ela respondeu. */
export function initialAnswers(saved: SavedAnamnesis | null, displayName: string | null): Answers {
  const answers = { ...(saved?.answers ?? {}) }
  if (!answers.nome && displayName?.trim()) answers.nome = displayName.trim()
  return answers
}

const digits = (value: string) => value.replace(/\D/g, '')

/** Telefone do Brasil com DDD: 10 ou 11 dígitos (com ou sem +55). */
export function isPhone(value: string): boolean {
  const d = digits(value).replace(/^55(?=\d{10,11}$)/, '')
  return d.length === 10 || d.length === 11
}

/** Para o link do WhatsApp: "(41) 9 9876-5432" → "5541998765432" (`null` se não for telefone). */
export function whatsAppDigits(value: string): string | null {
  if (!isPhone(value)) return null
  return `55${digits(value).replace(/^55(?=\d{10,11}$)/, '')}`
}

/** "41998765432" → "(41) 9 9876-5432"; o que não der para formatar fica como está. */
export function formatPhone(value: string): string {
  const d = digits(value).replace(/^55(?=\d{10,11}$)/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d[2]} ${d.slice(3, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return value
}

export function isAnswered(answer: Answer | undefined): boolean {
  if (answer === undefined) return false
  if (Array.isArray(answer)) return answer.length > 0
  if (typeof answer === 'number') return true
  return answer.trim() !== ''
}

/** Erro de uma pergunta, ou `null`. */
export function answerError(
  question: AnamnesisQuestion,
  answer: Answer | undefined,
): string | null {
  if (!isAnswered(answer)) {
    return question.required ? 'Responda esta pergunta para seguir.' : null
  }
  if (question.type === 'phone' && typeof answer === 'string' && !isPhone(answer)) {
    return 'Escreva o telefone com DDD, como (41) 9 9876-5432.'
  }
  if (
    question.type === 'date' &&
    typeof answer === 'string' &&
    !/^\d{4}-\d{2}-\d{2}$/.test(answer)
  ) {
    return 'Escolha a data.'
  }
  return null
}

/** Os erros de uma seção (uma etapa da anamnese). */
export function sectionErrors(section: AnamnesisSection, answers: Answers): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const question of section.questions) {
    const error = answerError(question, answers[question.id])
    if (error) errors[question.id] = error
  }
  return errors
}

/** Quantas perguntas do formulário estão respondidas (para o resumo). */
export function answeredCount(form: AnamnesisForm, answers: Answers): number {
  return form.sections.flatMap((s) => s.questions).filter((q) => isAnswered(answers[q.id])).length
}

/** Só as respostas das perguntas que existem no formulário (o resto não vai para a conta). */
export function answersFor(form: AnamnesisForm, answers: Answers): Answers {
  const ids = new Set(form.sections.flatMap((s) => s.questions.map((q) => q.id)))
  return Object.fromEntries(Object.entries(answers).filter(([id]) => ids.has(id)))
}
