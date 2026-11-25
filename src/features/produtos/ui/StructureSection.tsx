import { useId, useState } from 'react'
import { groupName, MAX_DAY_COUNT, weekCountOf } from '../../../shared/catalog/journeyLayout'
import { toRoman } from '../../../shared/lib/roman'
import { useMediaQuery } from '../../../shared/lib/useMediaQuery'
import { UiIcon } from '../../../shared/ui/UiIcon'
import type { FormErrors, ProductForm } from '../domain/productForm'
import {
  addPart,
  canAddPart,
  groupsOf,
  listItem,
  moveItem,
  movePartName,
  normalizeStructure,
  partEndLimits,
  removePart,
  setDayCount,
  setPartLastDay,
  visibleWeeks,
  type DaySplit,
  type ListItem,
} from '../domain/structureForm'
import { Section, Segmented } from './fields'
import { TrailList } from './TrailList'

interface StructureSectionProps {
  form: ProductForm
  errors: FormErrors
  onChange: (patch: Partial<ProductForm>) => void
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const rename = <T extends ListItem>(list: readonly T[], id: string, title: string): T[] =>
  list.map((item) => (item.id === id ? { ...item, title } : item))

const stepButton =
  'grid size-10 place-items-center rounded-xl text-admin-ink transition-colors hover:bg-admin/10 disabled:cursor-not-allowed disabled:opacity-35'

/** Duração em dias: − e +, ou digitar (vale ao sair do campo se o número for inválido). */
function DayCountField({
  value,
  disabled,
  error,
  onChange,
}: {
  value: number
  disabled: boolean
  error?: string | undefined
  onChange: (n: number) => void
}) {
  const [typing, setTyping] = useState<string | null>(null)
  const labelId = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-sm text-ink-muted">
        Duração
      </span>
      <span className="inline-flex w-fit items-center rounded-xl border border-line bg-field">
        <button
          type="button"
          aria-label="Um dia a menos"
          disabled={disabled || value <= 1}
          onClick={() => onChange(value - 1)}
          className={stepButton}
        >
          <UiIcon name="minus" />
        </button>
        <input
          aria-labelledby={labelId}
          inputMode="numeric"
          disabled={disabled}
          value={typing ?? String(value)}
          onChange={(event) => {
            const text = event.target.value.replace(/\D/g, '').slice(0, 2)
            setTyping(text)
            const n = Number(text)
            if (n >= 1 && n <= MAX_DAY_COUNT) onChange(n)
          }}
          onBlur={() => setTyping(null)}
          className="h-10 w-12 bg-transparent text-center text-[1.02rem] font-medium text-ink focus:outline-none disabled:opacity-60"
        />
        <span className="pr-3 text-ink-muted">dias</span>
        <button
          type="button"
          aria-label="Um dia a mais"
          disabled={disabled || value >= MAX_DAY_COUNT}
          onClick={() => onChange(value + 1)}
          className={stepButton}
        >
          <UiIcon name="plus" />
        </button>
      </span>
      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  )
}

/** "Dias 1 a [− 10 +] · 10 dias": onde a parte termina (a última vai até o fim). */
function PartRange({
  form,
  index,
  disabled,
  onChange,
}: {
  form: ProductForm
  index: number
  disabled: boolean
  onChange: (patch: Partial<ProductForm>) => void
}) {
  const part = form.parts[index]
  if (!part) return null
  const { min, max } = partEndLimits(form, index)
  const first = min
  const isLast = index === form.parts.length - 1
  if (isLast) {
    return (
      <span>
        Dias <b className="font-semibold text-ink-muted">{first}</b> a{' '}
        <b className="font-semibold text-ink-muted">{form.dayCount}</b> · até o fim
      </span>
    )
  }
  const set = (lastDay: number) => onChange(setPartLastDay(form, part.id, lastDay))
  const mini =
    'grid size-7 place-items-center rounded-lg text-admin-ink hover:bg-admin/10 disabled:opacity-35'
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>
        Dias <b className="font-semibold text-ink-muted">{first}</b> a
      </span>
      <span className="inline-flex items-center rounded-lg border border-line bg-field">
        <button
          type="button"
          aria-label={`Parte ${index + 1} termina um dia antes`}
          disabled={disabled || part.lastDay <= min}
          onClick={() => set(part.lastDay - 1)}
          className={mini}
        >
          <UiIcon name="minus" size={15} />
        </button>
        <span aria-live="polite" className="min-w-7 text-center font-semibold text-ink">
          {part.lastDay}
        </span>
        <button
          type="button"
          aria-label={`Parte ${index + 1} termina um dia depois`}
          disabled={disabled || part.lastDay >= max}
          onClick={() => set(part.lastDay + 1)}
          className={mini}
        >
          <UiIcon name="plus" size={15} />
        </button>
      </span>
      <span>· {plural(part.lastDay - first + 1, 'dia', 'dias')}</span>
    </span>
  )
}

/** Títulos dos dias (opcional), separados por semana ou parte; os 3 primeiros viram cartões do banner. */
function DayTitles({
  form,
  isWide,
  onChange,
}: {
  form: ProductForm
  isWide: boolean
  onChange: (patch: Partial<ProductForm>) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const titles = form.dayTitles.slice(0, form.dayCount)
  const named = titles.filter((d) => d.title.trim() !== '').length
  const structure = form.split === 'none' ? 'days' : form.split
  const groups = groupsOf(form)
  const panelId = useId()
  return (
    <div className="border-t border-line pt-3.5">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-2.5 text-left font-medium text-ink"
      >
        <span>
          Títulos dos dias{' '}
          <span className="text-sm font-normal text-ink-faint">
            (opcional · {named} de {form.dayCount} com título)
          </span>
        </span>
        <span
          className={`text-ink-faint transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <UiIcon name="down" />
        </span>
      </button>
      {isOpen && (
        <div id={panelId} className="mt-3 flex animate-[fade-in_250ms_ease-out] flex-col gap-2.5">
          {groups.map((group) => {
            const offset = group.firstDay - 1
            return (
              <div key={`${group.label}-${group.firstDay}`} className="flex flex-col gap-2">
                {structure !== 'days' && (
                  <p className="mt-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.18em] text-accent uppercase after:h-px after:flex-1 after:bg-line">
                    {groupName(structure, group.label)}
                    {group.title.trim() && ` · ${group.title.trim()}`}
                  </p>
                )}
                <TrailList
                  compact
                  isWide={isWide}
                  items={titles.slice(offset, group.lastDay)}
                  mark={(i) => String(offset + i + 1)}
                  name={(i) => `Dia ${offset + i + 1}`}
                  placeholder={(i) => `Dia ${offset + i + 1}`}
                  onRename={(id, title) =>
                    onChange({ dayTitles: rename(form.dayTitles, id, title) })
                  }
                  onMove={(from, to) =>
                    onChange({ dayTitles: moveItem(form.dayTitles, offset + from, offset + to) })
                  }
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** O bloco "Estrutura" do produto (mock aprovado v2): por dias (com divisão) ou por temas. */
export function StructureSection({ form, errors, onChange }: StructureSectionProps) {
  const isWide = useMediaQuery('(min-width: 900px)')
  const locked = form.structureLocked
  const editorLink =
    form.id === 'chama-interna-21' ? '#/jornada/editar' : `#/jornada/${form.id}/editar`
  const weeks = visibleWeeks(form)
  // As explicações ficam no "i" do título (pedido de 2026-11-25), conforme a estrutura escolhida.
  const info = [
    form.layout === 'themes'
      ? 'Sem duração: cada tema abre quando o anterior é concluído.'
      : form.split === 'parts'
        ? '"+ Parte" divide a última parte ao meio. Mudar a ordem troca os nomes; os dias de cada faixa ficam onde estão.'
        : form.split === 'none'
          ? 'Os dias seguem corridos, sem grupos. No caderno, uma aba "Dias".'
          : 'A cada 7 dias, uma semana nova.',
    form.layout === 'days' && !locked
      ? 'Sem título, o dia aparece como "Dia 4". Os 3 primeiros dias com título viram os cartões do banner.'
      : '',
    !isWide && !locked ? 'Para mudar a ordem, segure um item e arraste.' : '',
    !locked && form.hasEditorContent
      ? 'A jornada está em Rascunho: ao salvar, os dias que você já montou no editor vão para a estrutura nova, na mesma ordem.'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Section title="Estrutura" info={info}>
      <Segmented
        label="Estrutura"
        value={form.layout}
        disabled={locked}
        options={[
          { id: 'days', label: 'Por dias' },
          { id: 'themes', label: 'Por temas' },
        ]}
        onChange={(layout) => onChange(normalizeStructure({ ...form, layout }))}
      />

      {locked && (
        <div className="flex items-start gap-2.5 rounded-[14px] border border-admin/30 bg-admin/10 px-3.5 py-3 text-sm leading-relaxed text-ink-muted">
          <span className="mt-0.5 shrink-0 text-admin-ink">
            <UiIcon name="lock" />
          </span>
          <span>
            <b className="font-semibold text-ink">Esta jornada já tem conteúdo salvo.</b> Agora a
            duração, as divisões, a ordem e os nomes se mudam em{' '}
            <a href={editorLink} className="font-semibold text-admin-ink hover:underline">
              Editar o conteúdo da jornada →
            </a>
            , para não desencontrar do que as participantes veem.
          </span>
        </div>
      )}

      {form.layout === 'days' ? (
        <>
          <DayCountField
            value={form.dayCount}
            disabled={locked}
            error={errors.dayCount}
            onChange={(n) => onChange(setDayCount(form, n))}
          />
          <div className="flex flex-col gap-2.5">
            <span className="text-sm text-ink-muted">Dividir os dias</span>
            <Segmented<DaySplit>
              label="Dividir os dias"
              value={form.split}
              disabled={locked}
              options={[
                { id: 'none', label: 'Sem divisão' },
                { id: 'weeks', label: 'Em semanas' },
                { id: 'parts', label: 'Em partes' },
              ]}
              onChange={(split) => onChange(normalizeStructure({ ...form, split }))}
            />
            {form.split === 'weeks' && (
              <>
                <p className="text-xs text-ink-faint">
                  {plural(weekCountOf(form.dayCount), 'semana', 'semanas')}: a cada 7 dias, uma
                  semana nova.
                </p>
                <TrailList
                  isWide={isWide}
                  disabled={locked}
                  items={weeks}
                  mark={(i) => toRoman(i + 1)}
                  name={(i) => `Semana ${toRoman(i + 1)}`}
                  placeholder={() => 'Tema da semana (opcional)'}
                  sub={(i) => {
                    const first = i * 7 + 1
                    const last = Math.min(form.dayCount, first + 6)
                    return first === last ? `Dia ${first}` : `Dias ${first} a ${last}`
                  }}
                  onRename={(id, title) => onChange({ weeks: rename(form.weeks, id, title) })}
                  onMove={(from, to) => onChange({ weeks: moveItem(form.weeks, from, to) })}
                />
              </>
            )}
            {form.split === 'parts' && (
              <>
                <div aria-hidden="true" className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
                  {form.parts.map((part, i) => (
                    <span
                      key={part.id}
                      className={`transition-[flex-grow] duration-300 ${i % 2 === 0 ? 'bg-accent/55' : 'bg-gold/35'}`}
                      style={{ flexGrow: part.lastDay - (form.parts[i - 1]?.lastDay ?? 0) }}
                    />
                  ))}
                </div>
                <TrailList
                  isWide={isWide}
                  disabled={locked}
                  items={form.parts}
                  mark={(i) => String(i + 1)}
                  name={(i) => `Parte ${i + 1}`}
                  placeholder={() => 'Nome da parte'}
                  sub={(i) => (
                    <PartRange form={form} index={i} disabled={locked} onChange={onChange} />
                  )}
                  onRename={(id, title) => onChange({ parts: rename(form.parts, id, title) })}
                  onMove={(from, to) => onChange({ parts: movePartName(form.parts, from, to) })}
                  onRemove={(id) => onChange(removePart(form, id))}
                  canRemove={form.parts.length > 1}
                />
                {errors.parts && <p className="text-sm text-accent">{errors.parts}</p>}
                <button
                  type="button"
                  disabled={locked || !canAddPart(form)}
                  onClick={() => onChange(addPart(form))}
                  className="self-start text-sm font-semibold text-admin-ink hover:underline disabled:opacity-40"
                >
                  + Parte
                </button>
              </>
            )}
          </div>
          {!locked && <DayTitles form={form} isWide={isWide} onChange={onChange} />}
        </>
      ) : (
        <div className="flex flex-col gap-2.5">
          <span className="text-sm text-ink-muted">Temas, na ordem em que se abrem</span>
          <TrailList
            isWide={isWide}
            disabled={locked}
            items={form.themes}
            mark={(i) => String(i + 1)}
            name={(i) => `Tema ${i + 1}`}
            placeholder={() => 'Nome do tema'}
            onRename={(id, title) => onChange({ themes: rename(form.themes, id, title) })}
            onMove={(from, to) => onChange({ themes: moveItem(form.themes, from, to) })}
            onRemove={(id) => onChange({ themes: form.themes.filter((t) => t.id !== id) })}
          />
          {errors.themes && <p className="text-sm text-accent">{errors.themes}</p>}
          <button
            type="button"
            disabled={locked}
            onClick={() => onChange({ themes: [...form.themes, listItem()] })}
            className="self-start text-sm font-semibold text-admin-ink hover:underline disabled:opacity-40"
          >
            + Tema
          </button>
        </div>
      )}
    </Section>
  )
}
