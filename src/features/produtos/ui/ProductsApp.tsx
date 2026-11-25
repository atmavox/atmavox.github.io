import { useLatest } from '../../../shared/lib/useLatest'
import { ArrowLeft, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { formatPrice } from '../../../shared/catalog/offer'
import { wasPublished, type Product } from '../../../shared/catalog/product'
import type { CatalogStore } from '../../../shared/catalog/catalogStore'
import { useMediaQuery } from '../../../shared/lib/useMediaQuery'
import { useNow } from '../../../shared/lib/useNow'
import { ProductBanner } from '../../../shared/ui/ProductBanner'
import { rememberBannerImage } from '../../../shared/ui/useBannerImage'
import { UiIcon } from '../../../shared/ui/UiIcon'
import {
  canDeleteProduct,
  deleteProduct,
  loadJourneySeed,
  saveProduct,
  type JourneyReshaper,
} from '../application/saveProduct'
import {
  duplicateProduct,
  type BuiltInJourneyLoader,
  type JourneyCopier,
} from '../application/duplicateProduct'
import { setAvailability } from '../application/setAvailability'
import { accessStats, hasEverHadAccess } from '../domain/availability'
import type { AccessAdmin, GrantedAccess } from '../infrastructure/accessAdmin'
import { AvailabilityCard } from './AvailabilityCard'
import { DiscardDialog } from './DiscardDialog'
import { DropDaysDialog } from './DropDaysDialog'
import { RetireDialog } from './RetireDialog'
import {
  emptyForm,
  formFromProduct,
  productFromForm,
  type FormErrors,
  type ProductForm,
} from '../domain/productForm'
import type { ProductsBackend } from '../infrastructure/productsBackend'
import { createTerritory } from '../application/createTerritory'
import { useTerritories } from '../../../shared/catalog/TerritoryContext'
import { ProductEditor, type EditorPart } from './ProductEditor'
import type { CreateTerritory } from './TerritoryPicker'
import { ProductPreview } from './ProductPreview'
import { SaveStatus } from './SaveStatus'
import { useSaveNotice } from './useSaveNotice'

type Filter = 'todos' | 'journey' | 'meditation'
const STATUS_LABEL = {
  draft: 'Rascunho',
  soon: 'Em breve',
  published: 'Publicada',
  retired: 'Indisponível',
} as const
const STATUS_CLASS = {
  draft: 'bg-draft/14 text-draft',
  soon: 'bg-ink/8 text-ink-muted',
  published: 'bg-ok/14 text-ok',
  retired: 'bg-gray-state/16 text-ink-faint',
} as const

const button =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-[18px] text-sm font-semibold whitespace-nowrap'
const adminButton = `${button} bg-admin text-on-admin hover:opacity-90 disabled:opacity-60`
const ghostButton = `${button} border border-line bg-surface text-ink-muted hover:border-admin hover:text-admin-ink`
/** Os botões de baixo do editor, menores, para caberem numa linha só. */
const smallButton =
  'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-[color,border-color,opacity] duration-200 disabled:opacity-60 motion-reduce:transition-none'
const smallGhostButton = `${smallButton} border border-line bg-surface text-ink-muted hover:border-admin hover:text-admin-ink`
const smallAdminButton = `${smallButton} bg-admin text-on-admin hover:opacity-90`

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
  // Indisponível (mock aprovado, lista A): mais apagado, com a capa em tons de cinza.
  const isRetired = product.status === 'retired'
  return (
    <li className={isRetired ? 'opacity-60' : undefined}>
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? 'true' : undefined}
        className={`grid w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left ${
          compact ? 'grid-cols-[48px_1fr_auto]' : 'grid-cols-[52px_1fr_auto_auto]'
        } ${isActive ? 'bg-admin/10 outline outline-1 outline-admin/35' : 'hover:bg-admin/5'}`}
      >
        <ProductBanner
          territory={product.territory}
          mediaId={product.bannerMediaId}
          className={`aspect-square rounded-xl ${isRetired ? 'grayscale' : ''}`}
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
  const back = useLatest(onBack)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') back.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [back])

  return createPortal(
    <div className="fixed inset-0 z-40 grid animate-[fade-in_250ms_ease-out] place-items-center bg-[color-mix(in_oklab,var(--bg)_35%,rgb(20_14_10/0.4))] p-6">
      {/* O fundo fecha a janela (clicar fora); "Voltar" é o caminho acessível. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onBack}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[90dvh] w-full max-w-[520px] animate-[dialog-in_320ms_ease-out] flex-col gap-3.5 overflow-y-auto rounded-3xl border border-line bg-bg p-6 shadow-[0_30px_80px_rgb(20_14_10/0.35)]"
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
  loadBuiltInJourney,
  accessAdmin,
  reshapeJourney,
  copyJourney,
}: {
  backend: ProductsBackend
  catalog: CatalogStore | null
  /** Para o cartão Disponível: quem tem acesso a cada produto agora. */
  accessAdmin?: AccessAdmin
  /** O conteúdo das jornadas que vêm no código (para duplicar a Chama Interna). */
  loadBuiltInJourney?: BuiltInJourneyLoader
  /** Reorganiza os dias do editor quando a estrutura de uma jornada em Rascunho muda. */
  reshapeJourney?: JourneyReshaper
  /** O conteúdo da cópia de uma jornada, com os dias em rascunho. */
  copyJourney?: JourneyCopier
}) {
  const isWide = useMediaQuery('(min-width: 900px)')
  const { territories, store: territoryStore } = useTerritories()
  const [products, setProducts] = useState<readonly Product[]>(() => catalog?.getSnapshot() ?? [])
  const [filter, setFilter] = useState<Filter>('todos')
  const [form, setForm] = useState<ProductForm | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const saveNotice = useSaveNotice()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [bannerState, setBannerState] = useState<'idle' | 'sending' | 'error'>('idle')
  const [accesses, setAccesses] = useState<readonly GrantedAccess[] | null>(null)
  const [isConfirmingRetire, setIsConfirmingRetire] = useState(false)
  const [isRetiredOpen, setIsRetiredOpen] = useState(false)
  const [dropDays, setDropDays] = useState<readonly { number: number; title: string }[] | null>(
    null,
  )
  const now = useNow()

  // Os acessos de todo mundo, uma vez: os números do cartão Disponível. Sem conexão, o cartão avisa.
  useEffect(() => {
    if (!accessAdmin) return
    let cancelled = false
    void accessAdmin
      .listAccesses()
      .then((list) => {
        if (!cancelled) setAccesses(list)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [accessAdmin])

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
  // Os Indisponíveis ficam no fim, num grupo que começa fechado (mock aprovado, lista A + B).
  const onAir = visible.filter((p) => p.status !== 'retired')
  const retired = visible.filter((p) => p.status === 'retired')
  const steps = STEPS.filter((s) => s.id !== 'tipo' || isNew)

  async function open(product: Product) {
    saveNotice.hide()
    setIsConfirmingDelete(false)
    setIsConfirmingRetire(false)
    setErrors({})
    setIsNew(false)
    setStep(0)
    // Meditação: os links ficam no conteúdo protegido, lido com o login da admin. Jornada: os títulos
    // dos dias e a trava da estrutura vêm do rascunho dela (ADR-025).
    if (product.kind === 'meditation') {
      const content = await backend.loadMeditationContent(product.id).catch(() => null)
      setForm(formFromProduct(product, content ?? undefined))
    } else {
      setForm(
        formFromProduct(
          product,
          undefined,
          await loadJourneySeed(product.id, backend, product.status),
        ),
      )
    }
  }

  function create() {
    saveNotice.hide()
    setErrors({})
    setIsNew(true)
    setStep(0)
    setForm(emptyForm('journey', Math.max(0, ...products.map((p) => p.order)) + 1))
  }

  async function save(allowDrop = false) {
    if (!form) return
    setIsSaving(true)
    saveNotice.hide()
    const result = await saveProduct(form, products, backend, {
      reshape: reshapeJourney,
      allowDrop,
    })
    setIsSaving(false)
    setDropDays(null)
    if (result.kind === 'confirm-drop') {
      setIsPreviewOpen(false)
      setDropDays(result.days)
      return
    }
    if (result.kind === 'invalid') {
      setErrors(result.errors)
      setIsPreviewOpen(false)
      saveNotice.show({
        kind: 'error',
        text: result.errors.status ?? 'Faltam alguns campos. Confira as mensagens em vermelho.',
      })
      return
    }
    if (result.kind === 'error') {
      saveNotice.show({ kind: 'error', text: result.message })
      return
    }
    catalog?.replace(result.catalog)
    setProducts(result.catalog)
    setErrors({})
    setIsNew(false)
    setIsPreviewOpen(false)
    // O formulário continua aberto, agora com o id definitivo (um produto novo ganha o id ao salvar).
    // Saiu de Rascunho com conteúdo no editor: a estrutura passa a mudar só lá.
    setForm({
      ...form,
      id: result.product.id,
      structureLocked:
        form.structureLocked || (result.product.status !== 'draft' && form.hasEditorContent),
    })
    setStep(0)
    saveNotice.show({ kind: 'ok', text: 'Salvo' })
  }

  const patch = (change: Partial<ProductForm>) => setForm((f) => (f ? { ...f, ...change } : f))

  // Território novo: grava na hora e entra na lista do site; o produto só muda no "Salvar".
  const createTerritoryHere: CreateTerritory = async (name, tone) => {
    const result = await createTerritory(territories, name, tone, backend)
    if (result.kind === 'invalid') return result
    territoryStore?.replace(result.list)
    return { kind: 'created', id: result.territory.id }
  }

  // Descartar vale para o produto como está salvo, não para o que está na tela.
  const savedProduct = form && !isNew ? products.find((p) => p.id === form.id) : undefined
  // Indisponível não se edita (pedido de 2026-11-25): só "Publicar de novo", Duplicar ou Descartar.
  const isRetired = savedProduct?.status === 'retired'
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  // Sem a consulta de acessos (testes, sem Firebase) ninguém acessou; enquanto carrega, não se sabe.
  const everAccessed = savedProduct
    ? accesses
      ? hasEverHadAccess(accesses, savedProduct.id)
      : accessAdmin
        ? null
        : false
    : null

  async function remove() {
    if (!savedProduct) return
    setIsSaving(true)
    const result = await deleteProduct(savedProduct, products, backend, everAccessed)
    setIsSaving(false)
    setIsConfirmingDelete(false)
    if (result.kind === 'error') {
      saveNotice.show({ kind: 'error', text: result.message })
      return
    }
    catalog?.replace(result.catalog)
    setProducts(result.catalog)
    setForm(null)
    saveNotice.show({ kind: 'ok', text: `"${savedProduct.title}" foi descartado.` })
  }
  /** Duplica o produto como está salvo e já abre a cópia (Rascunho, "- Cópia" no nome). */
  async function duplicate() {
    if (!savedProduct) return
    setIsSaving(true)
    const result = await duplicateProduct(
      savedProduct,
      products,
      backend,
      loadBuiltInJourney,
      copyJourney,
    )
    setIsSaving(false)
    if (result.kind === 'error') {
      saveNotice.show({ kind: 'error', text: result.message })
      return
    }
    catalog?.replace(result.catalog)
    setProducts(result.catalog)
    await open(result.product)
    saveNotice.show({ kind: 'ok', text: `"${result.product.title}" criada como rascunho.` })
  }

  /** Inativar (Disponível → Indisponível) ou publicar de novo: grava na hora, como Duplicar. */
  async function changeAvailability(available: boolean) {
    if (!savedProduct) return
    setIsSaving(true)
    const result = await setAvailability(savedProduct, products, backend, available)
    setIsSaving(false)
    setIsConfirmingRetire(false)
    if (result.kind === 'error') {
      saveNotice.show({ kind: 'error', text: result.message })
      return
    }
    catalog?.replace(result.catalog)
    setProducts(result.catalog)
    const { status, retiredAt } = result.product
    setForm((f) => {
      if (!f) return f
      const next = { ...f, status }
      if (retiredAt === undefined) delete next.retiredAt
      else next.retiredAt = retiredAt
      return next
    })
    if (!available) setIsRetiredOpen(true)
    saveNotice.show({
      kind: 'ok',
      text: available
        ? `"${savedProduct.title}" está disponível de novo.`
        : `"${savedProduct.title}" ficou indisponível.`,
    })
  }

  const stats = savedProduct && accesses ? accessStats(accesses, savedProduct.id, now) : null
  const situation =
    savedProduct &&
    (savedProduct.status === 'retired' ||
      (savedProduct.status === 'published' && form?.status === 'published')) ? (
      <AvailabilityCard
        product={savedProduct}
        stats={stats}
        isBusy={isSaving}
        onRetire={() => setIsConfirmingRetire(true)}
      />
    ) : undefined
  const dropDialog = dropDays && (
    <DropDaysDialog
      days={dropDays}
      isWide={isWide}
      isBusy={isSaving}
      onConfirm={() => void save(true)}
      onClose={() => setDropDays(null)}
    />
  )
  const discardDialog = isConfirmingDelete && savedProduct && (
    <DiscardDialog
      product={savedProduct}
      isWide={isWide}
      isBusy={isSaving}
      onConfirm={() => void remove()}
      onClose={() => setIsConfirmingDelete(false)}
    />
  )
  const retireDialog = isConfirmingRetire && savedProduct && (
    <RetireDialog
      product={savedProduct}
      stats={stats}
      isWide={isWide}
      isBusy={isSaving}
      onConfirm={() => void changeAvailability(false)}
      onClose={() => setIsConfirmingRetire(false)}
    />
  )

  // Indisponível: "Publicar de novo" fica na linha dos botões, à direita de Duplicar (pedido de 2026-11-25).
  const republishControl = isRetired ? (
    <button
      type="button"
      disabled={isSaving}
      onClick={() => void changeAvailability(true)}
      className={smallAdminButton}
    >
      Publicar de novo
    </button>
  ) : null

  const duplicateControl = savedProduct ? (
    <button
      type="button"
      disabled={isSaving}
      onClick={() => void duplicate()}
      className={smallGhostButton}
    >
      <UiIcon name="copy" size={14} />
      Duplicar
    </button>
  ) : null

  // Descartar: o produto novo ainda não salvo some da tela; o salvo sai do catálogo (confirmado numa janela),
  // se estiver em Rascunho, Em breve ou Indisponível e ninguém nunca tiver acessado.
  const deleteControl = isNew ? (
    <button type="button" onClick={() => setForm(null)} className={smallGhostButton}>
      Descartar
    </button>
  ) : savedProduct && canDeleteProduct(savedProduct, everAccessed) ? (
    <button type="button" onClick={() => setIsConfirmingDelete(true)} className={smallGhostButton}>
      Descartar
    </button>
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
        {onAir.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            isActive={!!form && form.id === product.id}
            compact={!isWide}
            onSelect={() => void open(product)}
          />
        ))}
      </ul>
      {retired.length > 0 && (
        <>
          {/* Separador do mock 2-A (título em caixa alta + linha), que abre e fecha pela seta no fim. */}
          <button
            type="button"
            aria-expanded={isRetiredOpen}
            onClick={() => setIsRetiredOpen((open) => !open)}
            className="flex w-full items-center gap-2 rounded-lg px-3 pt-3 pb-1 text-[11px] font-semibold tracking-[0.18em] text-ink-faint uppercase transition-colors hover:text-admin-ink"
          >
            <span>Indisponíveis · {retired.length}</span>
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
            <span
              className={`transition-transform duration-200 motion-reduce:transition-none ${isRetiredOpen ? 'rotate-180' : ''}`}
            >
              <UiIcon name="down" size={16} />
            </span>
          </button>
          {isRetiredOpen && (
            <ul className="flex animate-[fade-in_250ms_ease-out] flex-col gap-1 motion-reduce:animate-none">
              {retired.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isActive={!!form && form.id === product.id}
                  compact={!isWide}
                  onSelect={() => void open(product)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )

  const noticeLine = saveNotice.notice && (
    <SaveStatus notice={saveNotice.notice} isVisible={saveNotice.isVisible} />
  )

  // Os dias (ou temas) de uma jornada se editam no editor da jornada, já montado pela estrutura.
  const contentLink =
    form && form.kind === 'journey' && !isNew && !isRetired ? (
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
                territories={territories}
                onCreateTerritory={createTerritoryHere}
                parts={
                  isNew
                    ? ['tipo', 'conteudo', 'preco', 'situacao']
                    : ['conteudo', 'preco', 'situacao']
                }
                isNew={isNew}
                onPickBanner={(file) => void pickBanner(file)}
                bannerState={bannerState}
                situation={situation}
                wasPublished={!!savedProduct && wasPublished(savedProduct.status)}
                readOnly={isRetired}
              />
              {/* À esquerda o link e o aviso; à direita os botões, sempre juntos e na mesma ordem. */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <span className="flex min-w-0 flex-1 basis-48 flex-wrap items-center gap-x-4 gap-y-1">
                  {contentLink}
                  {noticeLine}
                </span>
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  {duplicateControl}
                  {deleteControl}
                  {republishControl}
                  {/* Indisponível não se edita: sem prévia nem Salvar. */}
                  {!isRetired && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsPreviewOpen(true)}
                        className={smallGhostButton}
                      >
                        Ver como fica no hub
                      </button>
                      <button
                        type="button"
                        onClick={() => void save()}
                        disabled={isSaving}
                        className={smallAdminButton}
                      >
                        {isSaving ? 'Salvando…' : 'Salvar'}
                      </button>
                    </>
                  )}
                </div>
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
        {retireDialog}
        {discardDialog}
        {dropDialog}
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
        className="-ml-1 inline-flex items-center gap-1.5 self-start rounded-full border border-line py-1 pr-3.5 pl-2 text-sm text-ink-muted transition-[color,background-color,border-color,transform] duration-200 hover:border-admin-ink/60 hover:bg-admin/8 hover:text-admin-ink active:scale-[0.97] motion-reduce:transition-none"
      >
        <ArrowLeft aria-hidden size={16} />
        Produtos
      </button>
      <h1 className="font-display text-[1.6rem] text-ink">
        {form.title || (isNew ? 'Novo produto' : 'Produto')}
      </h1>
      {contentLink}
      {step === 0 && (duplicateControl || deleteControl) && (
        <span className="flex flex-wrap items-center gap-2">
          {duplicateControl}
          {deleteControl}
          {republishControl}
        </span>
      )}
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
          territories={territories}
          onCreateTerritory={createTerritoryHere}
          parts={[current.id]}
          isNew={isNew}
          onPickBanner={(file) => void pickBanner(file)}
          bannerState={bannerState}
          situation={situation}
          wasPublished={!!savedProduct && wasPublished(savedProduct.status)}
          readOnly={isRetired}
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
          isRetired ? null : (
            <button
              type="button"
              onClick={() => void save()}
              disabled={isSaving}
              className={adminButton}
            >
              {isSaving ? 'Salvando…' : 'Salvar'}
            </button>
          )
        ) : (
          <button type="button" onClick={() => setStep(step + 1)} className={adminButton}>
            Continuar →
          </button>
        )}
      </div>
      {retireDialog}
      {discardDialog}
      {dropDialog}
    </div>
  )
}
