// A anamnese da ativação individual (ADR-029): montada no Modo Andreía e guardada em
// `catalog/anamnesis`. As respostas das pessoas são salvas pelo id de cada pergunta, então um id
// nunca muda nem some: pergunta já salva que sai do formulário vai para `archived`.

export const QUESTION_TYPES = [
  'short',
  'long',
  'single',
  'multi',
  'scale',
  'yesno',
  'date',
  'phone',
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short: 'Texto curto',
  long: 'Texto longo',
  single: 'Uma opção',
  multi: 'Várias opções',
  scale: 'Escala 0 a 10',
  yesno: 'Sim/não',
  date: 'Data',
  phone: 'Telefone',
}

/** Os tipos que a Andreía escolhe (telefone é só o da pergunta fixa). */
export const EDITABLE_QUESTION_TYPES: readonly QuestionType[] = QUESTION_TYPES.filter(
  (type) => type !== 'phone',
)

export interface AnamnesisQuestion {
  id: string
  label: string
  /** Texto pequeno embaixo da pergunta (opcional). */
  hint: string
  type: QuestionType
  /** Só para "uma opção" e "várias opções". */
  options: string[]
  required: boolean
}

export interface AnamnesisSection {
  id: string
  title: string
  questions: AnamnesisQuestion[]
}

export interface AnamnesisForm {
  sections: AnamnesisSection[]
  /** A frase da caixa de consentimento, sempre no fim. */
  consent: string
  /** Perguntas que já tinham sido salvas e saíram do formulário (as respostas antigas usam). */
  archived: AnamnesisQuestion[]
}

/** Nome e telefone: o pedido precisa deles (é por ele que a Andreía fala com a pessoa). */
export const FIXED_QUESTIONS: readonly AnamnesisQuestion[] = [
  { id: 'nome', label: 'Nome completo', hint: '', type: 'short', options: [], required: true },
  {
    id: 'telefone',
    label: 'Telefone (WhatsApp)',
    hint: 'É por ele que a Andreía fala com você.',
    type: 'phone',
    options: [],
    required: true,
  },
]

export const isFixedQuestion = (id: string) => FIXED_QUESTIONS.some((q) => q.id === id)
export const needsOptions = (type: QuestionType) => type === 'single' || type === 'multi'

const q = (
  id: string,
  label: string,
  type: QuestionType,
  extra: Partial<Pick<AnamnesisQuestion, 'hint' | 'options' | 'required'>> = {},
): AnamnesisQuestion => ({
  id,
  label,
  type,
  hint: extra.hint ?? '',
  options: extra.options ?? [],
  required: extra.required ?? true,
})

/** O modelo aprovado no mock (2026-11-23, "Completo por áreas" com perguntas holísticas). */
export const DEFAULT_ANAMNESIS: AnamnesisForm = {
  sections: [
    {
      id: 'seus-dados',
      title: 'Seus dados',
      questions: [
        ...FIXED_QUESTIONS,
        q('apelido', 'Como prefere ser chamado (a)?', 'short', { required: false }),
        q('nascimento', 'Data de nascimento', 'date', {
          hint: 'Usada na radiestesia e em leituras energéticas.',
        }),
        q('cidade', 'Cidade onde você mora', 'short'),
        q('origem', 'Como você conheceu a Atmavox?', 'single', {
          options: ['Instagram', 'TikTok', 'Indicação', 'Encontros ao vivo', 'Outro'],
        }),
      ],
    },
    {
      id: 'o-seu-momento',
      title: 'O seu momento',
      questions: [
        q('motivo', 'O que trouxe você até aqui agora?', 'long'),
        q('areas', 'Em quais áreas da vida você sente que algo pede movimento?', 'multi', {
          options: [
            'Trabalho',
            'Relacionamentos',
            'Família',
            'Finanças',
            'Autoestima',
            'Propósito',
            'Espiritualidade',
            'Rotina',
          ],
        }),
        q('palavra', 'Em uma palavra, como você chega hoje?', 'short'),
      ],
    },
    {
      id: 'energia-e-emocoes',
      title: 'Energia e emoções',
      questions: [
        q('energia', 'Como você sente a sua energia nos últimos dias?', 'scale'),
        q('sentimentos', 'Quais sentimentos têm estado mais presentes?', 'multi', {
          options: [
            'Ansiedade',
            'Cansaço',
            'Tristeza',
            'Irritação',
            'Medo',
            'Desânimo',
            'Calma',
            'Gratidão',
            'Esperança',
          ],
        }),
        q('sono', 'Como tem sido o seu sono?', 'single', {
          options: ['Tranquilo', 'Agitado', 'Interrompido', 'Varia muito'],
        }),
      ],
    },
    {
      id: 'caminho-e-praticas',
      title: 'Caminho e práticas',
      questions: [
        q('terapias', 'Já viveu alguma destas terapias?', 'multi', {
          options: [
            'Reiki',
            'Barras de Access',
            'Radiestesia',
            'PNL',
            'Constelação',
            'Meditação guiada',
            'Nenhuma ainda',
          ],
        }),
        q('autocuidado', 'Tem alguma prática de autocuidado ou espiritual?', 'long', {
          required: false,
          hint: 'Meditação, oração, yoga, escrita… o que fizer sentido para você.',
        }),
        q('intencao', 'O que você gostaria de perceber ou sentir depois deste encontro?', 'long'),
      ],
    },
    {
      id: 'para-a-andreia-saber',
      title: 'Para a Andreía saber',
      questions: [
        q('acompanhamento', 'Faz algum acompanhamento médico ou psicológico no momento?', 'yesno', {
          hint: 'As terapias holísticas complementam esses cuidados, sem substituir.',
        }),
        q('mais', 'Tem algo mais que você queira contar?', 'long', { required: false }),
      ],
    },
  ],
  consent:
    'Concordo que a Andreía leia estas respostas para preparar o nosso encontro. Elas ficam só na minha conta e posso atualizar quando quiser.',
  archived: [],
}

/* ---------- leitura ---------- */

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

function parseQuestion(raw: unknown): AnamnesisQuestion | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const type = QUESTION_TYPES.find((t) => t === r.type)
  const id = text(r.id)
  const label = text(r.label)
  if (!type || !id || !label) return null
  const options = Array.isArray(r.options) ? r.options.map(text).filter(Boolean) : []
  return {
    id,
    label,
    hint: text(r.hint),
    type,
    options: needsOptions(type) ? options : [],
    required: r.required !== false,
  }
}

/** O `content` de `catalog/anamnesis`; garante nome e telefone no começo e ids únicos. */
export function parseAnamnesis(raw: unknown): AnamnesisForm | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.sections)) return null
  const seen = new Set<string>()
  const keep = (question: AnamnesisQuestion | null): question is AnamnesisQuestion => {
    if (!question || seen.has(question.id)) return false
    seen.add(question.id)
    return true
  }
  const sections: AnamnesisSection[] = r.sections
    .map((section): AnamnesisSection | null => {
      if (typeof section !== 'object' || section === null) return null
      const s = section as Record<string, unknown>
      const id = text(s.id)
      if (!id) return null
      const questions = Array.isArray(s.questions) ? s.questions.map(parseQuestion) : []
      return { id, title: text(s.title), questions: questions.filter(keep) }
    })
    .filter((s): s is AnamnesisSection => s !== null)
  const archived = (Array.isArray(r.archived) ? r.archived.map(parseQuestion) : []).filter(keep)
  return withFixedQuestions({
    sections,
    consent: text(r.consent) || DEFAULT_ANAMNESIS.consent,
    archived,
  })
}

/** Nome e telefone sempre no começo da primeira seção, com o tipo e a obrigatoriedade do código. */
export function withFixedQuestions(form: AnamnesisForm): AnamnesisForm {
  const found = new Map<string, AnamnesisQuestion>()
  const strip = (list: AnamnesisQuestion[]) =>
    list.filter((question) => {
      if (!isFixedQuestion(question.id)) return true
      found.set(question.id, question)
      return false
    })
  const sections = form.sections.map((s) => ({ ...s, questions: strip(s.questions) }))
  const archived = strip(form.archived)
  const fixed = FIXED_QUESTIONS.map((base) => {
    const saved = found.get(base.id)
    return saved ? { ...base, label: saved.label, hint: saved.hint } : base
  })
  const [first, ...rest] = sections.length
    ? sections
    : [{ id: 'seus-dados', title: 'Seus dados', questions: [] }]
  return {
    ...form,
    sections: [{ ...first!, questions: [...fixed, ...first!.questions] }, ...rest],
    archived,
  }
}

/* ---------- edição (funções puras) ---------- */

const mapQuestions = (
  form: AnamnesisForm,
  fn: (question: AnamnesisQuestion) => AnamnesisQuestion,
): AnamnesisForm => ({
  ...form,
  sections: form.sections.map((s) => ({ ...s, questions: s.questions.map(fn) })),
})

/** Nome e telefone: só o texto e a explicação mudam. */
export function updateQuestion(
  form: AnamnesisForm,
  id: string,
  change: Partial<Omit<AnamnesisQuestion, 'id'>>,
): AnamnesisForm {
  const allowed = isFixedQuestion(id)
    ? {
        ...(change.label !== undefined ? { label: change.label } : {}),
        ...(change.hint !== undefined ? { hint: change.hint } : {}),
      }
    : change
  return mapQuestions(form, (question) => {
    if (question.id !== id) return question
    const next = { ...question, ...allowed }
    // Trocar para um tipo sem opções descarta as opções; voltar para um com opções começa com duas.
    if (!needsOptions(next.type)) next.options = []
    else if (!next.options.length) next.options = ['', '']
    return next
  })
}

export function addQuestion(form: AnamnesisForm, sectionId: string, id: string): AnamnesisForm {
  return {
    ...form,
    sections: form.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            questions: [
              ...s.questions,
              { id, label: '', hint: '', type: 'short', options: [], required: true },
            ],
          }
        : s,
    ),
  }
}

/**
 * Tira a pergunta do formulário. Se ela já foi salva (está em `savedIds`), vai para `archived`
 * (as respostas antigas continuam com o texto dela); se é nova, some. Nome e telefone não saem.
 */
export function removeQuestion(
  form: AnamnesisForm,
  id: string,
  savedIds: ReadonlySet<string>,
): AnamnesisForm {
  if (isFixedQuestion(id)) return form
  const question = form.sections.flatMap((s) => s.questions).find((item) => item.id === id)
  if (!question) return form
  return {
    ...form,
    sections: form.sections.map((s) => ({
      ...s,
      questions: s.questions.filter((item) => item.id !== id),
    })),
    archived: savedIds.has(id) ? [...form.archived, question] : form.archived,
  }
}

/** Volta uma pergunta guardada para o fim da última seção. */
export function restoreQuestion(form: AnamnesisForm, id: string): AnamnesisForm {
  const question = form.archived.find((item) => item.id === id)
  const last = form.sections[form.sections.length - 1]
  if (!question || !last) return form
  return {
    ...form,
    sections: form.sections.map((s) =>
      s.id === last.id ? { ...s, questions: [...s.questions, question] } : s,
    ),
    archived: form.archived.filter((item) => item.id !== id),
  }
}

function move<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list]
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) return next
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

/** Muda a ordem dentro da seção. Nome e telefone ficam sempre no começo da primeira. */
export function moveQuestion(
  form: AnamnesisForm,
  sectionId: string,
  from: number,
  to: number,
): AnamnesisForm {
  return {
    ...form,
    sections: form.sections.map((s, index) => {
      if (s.id !== sectionId) return s
      const floor = index === 0 ? FIXED_QUESTIONS.length : 0
      if (from < floor || to < floor) return s
      return { ...s, questions: move(s.questions, from, to) }
    }),
  }
}

export function addSection(form: AnamnesisForm, id: string): AnamnesisForm {
  return { ...form, sections: [...form.sections, { id, title: '', questions: [] }] }
}

export function renameSection(form: AnamnesisForm, id: string, title: string): AnamnesisForm {
  return { ...form, sections: form.sections.map((s) => (s.id === id ? { ...s, title } : s)) }
}

/** A seção com nome e telefone não sai. As perguntas já salvas das outras vão para `archived`. */
export function canRemoveSection(form: AnamnesisForm, id: string): boolean {
  const section = form.sections.find((s) => s.id === id)
  return !!section && !section.questions.some((question) => isFixedQuestion(question.id))
}

export function removeSection(
  form: AnamnesisForm,
  id: string,
  savedIds: ReadonlySet<string>,
): AnamnesisForm {
  if (!canRemoveSection(form, id)) return form
  const section = form.sections.find((s) => s.id === id)!
  return {
    ...form,
    sections: form.sections.filter((s) => s.id !== id),
    archived: [...form.archived, ...section.questions.filter((item) => savedIds.has(item.id))],
  }
}

/** A seção com nome e telefone fica sempre em primeiro. */
export function moveSection(form: AnamnesisForm, from: number, to: number): AnamnesisForm {
  if (from === 0 || to === 0) return form
  return { ...form, sections: move(form.sections, from, to) }
}

/** Todos os ids que um formulário salvo já usou (para saber o que arquivar). */
export function savedIdsOf(form: AnamnesisForm): Set<string> {
  return new Set([
    ...form.sections.flatMap((s) => s.questions.map((question) => question.id)),
    ...form.archived.map((question) => question.id),
  ])
}

/* ---------- validação ---------- */

export type AnamnesisErrors = Record<string, string>

/** Erros por id (pergunta ou seção) e em `consent`. Vazio = pode salvar. */
export function validateAnamnesis(form: AnamnesisForm): AnamnesisErrors {
  const errors: AnamnesisErrors = {}
  for (const section of form.sections) {
    if (!section.title.trim()) errors[section.id] = 'Dê um nome à seção.'
    for (const question of section.questions) {
      if (!question.label.trim()) errors[question.id] = 'Escreva a pergunta.'
      else if (
        needsOptions(question.type) &&
        question.options.filter((option) => option.trim()).length < 2
      ) {
        errors[question.id] = 'Dê pelo menos duas opções.'
      }
    }
  }
  if (!form.consent.trim()) errors.consent = 'Escreva a frase de consentimento.'
  return errors
}

/** Antes de salvar: tira espaços e opções vazias. */
export function cleanAnamnesis(form: AnamnesisForm): AnamnesisForm {
  const cleaned = mapQuestions(form, (question) => ({
    ...question,
    label: question.label.trim(),
    hint: question.hint.trim(),
    options: question.options.map((option) => option.trim()).filter(Boolean),
  }))
  return {
    ...cleaned,
    sections: cleaned.sections.map((s) => ({ ...s, title: s.title.trim() })),
    consent: form.consent.trim(),
  }
}
