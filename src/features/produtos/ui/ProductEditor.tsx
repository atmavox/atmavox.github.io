import { InfoTip } from '../../../shared/ui/InfoTip'
import type { ReactNode } from 'react'
import type { Territory } from '../../../shared/catalog/territories'
import { ProductBanner } from '../../../shared/ui/ProductBanner'
import type { AccessTerm, FormErrors, ProductForm } from '../domain/productForm'
import { Field, Section, Segmented } from './fields'
import { StructureSection } from './StructureSection'
import { inputClass } from './styles'
import { TerritoryPicker, type CreateTerritory } from './TerritoryPicker'

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
  /** Os territórios do site e como criar um novo (ADR-027). */
  territories: readonly Territory[]
  onCreateTerritory: CreateTerritory
  /**
   * Produto publicado: quem tem acesso e "Inativar produto", abaixo da Situação. Indisponível: o
   * cartão cinza com "Publicar de novo" fica no lugar da Situação (ADR-035).
   */
  situation?: ReactNode
  /** Já foi ao ar (salvo como Publicada ou Indisponível): Rascunho e Em breve ficam apagados. */
  wasPublished?: boolean
  /** Indisponível: os campos ficam travados. */
  readOnly?: boolean
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
  territories,
  onCreateTerritory,
  situation,
  wasPublished = false,
  readOnly = false,
}: ProductEditorProps) {
  const isJourney = form.kind === 'journey'
  const has = (part: EditorPart) => parts.includes(part)

  return (
    <div className="flex flex-col gap-3.5">
      {/* Indisponível: só se lê (pedido de 2026-11-25); para mudar algo, "Publicar de novo". */}
      <fieldset disabled={readOnly} className="contents">
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
                <span className="flex items-center gap-1 text-sm text-ink-muted">
                  Banner
                  <InfoTip label="Sobre o banner">
                    A foto é reduzida no seu aparelho antes de enviar. Sem foto, vale o fundo da
                    marca.
                  </InfoTip>
                </span>
                <div className="flex items-center gap-3">
                  <ProductBanner
                    territory={form.territory}
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
                ) : null}
              </div>{' '}
              <div className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1 text-sm text-ink-muted">
                  Território
                  <InfoTip label="Sobre o território">
                    Agrupa e filtra no hub; dá a cor do banner dos produtos sem imagem.
                  </InfoTip>
                </span>
                <TerritoryPicker
                  value={form.territory}
                  territories={territories}
                  onChange={(territory) => onChange({ territory })}
                  onCreate={onCreateTerritory}
                />
              </div>
            </Section>

            {isJourney ? (
              <StructureSection form={form} errors={errors} onChange={onChange} />
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
          <Section
            title="Preço e acesso"
            info="Quem comprou antes de uma mudança de preço ou prazo mantém o que comprou."
          >
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
          </Section>
        )}
      </fieldset>

      {has('situacao') && (
        <Section
          title="Situação"
          info={
            form.status === 'retired'
              ? 'Indisponível: não aparece no site e ninguém mais compra. Quem tem acesso continua até o prazo. "Publicar de novo" volta a Publicada.'
              : [
                  wasPublished
                    ? 'Depois de publicado, o produto não volta a Rascunho nem a Em breve: para tirar do site, use "Inativar produto".'
                    : '',
                  'Rascunho não aparece no site. Em breve aparece com "Quero ser avisada". Publicada pode ser começada (e comprada, se for paga).',
                  form.kind === 'journey'
                    ? 'Uma jornada só fica Publicada depois que o conteúdo dela for publicado no editor.'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')
          }
        >
          {form.status === 'retired' && situation ? (
            situation
          ) : (
            <>
              <Segmented
                label="Situação"
                value={form.status}
                options={[
                  { id: 'draft', label: 'Rascunho', disabled: wasPublished },
                  { id: 'soon', label: 'Em breve', disabled: wasPublished },
                  { id: 'published', label: 'Publicada' },
                ]}
                onChange={(status) => onChange({ status })}
              />
              {situation}
            </>
          )}
          {errors.status && <p className="text-sm text-accent">{errors.status}</p>}
          {/* Rascunho e Indisponível não aparecem no site: não tem como ficar em destaque. */}
          {form.status !== 'draft' && form.status !== 'retired' && (
            <label className="flex items-center gap-2.5 text-ink-muted">
              <input
                type="checkbox"
                checked={form.featured}
                disabled={readOnly}
                onChange={(e) => onChange({ featured: e.target.checked })}
                className="size-5 accent-[var(--admin)]"
              />
              Destaque na página inicial
            </label>
          )}
        </Section>
      )}
    </div>
  )
}
