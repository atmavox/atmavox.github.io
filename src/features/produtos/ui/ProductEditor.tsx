import { X } from 'lucide-react'
import { TERRITORIES, TERRITORY_LABELS, type Territory } from '../../../shared/catalog/product'
import { TONE_BY_TERRITORY } from '../../../shared/ui/bannerTones'
import { ProductBanner } from '../../../shared/ui/ProductBanner'
import type { AccessTerm, FormErrors, ProductForm } from '../domain/productForm'
import { Field, Section, Segmented } from './fields'
import { inputClass } from './styles'

export type EditorPart = 'tipo' | 'conteudo' | 'preco' | 'situacao'

interface ProductEditorProps {
  form: ProductForm
  errors: FormErrors
  onChange: (patch: Partial<ProductForm>) => void
  /** Partes a mostrar (no celular, uma por passo; no computador, todas). */
  parts: readonly EditorPart[]
  isNew: boolean
  /** Escolheu uma foto para o banner: o app reduz e envia (ADR-014). */
  onPickBanner?: (file: File) => void
  bannerState?: 'idle' | 'sending' | 'error'
}

const ACCESS_OPTIONS: readonly { id: AccessTerm; label: string }[] = [
  { id: '1', label: '1 mês' },
  { id: '3', label: '3 meses' },
  { id: '6', label: '6 meses' },
  { id: '12', label: '12 meses' },
  { id: 'forever', label: 'Para sempre' },
]

/** Os blocos do editor de produto (mock aprovado): Básico, Estrutura ou Mídia, Preço e acesso, Situação. */
export function ProductEditor({
  form,
  errors,
  onChange,
  parts,
  isNew,
  onPickBanner,
  bannerState = 'idle',
}: ProductEditorProps) {
  const isJourney = form.kind === 'journey'
  const has = (part: EditorPart) => parts.includes(part)

  return (
    <div className="flex flex-col gap-3.5">
      {has('tipo') && (
        <Section title="Tipo">
          {isNew ? (
            <Segmented
              label="Tipo de produto"
              value={form.kind}
              options={[
                { id: 'journey', label: 'Jornada' },
                { id: 'meditation', label: 'Meditação' },
              ]}
              onChange={(kind) => onChange({ kind })}
            />
          ) : (
            <p className="text-ink-muted">
              {isJourney ? 'Jornada' : 'Meditação'} · o tipo não muda depois de criado.
            </p>
          )}
        </Section>
      )}

      {has('conteudo') && (
        <>
          <Section title="Básico">
            <Field label="Nome" error={errors.title}>
              {(props) => (
                <input
                  {...props}
                  value={form.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                  className={inputClass}
                />
              )}
            </Field>
            <Field label="Frase do cartão" hint="Uma frase curta que aparece no hub.">
              {(props) => (
                <textarea
                  {...props}
                  rows={2}
                  value={form.phrase}
                  onChange={(e) => onChange({ phrase: e.target.value })}
                  className={`${inputClass} py-2.5`}
                />
              )}
            </Field>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-ink-muted">Banner</span>
              <div className="flex items-center gap-3">
                <ProductBanner
                  tone={TONE_BY_TERRITORY[form.territory]}
                  mediaId={form.bannerMediaId || undefined}
                  className="h-16 w-28 shrink-0 rounded-xl"
                />
                <label className="cursor-pointer text-sm font-semibold text-admin-ink hover:underline">
                  {bannerState === 'sending'
                    ? 'Enviando…'
                    : form.bannerMediaId
                      ? 'Trocar imagem'
                      : 'Escolher imagem'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={bannerState === 'sending' || !onPickBanner}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onPickBanner?.(file)
                      e.target.value = ''
                    }}
                  />
                </label>
                {form.bannerMediaId && bannerState !== 'sending' && (
                  <button
                    type="button"
                    onClick={() => onChange({ bannerMediaId: '' })}
                    className="text-sm text-ink-faint hover:text-accent"
                  >
                    Usar o fundo da marca
                  </button>
                )}
              </div>
              {bannerState === 'error' ? (
                <p className="text-sm text-accent">
                  Não foi possível enviar a imagem. Tente outra foto ou verifique sua internet.
                </p>
              ) : (
                <p className="text-xs text-ink-faint">
                  A foto é reduzida no seu aparelho antes de enviar. Sem foto, vale o fundo da
                  marca.
                </p>
              )}
            </div>{' '}
            <Field label="Território" hint="Agrupa e filtra no hub.">
              {(props) => (
                <select
                  {...props}
                  value={form.territory}
                  onChange={(e) => onChange({ territory: e.target.value as Territory })}
                  className={inputClass}
                >
                  {TERRITORIES.map((t) => (
                    <option key={t} value={t}>
                      {TERRITORY_LABELS[t]}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </Section>

          {isJourney ? (
            <Section title="Estrutura">
              <Segmented
                label="Estrutura"
                value={form.structure}
                options={[
                  { id: 'days', label: 'Por dias' },
                  { id: 'weeks', label: 'Dias + semanas' },
                  { id: 'themes', label: 'Por temas' },
                ]}
                onChange={(structure) => onChange({ structure })}
              />
              <Field
                label="Duração"
                error={errors.durationLabel}
                hint='Ex.: "21 dias" ou "Jornada em áudio".'
              >
                {(props) => (
                  <input
                    {...props}
                    value={form.durationLabel}
                    onChange={(e) => onChange({ durationLabel: e.target.value })}
                    className={inputClass}
                  />
                )}
              </Field>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-ink-muted">
                  {form.structure === 'weeks' ? 'Semanas' : 'Temas'} (os quadradinhos do cartão)
                </span>
                {form.themes.map((theme, index) => (
                  <div key={index} className="grid grid-cols-[64px_1fr_36px] items-center gap-2">
                    <input
                      aria-label={`Número do tema ${index + 1}`}
                      value={theme.label}
                      onChange={(e) =>
                        onChange({
                          themes: form.themes.map((t, i) =>
                            i === index ? { ...t, label: e.target.value } : t,
                          ),
                        })
                      }
                      className={inputClass}
                    />
                    <input
                      aria-label={`Nome do tema ${index + 1}`}
                      value={theme.title}
                      onChange={(e) =>
                        onChange({
                          themes: form.themes.map((t, i) =>
                            i === index ? { ...t, title: e.target.value } : t,
                          ),
                        })
                      }
                      className={inputClass}
                    />
                    <button
                      type="button"
                      aria-label={`Apagar o tema ${index + 1}`}
                      onClick={() =>
                        onChange({ themes: form.themes.filter((_, i) => i !== index) })
                      }
                      className="grid size-9 place-items-center rounded-full text-ink-faint hover:text-accent"
                    >
                      <X aria-hidden size={16} />
                    </button>
                  </div>
                ))}
                {errors.themes && <p className="text-sm text-accent">{errors.themes}</p>}
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      themes: [
                        ...form.themes,
                        { label: String(form.themes.length + 1), title: '' },
                      ],
                    })
                  }
                  className="self-start text-sm font-semibold text-admin-ink hover:underline"
                >
                  + Tema
                </button>
                <p className="text-xs text-ink-faint">
                  Os dias e os textos de cada dia ficam em "Editar a jornada".
                </p>
              </div>
            </Section>
          ) : (
            <Section title="Mídia">
              <Segmented
                label="Formato"
                value={form.media}
                options={[
                  { id: 'audio', label: 'Áudio' },
                  { id: 'video', label: 'Vídeo' },
                ]}
                onChange={(media) => onChange({ media })}
              />
              <Field
                label={form.media === 'video' ? 'Link do vídeo no YouTube' : 'Link do áudio'}
                error={errors.mediaUrl}
                hint="Só quem tem acesso recebe este link."
              >
                {(props) => (
                  <input
                    {...props}
                    inputMode="url"
                    value={form.mediaUrl}
                    onChange={(e) => onChange({ mediaUrl: e.target.value })}
                    className={inputClass}
                  />
                )}
              </Field>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Duração (minutos)" error={errors.minutes}>
                  {(props) => (
                    <input
                      {...props}
                      inputMode="numeric"
                      value={form.minutes}
                      onChange={(e) => onChange({ minutes: e.target.value })}
                      className={inputClass}
                    />
                  )}
                </Field>
                <Field label="Grupo" error={errors.group} hint='Ex.: "Manhã", "Noite".'>
                  {(props) => (
                    <input
                      {...props}
                      value={form.group}
                      onChange={(e) => onChange({ group: e.target.value })}
                      className={inputClass}
                    />
                  )}
                </Field>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-[1fr_140px]">
                <Field
                  label="Link do e-book (opcional)"
                  error={errors.ebookUrl}
                  hint="Ex.: link de download do Google Drive."
                >
                  {(props) => (
                    <input
                      {...props}
                      inputMode="url"
                      value={form.ebookUrl}
                      onChange={(e) => onChange({ ebookUrl: e.target.value })}
                      className={inputClass}
                    />
                  )}
                </Field>
                <Field label="Páginas" error={errors.ebookPages}>
                  {(props) => (
                    <input
                      {...props}
                      inputMode="numeric"
                      value={form.ebookPages}
                      onChange={(e) => onChange({ ebookPages: e.target.value })}
                      className={inputClass}
                    />
                  )}
                </Field>
              </div>
            </Section>
          )}
        </>
      )}

      {has('preco') && (
        <Section title="Preço e acesso">
          <Segmented
            label="Grátis ou paga"
            value={form.paid ? 'paga' : 'gratis'}
            options={[
              { id: 'gratis', label: 'Grátis' },
              { id: 'paga', label: 'Paga' },
            ]}
            onChange={(value) => onChange({ paid: value === 'paga' })}
          />
          {form.paid && (
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Preço (R$)" error={errors.price}>
                {(props) => (
                  <input
                    {...props}
                    inputMode="decimal"
                    placeholder="97,00"
                    value={form.price}
                    onChange={(e) => onChange({ price: e.target.value })}
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label="Acesso depois da compra">
                {(props) => (
                  <select
                    {...props}
                    value={form.access}
                    onChange={(e) => onChange({ access: e.target.value as AccessTerm })}
                    className={inputClass}
                  >
                    {ACCESS_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
          )}
          <p className="text-xs text-ink-faint">
            Quem comprou antes de uma mudança de preço ou prazo mantém o que comprou.
          </p>
        </Section>
      )}

      {has('situacao') && (
        <Section title="Situação">
          <Segmented
            label="Situação"
            value={form.status}
            options={[
              { id: 'draft', label: 'Rascunho' },
              { id: 'soon', label: 'Em breve' },
              { id: 'published', label: 'Publicada' },
            ]}
            onChange={(status) => onChange({ status })}
          />
          {errors.status && <p className="text-sm text-accent">{errors.status}</p>}
          <label className="flex items-center gap-2.5 text-ink-muted">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => onChange({ featured: e.target.checked })}
              className="size-5 accent-[var(--admin)]"
            />
            Destaque na página inicial
          </label>
          <p className="text-xs text-ink-faint">
            Rascunho não aparece no site. Em breve aparece com "Quero ser avisada". Publicada pode
            ser começada (e comprada, se for paga).
            {form.kind === 'journey' &&
              ' Uma jornada só fica Publicada depois que o conteúdo dela for publicado no editor.'}
          </p>
        </Section>
      )}
    </div>
  )
}
