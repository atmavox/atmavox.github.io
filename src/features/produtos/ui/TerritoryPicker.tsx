import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  BANNER_TONES,
  matchesTerritory,
  territoryOf,
  territorySlug,
  TONE_LABELS,
  type BannerTone,
  type Territory,
} from '../../../shared/catalog/territories'
import { useMediaQuery } from '../../../shared/lib/useMediaQuery'
import { UiIcon } from '../../../shared/ui/UiIcon'
import { inputClass } from './styles'

export type CreateTerritory = (
  name: string,
  tone: BannerTone,
) => Promise<{ kind: 'created'; id: string } | { kind: 'invalid'; error: string }>

interface TerritoryPickerProps {
  value: string
  territories: readonly Territory[]
  onChange: (id: string) => void
  onCreate: CreateTerritory
}

const swatch = (tone: BannerTone, className = 'size-[18px] rounded-md') => (
  <span
    aria-hidden="true"
    className={`shrink-0 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)] ${className}`}
    style={{ backgroundImage: `var(--tone-${tone})` }}
  />
)

const fieldButton =
  'flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-line bg-field px-3 text-left text-ink transition-colors hover:border-admin aria-expanded:border-admin'

/** As 6 cores dos banners em bolinhas (escolha de um território novo, computador). */
function ToneDots({ tone, onPick }: { tone: BannerTone; onPick: (tone: BannerTone) => void }) {
  return (
    <div role="radiogroup" aria-label="Cor do banner" className="flex flex-wrap gap-2">
      {BANNER_TONES.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={tone === t}
          aria-label={TONE_LABELS[t]}
          title={TONE_LABELS[t]}
          onClick={() => onPick(t)}
          className={`size-7 rounded-full transition-[transform,box-shadow] duration-150 hover:scale-110 ${
            tone === t
              ? 'shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--admin)]'
              : 'shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)]'
          }`}
          style={{ backgroundImage: `var(--tone-${t})` }}
        />
      ))}
    </div>
  )
}

/** Computador (mock v2, opção A): o menu abre com "Buscar ou criar"; nome novo vira "Criar «…»". */
function DesktopPicker({ value, territories, onChange, onCreate }: TerritoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [tone, setTone] = useState<BannerTone>('dusk')
  const [active, setActive] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const current = territoryOf(territories, value)
  const results = territories.filter((t) => matchesTerritory(t, query))
  const clean = query.trim()
  const cleanId = territorySlug(clean)
  // Nome que ainda não existe (sem contar acento e maiúscula): oferece criar.
  const isNew =
    cleanId !== '' &&
    !territories.some((t) => t.id === cleanId || territorySlug(t.name) === cleanId)

  useEffect(() => {
    if (!isOpen) return
    // Abriu o menu: o cursor vai direto para a busca (quem abriu quer escolher ou criar).
    searchRef.current?.focus()
    const onDown = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [isOpen])

  function open() {
    setQuery('')
    setActive(
      Math.max(
        0,
        territories.findIndex((t) => t.id === value),
      ),
    )
    setError(null)
    setIsOpen(true)
  }

  function pick(id: string) {
    onChange(id)
    setIsOpen(false)
  }

  async function create() {
    setIsCreating(true)
    const result = await onCreate(clean, tone)
    setIsCreating(false)
    if (result.kind === 'invalid') {
      setError(result.error)
      return
    }
    pick(result.id)
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActive((i) => Math.min(results.length - 1, Math.max(0, i + delta)))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const chosen = results[active]
      if (isNew && results.length === 0) void create()
      else if (chosen) pick(chosen.id)
    }
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        className={fieldButton}
      >
        {swatch(current.tone)}
        <span className="min-w-0 truncate">{current.name}</span>
        <span
          className={`ml-auto text-ink-faint transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <UiIcon name="down" />
        </span>
      </button>
      {isOpen && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-30 animate-[menu-in_200ms_ease-out] rounded-2xl border border-line bg-surface p-1.5 shadow-[0_16px_40px_rgb(20_14_10/0.2)]">
          <div className="mb-1 flex items-center gap-2 border-b border-line px-2 pb-1.5 text-ink-faint">
            <UiIcon name="search" size={17} />
            <input
              ref={searchRef}
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-label="Buscar ou criar território"
              placeholder="Buscar ou criar território"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
                setError(null)
              }}
              onKeyDown={onKey}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
          <ul id={listId} role="listbox" aria-label="Territórios" className="flex flex-col">
            {results.map((t, index) => (
              <li key={t.id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={t.id === value}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(t.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    index === active ? 'bg-admin/10' : ''
                  }`}
                >
                  {swatch(t.tone)}
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                  {t.id === value && (
                    <span className="text-admin-ink">
                      <UiIcon name="check" />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {isNew ? (
            <div className="mt-1 flex animate-[fade-in_200ms_ease-out] flex-col gap-2.5 rounded-xl bg-admin/7 p-2.5">
              <span className="flex items-center gap-1.5 font-semibold text-admin-ink">
                <UiIcon name="plus" size={17} />
                Criar «{clean}»
              </span>
              <span className="text-xs text-ink-faint">Escolha a cor do banner:</span>
              <ToneDots tone={tone} onPick={setTone} />
              {error && <p className="text-sm text-accent">{error}</p>}
              <button
                type="button"
                disabled={isCreating}
                onClick={() => void create()}
                className="self-start rounded-full bg-admin px-4 py-1.5 text-sm font-semibold text-on-admin hover:opacity-90 disabled:opacity-60"
              >
                {isCreating ? 'Criando…' : 'Criar e escolher'}
              </button>
            </div>
          ) : (
            results.length === 0 || (
              <p className="px-2.5 pt-1 pb-1.5 text-xs text-ink-faint">
                Digite um nome que ainda não existe para criar um território.
              </p>
            )
          )}
        </div>
      )}
    </div>
  )
}

/** Celular (mock v2, opção C): a lista sobe de baixo; "+ Novo território" desliza para o segundo passo. */
function PhonePicker({ value, territories, onChange, onCreate }: TerritoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'list' | 'new'>('list')
  const [wentBack, setWentBack] = useState(false)
  const [name, setName] = useState('')
  const [tone, setTone] = useState<BannerTone>('dusk')
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const titleId = useId()
  const current = territoryOf(territories, value)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  function open() {
    setStep('list')
    setWentBack(false)
    setIsOpen(true)
  }

  async function create() {
    setIsCreating(true)
    const result = await onCreate(name, tone)
    setIsCreating(false)
    if (result.kind === 'invalid') {
      setError(result.error)
      return
    }
    onChange(result.id)
    setIsOpen(false)
  }

  const preview = name.trim() || 'Nome'

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={open}
        className={fieldButton}
      >
        {swatch(current.tone)}
        <span className="min-w-0 truncate">{current.name}</span>
        <span className="ml-auto text-ink-faint">
          <UiIcon name="down" />
        </span>
      </button>
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <div
              aria-hidden="true"
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 animate-[fade-in_250ms_ease-out] bg-[rgb(20_14_10/0.4)]"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="absolute inset-x-0 bottom-0 max-h-[90dvh] animate-[sheet-up_300ms_ease-out] overflow-y-auto rounded-t-[26px] bg-surface px-4 pt-2.5"
              style={{ paddingBottom: 'calc(22px + env(safe-area-inset-bottom))' }}
            >
              <span
                aria-hidden="true"
                className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line"
              />
              {step === 'list' ? (
                <div
                  key="list"
                  className={wentBack ? 'animate-[step-back_300ms_cubic-bezier(.2,.7,.2,1)]' : ''}
                >
                  <h2 id={titleId} className="mx-1.5 mb-2 font-display text-[1.35rem] text-ink">
                    Território
                  </h2>
                  <ul className="flex flex-col">
                    {territories.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          aria-pressed={t.id === value}
                          onClick={() => {
                            onChange(t.id)
                            setIsOpen(false)
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[1.02rem] ${
                            t.id === value ? 'bg-admin/10' : ''
                          }`}
                        >
                          {swatch(t.tone, 'size-6 rounded-lg')}
                          <span className="min-w-0 flex-1 truncate">{t.name}</span>
                          {t.id === value && (
                            <span className="text-admin-ink">
                              <UiIcon name="check" />
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <hr className="mx-1 my-1.5 border-line" />
                  <button
                    type="button"
                    onClick={() => {
                      setName('')
                      setError(null)
                      setStep('new')
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-3 font-semibold text-admin-ink"
                  >
                    <UiIcon name="plus" />
                    Novo território
                  </button>
                </div>
              ) : (
                <div
                  key="new"
                  className="flex animate-[step-in_300ms_cubic-bezier(.2,.7,.2,1)] flex-col gap-3.5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setWentBack(true)
                      setStep('list')
                    }}
                    className="inline-flex items-center gap-1 self-start py-1 text-sm text-ink-muted"
                  >
                    <UiIcon name="back" size={17} />
                    Territórios
                  </button>
                  <h2 id={titleId} className="font-display text-[1.35rem] text-ink">
                    Novo território
                  </h2>
                  <input
                    aria-label="Nome do território"
                    placeholder="Nome (ex.: Corpo)"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      setError(null)
                    }}
                    className={inputClass}
                  />
                  {error && <p className="text-sm text-accent">{error}</p>}
                  <span className="text-sm text-ink-muted">Cor do banner</span>
                  <div
                    role="radiogroup"
                    aria-label="Cor do banner"
                    className="grid grid-cols-3 gap-2.5"
                  >
                    {BANNER_TONES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={tone === t}
                        onClick={() => setTone(t)}
                        className={`flex flex-col gap-1 text-xs ${tone === t ? 'font-medium text-ink' : 'text-ink-faint'}`}
                      >
                        <span
                          className={`flex aspect-video items-end rounded-[10px] p-1.5 transition-shadow duration-150 ${
                            tone === t
                              ? 'shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--admin)]'
                              : 'shadow-[inset_0_0_0_1px_rgb(255_255_255/0.15)]'
                          }`}
                          style={{ backgroundImage: `var(--tone-${t})` }}
                        >
                          <span className="max-w-full truncate rounded-full bg-black/30 px-1.5 text-[0.66rem] text-[#f3e9dc]">
                            {preview}
                          </span>
                        </span>
                        {TONE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={isCreating}
                    onClick={() => void create()}
                    className="mt-1 min-h-12 rounded-full bg-admin font-semibold text-on-admin disabled:opacity-60"
                  >
                    {isCreating ? 'Criando…' : 'Criar território'}
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

/** O território do produto (mock `Downloads/atmavox-territorio-v2.html`): A no computador, C no celular. */
export function TerritoryPicker(props: TerritoryPickerProps) {
  const isWide = useMediaQuery('(min-width: 900px)')
  return isWide ? <DesktopPicker {...props} /> : <PhonePicker {...props} />
}
