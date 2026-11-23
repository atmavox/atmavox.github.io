// Formulário de terapia do Modo Andreía (ADR-029): o que está na tela, a validação e a conversão para
// a terapia gravada em `catalog/therapies`.
import {
  MAX_THERAPY_MINUTES,
  MIN_THERAPY_MINUTES,
  type ExtraQuestion,
  type Therapy,
} from '../../../shared/ativacao/therapy'
import { formatPriceInput, parsePriceCents, slugify } from './productForm'

export interface TherapyForm extends Omit<Therapy, 'priceCents'> {
  /** O preço como a Andreía digita ("120" ou "120,00"); vazio = sem preço. */
  price: string
}

export type TherapyErrors = Partial<
  Record<'name' | 'description' | 'price' | 'duration', string>
> & {
  questions?: Record<string, string>
}

export function emptyTherapyForm(): TherapyForm {
  return {
    id: '',
    name: '',
    description: '',
    icon: 'spark',
    tone: 'dusk',
    modality: 'remote',
    durationMin: 60,
    price: '',
    active: false,
    questions: [],
  }
}

export function formFromTherapy(therapy: Therapy): TherapyForm {
  const { priceCents, ...rest } = therapy
  return {
    ...rest,
    questions: therapy.questions.map((q) => ({ ...q, options: [...q.options] })),
    price: priceCents ? formatPriceInput(priceCents) : '',
  }
}

/** Id novo a partir do nome, sem repetir os que já existem ("reiki", "reiki-2"…). */
export function therapyIdFrom(name: string, taken: readonly string[]): string {
  const base = slugify(name) || 'terapia'
  let id = base
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`
  return id
}

export function validateTherapyForm(form: TherapyForm): TherapyErrors {
  const errors: TherapyErrors = {}
  if (!form.name.trim()) errors.name = 'Dê um nome à terapia.'
  if (!form.description.trim()) errors.description = 'Conte em uma ou duas frases como é.'
  const price = form.price.trim() ? parsePriceCents(form.price) : null
  if (form.price.trim() && price === null) errors.price = 'Use só números, como 120 ou 120,00.'
  else if (form.active && price === null) errors.price = 'Para ativar, a terapia precisa de preço.'
  if (
    !Number.isInteger(form.durationMin) ||
    form.durationMin < MIN_THERAPY_MINUTES ||
    form.durationMin > MAX_THERAPY_MINUTES
  ) {
    errors.duration = `Entre ${MIN_THERAPY_MINUTES} e ${MAX_THERAPY_MINUTES} minutos.`
  }
  const questions: Record<string, string> = {}
  for (const question of form.questions) {
    if (!question.label.trim()) questions[question.id] = 'Escreva a pergunta.'
    else if (question.type === 'single' && question.options.filter((o) => o.trim()).length < 2) {
      questions[question.id] = 'Dê pelo menos duas opções.'
    }
  }
  if (Object.keys(questions).length) errors.questions = questions
  return errors
}

export const hasErrors = (errors: TherapyErrors) => Object.keys(errors).length > 0

/** Só chame depois de `validateTherapyForm` sem erros. */
export function therapyFromForm(form: TherapyForm, taken: readonly string[]): Therapy {
  const { price, ...rest } = form
  const priceCents = price.trim() ? (parsePriceCents(price) ?? 0) : 0
  const questions: ExtraQuestion[] = form.questions.map((question) => ({
    ...question,
    label: question.label.trim(),
    options:
      question.type === 'single' ? question.options.map((o) => o.trim()).filter(Boolean) : [],
  }))
  return {
    ...rest,
    id: form.id || therapyIdFrom(form.name, taken),
    name: form.name.trim(),
    description: form.description.trim(),
    priceCents,
    active: form.active && priceCents > 0,
    questions,
  }
}

/** Troca (pelo id) ou acrescenta no fim. */
export function upsertTherapy(list: readonly Therapy[], therapy: Therapy): Therapy[] {
  return list.some((t) => t.id === therapy.id)
    ? list.map((t) => (t.id === therapy.id ? therapy : t))
    : [...list, therapy]
}

export function moveTherapy(list: readonly Therapy[], from: number, to: number): Therapy[] {
  const next = [...list]
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) return next
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

/** Ativar sem preço não vale: devolve `null` para a tela abrir o formulário no preço. */
export function toggleTherapy(list: readonly Therapy[], id: string): Therapy[] | null {
  const therapy = list.find((t) => t.id === id)
  if (!therapy) return null
  if (!therapy.active && therapy.priceCents <= 0) return null
  return list.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
}
