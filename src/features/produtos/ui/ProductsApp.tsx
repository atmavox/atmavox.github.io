import { ArrowLeft, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatPrice } from '../../../shared/catalog/offer'
import type { Product } from '../../../shared/catalog/product'
import type { CatalogStore } from '../../../shared/catalog/catalogStore'
import { useMediaQuery } from '../../../shared/lib/useMediaQuery'
import { TONE_BY_TERRITORY } from '../../../shared/ui/bannerTones'
import { ProductBanner } from '../../../shared/ui/ProductBanner'
import { rememberBannerImage } from '../../../shared/ui/useBannerImage'
import { UiIcon } from '../../../shared/ui/UiIcon'
import {
  canDeleteProduct,
  deleteProduct,
  loadJourneySeed,
  saveProduct,
} from '../application/saveProduct'
import {
  emptyForm,
  formFromProduct,
  productFromForm,
  type FormErrors,
  type ProductForm,
} from '../domain/productForm'
import type { ProductsBackend } from '../infrastructure/productsBackend'
import { ProductEditor, type EditorPart } from './ProductEditor'
import { ProductPreview } from './ProductPreview'

type Filter = 'todos' | 'journey' | 'meditation'
const STATUS_LABEL = { draft: 'Rascunho', soon: 'Em breve', published: 'Publicada' } as const
const STATUS_CLASS = {
  draft: 'bg-draft/14 text-draft',
  soon: 'bg-ink/8 text-ink-muted',
  published: 'bg-ok/14 text-ok',
} as const

const button =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-[18px] text-sm font-semibold whitespace-nowrap'
const adminButton = `${button} bg-admin text-on-admin hover:opacity-90 disabled:opacity-60`
const ghostButton = `${button} border border-line bg-surface text-ink-muted hover:border-admin hover:text-admin-ink`

/** Passos do celular (mock aprovado): o tipo só ao criar; termina em "Revisar". */
const STEPS: readonly { id: EditorPart | 'revisar'; label: string }[] = [
  { id: 'tipo', label: 'Tipo' },
  { id: 'conteudo', label: 'Conteúdo' },
  { id: 'preco', label: 'Preço e acesso' },
  { id: 'situacao', label: 'Situação' },
  { id: 'revisar', label: 'Revisar' },
]

function ProductRow({
  product,
  isActive,
  compact,
  onSelect,
}: {
  product: Product
  isActive: boolean
  compact: boolean
  onSelect: () => void
}) {
  const pricing = product.pricing
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? 'true' : undefined}
        className={`grid w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left ${
          compact ? 'grid-cols-[48px_1fr_auto]' : 'grid-cols-[52px_1fr_auto_auto]'
        } ${isActive ? 'bg-admin/10 outline outline-1 outline-admin/35' : 'hover:bg-admin/5'}`}
      >
        <ProductBanner
          tone={TONE_BY_TERRITORY[product.territory]}
          mediaId={product.bannerMediaId}
          className="aspect-square rounded-xl"
        />
        <span className="min-w-0">
          <b className="block truncate font-medium text-ink">{product.title}</b>
          <span className="text-sm text-ink-faint">
            {product.kind === 'journey'
              ? `Jornada · ${product.durationLabel}`
              : `Meditação · ${Math.round(product.durationSec / 60)} min`}
          </span>
        </span>
        {!compact && (
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap ${
              pricing.type === 'paid'
                ? 'border-accent/40 font-semibold text-accent'
                : 'border-line text-ink-muted'
            }`}
          >
            {pricing.type === 'paid' ? formatPrice(pricing.priceCents) : 'Grátis'}
          </span>
        )}
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_CLASS[product.status]}`}
        >
          {STATUS_LABEL[product.status]}
        </span>
      </button>
    </li>
  )
}

/** Prévia antes de salvar, numa janela (computador, mock aprovado). */
function PreviewDialog({
  product,
  isSaving,
  onBack,
  onSave,
}: {
  product: Product
  isSaving: boolean
  onBack: () => void
  onSave: () => void
}) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onBack()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onBack])

  return createPortal(
    <div className="fixed inset-0 z-40 grid animate-[fade-in_250ms_ease-out] place-items-center bg-[color-mix(in_oklab,var(--bg)_35%,rgb(20_14_10/0.4))] p-6">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90dvh] w-full max-w-[520px] animate-[dialog-in_320ms_ease-out] flex-col gap-3.5 overflow-y-auto rounded-3xl border border-line bg-bg p-6 shadow-[0_30px_80px_rgb(20_14_10/0.35)]"
      >
        <h2 id={titleId} className="font-display text-2xl text-ink">
          Como fica no hub
        </h2>
        <p className="text-sm text-ink-faint">Ainda não está salvo. Confira o cartão e o preço.</p>
        <ProductPreview product={product} />
        <div className="flex justify-between gap-3">
          <button type="button" onClick={onBack} className={ghostButton}>
            <ArrowLeft aria-hidden size={16} />
            Voltar para editar
          </button>
          <button type="button" onClick={onSave} disabled={isSaving} className={adminButton}>
            {isSaving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Modo Andreía de produtos (mock aprovado): lista + editor no computador, passo a passo no celular. */
export function ProductsApp({
  backend,
  catalog,
}: {
  backend: ProductsBackend
  catalog: CatalogStore | null
}) {
  const isWide = useMediaQuery('(min-width: 900px)')
  const [products, setProducts] = useState<readonly Product[]>(() => catalog?.getSnapshot() ?? [])
  const [filter, setFilter] = useState<Filter>('todos')
  const [form, setForm] = useState<ProductForm | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [bannerState, setBannerState] = useState<'idle' | 'sending' | 'error'>('idle')

  async function pickBanner(file: File) {
    setBannerState('sending')
    try {
      // A redução de imagem só carrega quando a Andreía escolhe uma foto.
      const { compressImageInBrowser } = await import('../../../shared/media/compressImage')
      const image = await compressImageInBrowser(file)
      const id = await backend.saveImage(image)
      rememberBannerImage(id, image.dataUrl)
      setForm((f) => (f ? { ...f, bannerMediaId: id } : f))
      setBannerState('idle')
    } catch {
      setBannerState('error')
    }
  }

  useEffect(() => catalog?.subscribe(() => setProducts(catalog.getSnapshot())), [catalog])

  const visible = products.filter((p) => filter === 'todos' || p.kind === filter)
  const steps = STEPS.filter((s) => s.id !== 'tipo' || isNew)

  async function open(product: Product) {
    setNotice(null)
    setIsConfirmingDelete(false)
    setErrors({})
    setIsNew(false)
    setStep(0)
    // Meditação: os links ficam no conteúdo protegido, lido com o login da admin. Jornada: os títulos
    // dos dias e a trava da estrutura vêm do rascunho dela (ADR-025).
    if (product.kind === 'meditation') {
      const content = await backend.loadMeditationContent(product.id).catch(() => null)
      setForm(formFromProduct(product, content ?? undefined))
    } else {
      setForm(formFromProduct(product, undefined, await loadJourneySeed(product.id, backend)))
    }
  }

  function create() {
    setNotice(null)
    setErrors({})
    setIsNew(true)
    setStep(0)
    setForm(emptyForm('journey', Math.max(0, ...products.map((p) => p.order)) + 1))
  }

  async function save() {
    if (!form) return
    setIsSaving(true)
    setNotice(null)
    const result = await saveProduct(form, products, backend)
    setIsSaving(false)
    if (result.kind === 'invalid') {
      setErrors(result.errors)
      setIsPreviewOpen(false)
      setNotice(result.errors.status ?? 'Faltam alguns campos. Confira as mensagens em vermelho.')
      return
    }
    if (result.kind === 'error') {
      setNotice(result.message)
      return
    }
    catalog?.replace(result.catalog)
    setProducts(result.catalog)
    setErrors({})
    setIsNew(false)
    setIsPreviewOpen(false)
    // O formulário continua aberto, agora com o id definitivo (um produto novo ganha o id ao salvar).
    setForm({ ...form, id: result.product.id })
    setStep(0)
    setNotice('Salvo ✓')
  }

  const patch = (change: Partial<ProductForm>) => setForm((f) => (f ? { ...f, ...change } : f))

  // Apagar vale para o produto como está salvo (Rascunho ou Em breve), não para o que está na tela.
  const savedProduct = form && !isNew ? products.find((p) => p.id === form.id) : undefined
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  async function remove() {
    if (!savedProduct) return
    setIsSaving(true)
    const result = await deleteProduct(savedProduct, products, backend)
    setIsSaving(false)
    setIsConfirmingDelete(false)
    if (result.kind === 'error') {
      setNotice(result.message)
      return
    }
    catalog?.replace(result.catalog)
    setProducts(result.catalog)
    setForm(null)
    setNotice(`"${savedProduct.title}" foi apagado.`)
  }

  const deleteControl =
    savedProduct && canDeleteProduct(savedProduct) ? (
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
          Apagar produto
        </button>
      )
    ) : null

  const list = (
    <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-surface p-3">
      <div role="group" aria-label="Filtrar produtos" className="flex gap-1.5 px-1 pb-2">
        {(
          [
            ['todos', 'Todos'],
            ['journey', 'Jornadas'],
            ['meditation', 'Meditações'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`rounded-full border px-3.5 py-1 text-sm ${
              filter === id
                ? 'border-admin bg-admin text-on-admin'
                : 'border-line text-ink-muted hover:text-admin-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="flex flex-col gap-1">
        {visible.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            isActive={!!form && form.id === product.id}
            compact={!isWide}
            onSelect={() => void open(product)}
          />
        ))}
      </ul>
    </div>
  )

  const noticeLine = notice && (
    <p
      role="status"
      className={`text-sm ${notice.startsWith('Salvo') ? 'text-ok' : 'text-accent'}`}
    >
      {notice}
    </p>
  )

  // Os dias (ou temas) de uma jornada se editam no editor da jornada, já montado pela estrutura.
  const contentLink =
    form && form.kind === 'journey' && !isNew ? (
      <a
        href={form.id === 'chama-interna-21' ? '#/jornada/editar' : `#/jornada/${form.id}/editar`}
        className="text-sm font-semibold text-admin-ink hover:underline"
      >
        Editar o conteúdo da jornada →
      </a>
    ) : null

  const header = (
    <div className="flex items-center justify-between gap-3">
      <h1 className={`font-display text-ink ${isWide ? 'text-[2rem]' : 'text-[1.6rem]'}`}>
        Produtos
      </h1>
      <button type="button" onClick={create} className={adminButton}>
        <Plus aria-hidden size={16} />
        {isWide ? 'Novo produto' : 'Novo'}
      </button>
    </div>
  )

  if (isWide) {
    return (
      <div className="mx-auto flex w-full max-w-6xl animate-[page-in_400ms_ease-out] flex-col gap-4.5 px-7 py-7">
        {header}
        <div className="grid grid-cols-[420px_minmax(0,1fr)] items-start gap-5.5">
          {/* A lista fica parada ao lado enquanto o editor rola (abaixo da faixa azul). */}
          <div className="sticky top-16 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-[18px]">
            {list}
          </div>
          {form ? (
            <div className="flex flex-col gap-3.5">
              <ProductEditor
                form={form}
                errors={errors}
                onChange={patch}
                parts={
                  isNew
                    ? ['tipo', 'conteudo', 'preco', 'situacao']
                    : ['conteudo', 'preco', 'situacao']
                }
                isNew={isNew}
                onPickBanner={(file) => void pickBanner(file)}
                bannerState={bannerState}
              />
              {noticeLine}
              <div className="flex flex-wrap items-center justify-end gap-2.5">
                {(contentLink || deleteControl) && (
                  <span className="mr-auto flex flex-wrap items-center gap-x-5 gap-y-2">
                    {contentLink}
                    {deleteControl}
                  </span>
                )}
                <button type="button" onClick={() => setForm(null)} className={ghostButton}>
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className={ghostButton}
                >
                  Ver como fica no hub
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={isSaving}
                  className={adminButton}
                >
                  {isSaving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {noticeLine}
              <p className="rounded-[18px] border border-dashed border-line p-8 text-ink-muted">
                Escolha um produto na lista para editar, ou crie um novo.
              </p>
            </div>
          )}
        </div>
        {isPreviewOpen && form && (
          <PreviewDialog
            product={productFromForm(form)}
            isSaving={isSaving}
            onBack={() => setIsPreviewOpen(false)}
            onSave={() => void save()}
          />
        )}
      </div>
    )
  }

  // Celular: lista; ao abrir um produto, o passo a passo que termina em "Revisar".
  if (!form) {
    return (
      <div className="flex animate-[page-in_400ms_ease-out] flex-col gap-4 p-4">
        {header}
        {noticeLine}
        {list}
      </div>
    )
  }
  const current = steps[Math.min(step, steps.length - 1)] ?? steps[0]!
  const isLast = step >= steps.length - 1
  return (
    <div key={step} className="flex animate-[page-in_400ms_ease-out] flex-col gap-4 p-4">
      <button
        type="button"
        onClick={() => setForm(null)}
        className="inline-flex items-center gap-1.5 self-start text-ink-muted"
      >
        <ArrowLeft aria-hidden size={16} />
        Produtos
      </button>
      <h1 className="font-display text-[1.6rem] text-ink">
        {form.title || (isNew ? 'Novo produto' : 'Produto')}
      </h1>
      {contentLink}
      {step === 0 && deleteControl}
      <p className="text-sm text-ink-faint">
        Passo {step + 1} de {steps.length} · {current.label}
      </p>
      {current.id === 'revisar' ? (
        <section className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-4">
          <h3 className="text-xs font-semibold tracking-[0.2em] text-admin-ink uppercase">
            Revisar
          </h3>
          <p className="text-sm text-ink-faint">
            É assim que aparece no hub. Se algo estiver estranho, volte e arrume antes de salvar.
          </p>
          <ProductPreview product={productFromForm(form)} />
        </section>
      ) : (
        <ProductEditor
          form={form}
          errors={errors}
          onChange={patch}
          parts={[current.id]}
          isNew={isNew}
          onPickBanner={(file) => void pickBanner(file)}
          bannerState={bannerState}
        />
      )}
      {noticeLine}
      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={() => (step === 0 ? setForm(null) : setStep(step - 1))}
          className={ghostButton}
        >
          <ArrowLeft aria-hidden size={16} />
          {isLast ? 'Voltar para arrumar' : 'Voltar'}
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={() => void save()}
            disabled={isSaving}
            className={adminButton}
          >
            {isSaving ? 'Salvando…' : 'Salvar'}
          </button>
        ) : (
          <button type="button" onClick={() => setStep(step + 1)} className={adminButton}>
            Continuar →
          </button>
        )}
      </div>
    </div>
  )
}
