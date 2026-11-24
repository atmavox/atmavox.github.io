import { useEffect, useState } from 'react'
import {
  DEFAULT_THERAPIES,
  durationLabel,
  MODALITY_LABELS,
  type Therapy,
} from '../../../../shared/ativacao/therapy'
import { formatPrice } from '../../../../shared/catalog/offer'
import { TherapyBadge } from '../../../../shared/ui/TherapyIcon'
import { UiIcon } from '../../../../shared/ui/UiIcon'
import { useSortable } from '../../../../shared/ui/useSortable'
import {
  emptyTherapyForm,
  formFromTherapy,
  hasErrors,
  moveTherapy,
  therapyFromForm,
  toggleTherapy,
  upsertTherapy,
  validateTherapyForm,
  type TherapyErrors,
  type TherapyForm,
} from '../../domain/therapyForm'
import type { AtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import { adminButton, ghostButton } from '../styles'
import { SaveStatus } from '../SaveStatus'
import { useSaveNotice } from '../useSaveNotice'
import { Overlay } from './Overlay'
import { Switch, TherapyFields } from './TherapyFields'
import { LoadingNote } from '../../../../shared/ui/LoadingNote'

const SAVE_ERROR = 'Não deu para salvar. Confira a internet e tente de novo.'

/** Terapias da ativação (mock aprovado): tabela no computador, cartões no celular; editar em janela. */
export function TherapiesPanel({
  backend,
  isWide,
}: {
  backend: AtivacoesBackend
  isWide: boolean
}) {
  const [list, setList] = useState<readonly Therapy[] | null>(null)
  const [isFromModel, setIsFromModel] = useState(false)
  const [form, setForm] = useState<TherapyForm | null>(null)
  const [errors, setErrors] = useState<TherapyErrors>({})
  const saveNotice = useSaveNotice()
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  useEffect(() => {
    let cancelled = false
    backend
      .loadTherapies()
      .catch(() => null)
      .then((loaded) => {
        if (cancelled) return
        setIsFromModel(loaded === null)
        setList(loaded ?? DEFAULT_THERAPIES)
      })
    return () => {
      cancelled = true
    }
  }, [backend])

  /**
   * Grava a lista. O aviso anterior fica até chegar o novo (sumir e voltar fazia a tela pular). Com
   * `optimistic`, a lista muda antes de o Firebase responder e volta se não der para salvar.
   */
  async function persist(
    next: readonly Therapy[],
    message = 'Salvo',
    optimistic = false,
  ): Promise<boolean> {
    const before = list
    setIsSaving(true)
    if (optimistic) setList(next)
    try {
      await backend.saveTherapies(next)
      setList(next)
      setIsFromModel(false)
      saveNotice.show({ kind: 'ok', text: message })
      return true
    } catch {
      if (optimistic) setList(before)
      saveNotice.show({ kind: 'error', text: SAVE_ERROR })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const sortable = useSortable({
    ids: (list ?? []).map((t) => t.id),
    onMove: (from, to) => list && void persist(moveTherapy(list, from, to), 'Ordem salva', true),
    disabled: isSaving,
  })

  if (!list) return <LoadingNote text="Carregando as terapias…" />

  function openForm(therapy: Therapy | null, startErrors: TherapyErrors = {}) {
    saveNotice.hide()
    setIsConfirmingDelete(false)
    setErrors(startErrors)
    setForm(therapy ? formFromTherapy(therapy) : emptyTherapyForm())
  }

  function toggle(therapy: Therapy) {
    const next = toggleTherapy(list!, therapy.id)
    if (next) void persist(next, 'Salvo', true)
    else openForm(therapy, { price: 'Para ativar, a terapia precisa de preço.' })
  }

  async function save() {
    if (!form || !list) return
    const found = validateTherapyForm(form)
    setErrors(found)
    if (hasErrors(found)) return
    const therapy = therapyFromForm(
      form,
      list.map((t) => t.id),
    )
    if (await persist(upsertTherapy(list, therapy))) setForm(null)
  }

  async function remove() {
    if (!form || !list) return
    if (
      await persist(
        list.filter((t) => t.id !== form.id),
        `"${form.name}" foi apagada.`,
      )
    ) {
      setForm(null)
    }
  }

  const saveError = saveNotice.notice?.kind === 'error' && saveNotice.isVisible

  // O aviso mora na linha do título: aparecer, mudar ou sumir não empurra a tabela.
  const header = (
    <div className="flex items-center gap-3">
      <h1 className={`font-display text-ink ${isWide ? 'text-[2rem]' : 'text-[1.6rem]'}`}>
        Terapias
      </h1>
      <span className="flex min-w-0 flex-1 justify-end">
        <SaveStatus
          notice={saveNotice.notice}
          isVisible={saveNotice.isVisible && !form}
          className="text-right"
        />
      </span>
      <button type="button" onClick={() => openForm(null)} className={adminButton}>
        <UiIcon name="plus" size={16} />
        {isWide ? 'Nova terapia' : 'Nova'}
      </button>
    </div>
  )

  const modelNote = isFromModel && (
    <p className="rounded-2xl bg-admin/8 px-4 py-3 text-sm text-ink-muted">
      Estas são as terapias combinadas, ainda sem preço e desativadas. Abra cada uma, confira o
      texto, ponha o preço e ative.
    </p>
  )

  const rows = (
    <ul className={`flex flex-col ${isWide ? '' : 'gap-2.5'}`}>
      {list.map((therapy) => (
        <li
          key={therapy.id}
          {...sortable.itemProps(therapy.id, !isWide)}
          className={`grid items-center gap-3 bg-surface transition-colors data-[dragging=true]:z-10 data-[dragging=true]:shadow-[0_12px_28px_rgb(20_14_10/0.22)] data-[pressing=true]:bg-admin/10 ${
            isWide
              ? 'grid-cols-[28px_minmax(0,2.4fr)_1.3fr_0.8fr_0.8fr_auto_auto] border-b border-line px-3 py-2.5 last:border-b-0'
              : 'grid-cols-[minmax(0,1fr)_auto] rounded-2xl border border-line px-3.5 py-3 [-webkit-touch-callout:none]'
          }`}
        >
          {isWide && (
            <button
              type="button"
              {...sortable.handleProps(therapy.id)}
              aria-label={`Arrastar ${therapy.name} (ou use as setas do teclado)`}
              className="grid h-9 w-7 cursor-grab touch-none place-items-center rounded-[10px] text-ink-faint hover:bg-admin/12 hover:text-admin-ink active:cursor-grabbing"
            >
              <UiIcon name="grip" />
            </button>
          )}
          <button
            type="button"
            onClick={() => openForm(therapy)}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <TherapyBadge icon={therapy.icon} tone={therapy.tone} size={isWide ? 34 : 40} />
            <span className="min-w-0">
              <b className="block truncate font-medium text-ink">{therapy.name}</b>
              {!isWide && (
                <span className="block text-sm text-ink-faint">
                  {durationLabel(therapy.durationMin)} ·{' '}
                  {therapy.priceCents ? formatPrice(therapy.priceCents) : 'sem preço'}
                </span>
              )}
            </span>
          </button>
          {isWide && (
            <>
              <span className="text-sm text-ink-muted">{MODALITY_LABELS[therapy.modality]}</span>
              <span className="text-sm text-ink-muted">{durationLabel(therapy.durationMin)}</span>
              <span className={`text-sm ${therapy.priceCents ? 'text-ink' : 'text-ink-faint'}`}>
                {therapy.priceCents ? formatPrice(therapy.priceCents) : 'sem preço'}
              </span>
            </>
          )}
          <Switch
            label={`${therapy.name} ativa`}
            checked={therapy.active}
            onChange={() => toggle(therapy)}
          />
          {isWide && (
            <button
              type="button"
              onClick={() => openForm(therapy)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-admin-ink hover:underline"
            >
              <UiIcon name="pen" size={15} />
              Editar
            </button>
          )}
        </li>
      ))}
    </ul>
  )

  const saved = form && list.some((t) => t.id === form.id)
  const footer = form && (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {saved ? (
        isConfirmingDelete ? (
          <span role="group" aria-label="Confirmar" className="flex items-center gap-2 text-sm">
            <span className="text-ink-muted">Apagar de vez?</span>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void remove()}
              className="rounded-full bg-wine px-3.5 py-1.5 font-semibold text-on-admin hover:opacity-90"
            >
              Apagar
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              className="rounded-full px-3 py-1.5 text-ink-muted hover:text-ink"
            >
              Não
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-wine"
          >
            <UiIcon name="trash" size={16} />
            Apagar terapia
          </button>
        )
      ) : (
        <span />
      )}
      <span className="flex gap-2.5">
        {isWide && (
          <button type="button" onClick={() => setForm(null)} className={ghostButton}>
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={() => void save()}
          disabled={isSaving}
          className={`${adminButton} ${isWide ? '' : 'flex-1'}`}
        >
          {isSaving ? 'Salvando…' : saved ? 'Salvar' : 'Criar terapia'}
        </button>
      </span>
    </div>
  )

  return (
    <div
      className={`mx-auto flex w-full max-w-5xl animate-[page-in_400ms_ease-out] flex-col gap-4 ${
        isWide ? 'px-7 py-7' : 'p-4'
      }`}
    >
      {header}
      {modelNote}
      {isWide ? (
        <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
          <div className="grid grid-cols-[28px_minmax(0,2.4fr)_1.3fr_0.8fr_0.8fr_auto_auto] gap-3 border-b border-line px-3 py-2 text-xs text-ink-faint">
            <span />
            <span>Terapia</span>
            <span>Modalidade</span>
            <span>Duração</span>
            <span>Preço</span>
            <span>Ativa</span>
            <span className="w-[58px]" />
          </div>
          {rows}
        </div>
      ) : (
        <>
          {rows}
          <p className="text-center text-xs text-ink-faint">
            Segure uma terapia para mudar a ordem.
          </p>
        </>
      )}
      {form && (
        <Overlay
          title={saved ? 'Editar terapia' : 'Nova terapia'}
          isWide={isWide}
          onClose={() => setForm(null)}
          footer={footer}
        >
          <TherapyFields
            key={Object.keys(errors).join()}
            form={form}
            errors={errors}
            onChange={(change) => setForm((f) => (f ? { ...f, ...change } : f))}
            layout={isWide ? 'all' : 'accordion'}
          />
          {saveError && <p className="mt-3 text-sm text-accent">{saveNotice.notice?.text}</p>}
        </Overlay>
      )}
    </div>
  )
}
