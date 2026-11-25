import { useEffect, useMemo, useState } from 'react'
import {
  addQuestion,
  addSection,
  canRemoveSection,
  cleanAnamnesis,
  DEFAULT_ANAMNESIS,
  EDITABLE_QUESTION_TYPES,
  isFixedQuestion,
  moveQuestion,
  moveSection,
  needsOptions,
  QUESTION_TYPE_LABELS,
  removeQuestion,
  removeSection,
  renameSection,
  restoreQuestion,
  savedIdsOf,
  updateQuestion,
  validateAnamnesis,
  type AnamnesisErrors,
  type AnamnesisForm,
  type AnamnesisQuestion,
} from '../../../../shared/ativacao/anamnesis'
import { UiIcon } from '../../../../shared/ui/UiIcon'
import type { AtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import { Field } from '../fields'
import { adminButton, ghostButton, inputClass } from '../styles'
import { SaveStatus } from '../SaveStatus'
import { useSaveNotice } from '../useSaveNotice'
import { Switch } from './TherapyFields'
import { LoadingNote } from '../../../../shared/ui/LoadingNote'

let idCounter = 0
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${++idCounter}`

const iconButton =
  'grid size-8 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-admin/12 hover:text-admin-ink disabled:pointer-events-none disabled:opacity-30'

function QuestionEditor({
  question,
  error,
  onChange,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  question: AnamnesisQuestion
  error: string | undefined
  onChange: (change: Partial<Omit<AnamnesisQuestion, 'id'>>) => void
  onRemove: () => void
  onMove: (delta: number) => void
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  const fixed = isFixedQuestion(question.id)
  return (
    <div className="flex animate-[page-in_300ms_ease-out] flex-col gap-3.5 rounded-2xl border border-admin-ink/50 bg-bg p-4">
      <Field label="Pergunta" error={error}>
        {(props) => (
          <input
            {...props}
            value={question.label}
            placeholder="Escreva a pergunta"
            onChange={(e) => onChange({ label: e.target.value })}
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Explicação embaixo da pergunta (opcional)">
        {(props) => (
          <input
            {...props}
            value={question.hint}
            onChange={(e) => onChange({ hint: e.target.value })}
            className={inputClass}
          />
        )}
      </Field>
      {fixed ? (
        <p className="text-sm text-ink-faint">
          Nome e telefone são fixos e obrigatórios: o pedido precisa deles. Só o texto muda.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-ink-muted">Tipo de resposta</span>
            <div role="radiogroup" aria-label="Tipo de resposta" className="flex flex-wrap gap-1.5">
              {EDITABLE_QUESTION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={question.type === type}
                  onClick={() => onChange({ type })}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    question.type === type
                      ? 'border-admin bg-admin text-on-admin'
                      : 'border-line text-ink-muted hover:text-admin-ink'
                  }`}
                >
                  {QUESTION_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
          {needsOptions(question.type) && (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-ink-muted">Opções</span>
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    aria-label={`Opção ${index + 1}`}
                    value={option}
                    onChange={(e) =>
                      onChange({
                        options: question.options.map((o, i) => (i === index ? e.target.value : o)),
                      })
                    }
                    className={inputClass}
                  />
                  <button
                    type="button"
                    aria-label={`Apagar a opção ${index + 1}`}
                    onClick={() =>
                      onChange({ options: question.options.filter((_, i) => i !== index) })
                    }
                    className={`${iconButton} hover:bg-wine/10 hover:text-wine`}
                  >
                    <UiIcon name="close" size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onChange({ options: [...question.options, ''] })}
                className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-admin-ink hover:underline"
              >
                <UiIcon name="plus" size={15} />
                Opção
              </button>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-3 text-sm text-ink">
              Obrigatória
              <Switch
                label="Obrigatória"
                checked={question.required}
                onChange={(required) => onChange({ required })}
              />
            </span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Subir a pergunta"
                disabled={!canMoveUp}
                onClick={() => onMove(-1)}
                className={iconButton}
              >
                <UiIcon name="up" />
              </button>
              <button
                type="button"
                aria-label="Descer a pergunta"
                disabled={!canMoveDown}
                onClick={() => onMove(1)}
                className={iconButton}
              >
                <UiIcon name="down" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="ml-2 inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-wine"
              >
                <UiIcon name="trash" size={15} />
                Tirar do formulário
              </button>
            </span>
          </div>
        </>
      )}
    </div>
  )
}

/** Anamnese por seções (mock aprovado): seções que abrem; tocar numa pergunta abre a edição dela. */
export function AnamnesisPanel({
  backend,
  isWide,
}: {
  backend: AtivacoesBackend
  isWide: boolean
}) {
  const [saved, setSaved] = useState<AnamnesisForm | null>(null)
  const [isFromModel, setIsFromModel] = useState(false)
  const [form, setForm] = useState<AnamnesisForm | null>(null)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [errors, setErrors] = useState<AnamnesisErrors>({})
  const saveNotice = useSaveNotice()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    backend
      .loadAnamnesis()
      .catch(() => null)
      .then((loaded) => {
        if (cancelled) return
        const start = loaded ?? DEFAULT_ANAMNESIS
        setIsFromModel(loaded === null)
        setSaved(start)
        setForm(start)
        setOpenSection(start.sections[0]?.id ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [backend])

  // Só o que já foi gravado conta como "salvo" (o modelo do código ainda não tem respostas).
  const savedIds = useMemo(
    () => (saved && !isFromModel ? savedIdsOf(saved) : new Set<string>()),
    [saved, isFromModel],
  )

  if (!form || !saved) return <LoadingNote text="Carregando a anamnese…" />

  const isDirty = isFromModel || JSON.stringify(form) !== JSON.stringify(saved)
  const change = (next: AnamnesisForm) => {
    setForm(next)
    saveNotice.hide()
  }

  async function save() {
    if (!form) return
    const found = validateAnamnesis(form)
    setErrors(found)
    if (Object.keys(found).length) {
      saveNotice.show({
        kind: 'error',
        text: 'Faltam alguns campos. Confira as mensagens em vermelho.',
      })
      const sectionWithError = form.sections.find(
        (s) => found[s.id] || s.questions.some((q) => found[q.id]),
      )
      if (sectionWithError) setOpenSection(sectionWithError.id)
      return
    }
    const clean = cleanAnamnesis(form)
    setIsSaving(true)
    try {
      await backend.saveAnamnesis(clean)
      setSaved(clean)
      setForm(clean)
      setIsFromModel(false)
      saveNotice.show({ kind: 'ok', text: 'Salvo' })
    } catch {
      saveNotice.show({
        kind: 'error',
        text: 'Não deu para salvar. Confira a internet e tente de novo.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  function newQuestion(sectionId: string) {
    const id = newId('pergunta')
    change(addQuestion(form!, sectionId, id))
    setEditing(id)
  }

  function newSection() {
    const id = newId('secao')
    change(addSection(form!, id))
    setOpenSection(id)
  }

  return (
    <div
      className={`mx-auto flex w-full max-w-3xl animate-[page-in_400ms_ease-out] flex-col gap-3 ${
        isWide ? 'px-7 py-7' : 'p-4'
      }`}
    >
      <h1 className={`font-display text-ink ${isWide ? 'text-[2rem]' : 'text-[1.6rem]'}`}>
        Anamnese
      </h1>
      <p className="text-sm text-ink-faint">
        O que a pessoa responde antes de escolher a terapia. Pergunta que já tem respostas não se
        apaga: sai do formulário e fica guardada no fim da página.
      </p>

      {form.sections.map((section, sectionIndex) => {
        const isOpen = openSection === section.id
        return (
          <section
            key={section.id}
            className={`rounded-[18px] border bg-surface transition-colors ${
              isOpen ? 'border-admin-ink/50' : 'border-line'
            }`}
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <b className="truncate font-display text-[1.15rem] font-medium text-ink">
                  {section.title || 'Seção sem nome'}
                </b>
                <span className="text-sm text-ink-faint">{section.questions.length}</span>
                {errors[section.id] && <span className="text-sm text-accent">sem nome</span>}
              </button>
              {isWide && isOpen && sectionIndex > 0 && (
                <>
                  <button
                    type="button"
                    aria-label={`Subir a seção ${section.title}`}
                    disabled={sectionIndex <= 1}
                    onClick={() => change(moveSection(form, sectionIndex, sectionIndex - 1))}
                    className={iconButton}
                  >
                    <UiIcon name="up" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Descer a seção ${section.title}`}
                    disabled={sectionIndex === form.sections.length - 1}
                    onClick={() => change(moveSection(form, sectionIndex, sectionIndex + 1))}
                    className={iconButton}
                  >
                    <UiIcon name="down" />
                  </button>
                </>
              )}
              <span aria-hidden="true" className="text-ink-faint">
                <UiIcon name={isOpen ? 'up' : 'down'} />
              </span>
            </div>

            {isOpen && (
              <div className="flex animate-[page-in_300ms_ease-out] flex-col gap-2.5 px-4 pb-4">
                <Field label="Nome da seção" error={errors[section.id]}>
                  {(props) => (
                    <input
                      {...props}
                      value={section.title}
                      onChange={(e) => change(renameSection(form, section.id, e.target.value))}
                      className={inputClass}
                    />
                  )}
                </Field>
                <ol className="flex flex-col gap-2">
                  {section.questions.map((question, index) => {
                    const isEditing = editing === question.id
                    const floor = sectionIndex === 0 ? 2 : 0
                    return (
                      <li key={question.id} className="flex flex-col gap-2">
                        <button
                          type="button"
                          aria-expanded={isEditing}
                          onClick={() => setEditing(isEditing ? null : question.id)}
                          className={`flex items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5 text-left transition-colors ${
                            isEditing
                              ? 'border-admin-ink bg-admin/10'
                              : 'border-admin-ink/45 hover:bg-admin/8'
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span
                              className={`block text-[0.95rem] ${question.label ? 'text-ink' : 'text-ink-faint italic'}`}
                            >
                              {question.label || 'Pergunta nova'}
                            </span>
                            {errors[question.id] && (
                              <span className="block text-sm text-accent">
                                {errors[question.id]}
                              </span>
                            )}
                          </span>
                          {isWide && (
                            <span className="rounded-lg bg-gold/12 px-2 py-0.5 text-xs whitespace-nowrap text-ink-muted">
                              {QUESTION_TYPE_LABELS[question.type]}
                            </span>
                          )}
                          {!question.required && (
                            <span className="text-xs text-ink-faint">opcional</span>
                          )}
                          <span className="text-admin-ink/60">
                            <UiIcon name="pen" size={15} />
                          </span>
                        </button>
                        {isEditing && (
                          <QuestionEditor
                            question={question}
                            error={errors[question.id]}
                            onChange={(c) => change(updateQuestion(form, question.id, c))}
                            onRemove={() => {
                              change(removeQuestion(form, question.id, savedIds))
                              setEditing(null)
                            }}
                            onMove={(delta) =>
                              change(moveQuestion(form, section.id, index, index + delta))
                            }
                            canMoveUp={index > floor}
                            canMoveDown={index >= floor && index < section.questions.length - 1}
                          />
                        )}
                      </li>
                    )
                  })}
                </ol>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => newQuestion(section.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-admin-ink hover:underline"
                  >
                    <UiIcon name="plus" size={16} />
                    Nova pergunta
                  </button>
                  {canRemoveSection(form, section.id) && (
                    <button
                      type="button"
                      onClick={() => change(removeSection(form, section.id, savedIds))}
                      className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-wine"
                    >
                      <UiIcon name="trash" size={15} />
                      Tirar a seção
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        )
      })}

      <button
        type="button"
        onClick={newSection}
        className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-admin-ink hover:underline"
      >
        <UiIcon name="plus" size={16} />
        Nova seção
      </button>

      <section className="flex flex-col gap-2 rounded-[18px] border border-line bg-surface p-4">
        <Field label="Frase de consentimento (sempre no fim)" error={errors.consent}>
          {(props) => (
            <textarea
              {...props}
              rows={3}
              value={form.consent}
              onChange={(e) => change({ ...form, consent: e.target.value })}
              className={`${inputClass} py-2.5 leading-relaxed`}
            />
          )}
        </Field>
      </section>

      {form.archived.length > 0 && (
        <details className="rounded-[18px] border border-dashed border-line p-4">
          <summary className="cursor-pointer text-sm text-ink-muted">
            Perguntas guardadas ({form.archived.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {form.archived.map((question) => (
              <li key={question.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink-muted">{question.label}</span>
                <button
                  type="button"
                  onClick={() => change(restoreQuestion(form, question.id))}
                  className="shrink-0 font-semibold text-admin-ink hover:underline"
                >
                  Voltar ao formulário
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div
        className={`sticky z-20 flex flex-wrap items-center justify-end gap-2.5 rounded-2xl border border-line bg-surface/95 px-4 py-3 backdrop-blur ${
          isWide ? 'bottom-4' : 'bottom-[76px]'
        }`}
      >
        {/* O erro fica até a próxima mudança; o "Salvo" esmaece no lugar enquanto nada mudou. */}
        {saveNotice.notice &&
        (saveNotice.notice.kind === 'error' ? saveNotice.isVisible : !isDirty) ? (
          <SaveStatus
            notice={saveNotice.notice}
            isVisible={saveNotice.isVisible}
            className="mr-auto"
          />
        ) : (
          isDirty && <span className="mr-auto text-sm text-draft">Alterações não salvas</span>
        )}
        {isDirty && !isFromModel && (
          <button
            type="button"
            onClick={() => {
              setForm(saved)
              setErrors({})
              setEditing(null)
              saveNotice.hide()
            }}
            className={ghostButton}
          >
            Descartar
          </button>
        )}
        <button
          type="button"
          onClick={() => void save()}
          disabled={isSaving || !isDirty}
          className={adminButton}
        >
          {isSaving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
