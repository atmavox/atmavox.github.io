import { useId, useRef, useState, type FormEvent } from 'react'
import { formatPhone } from '../../../shared/ativacao/answers'
import { compressAvatarInBrowser, type ImageCompressor } from '../../../shared/media/compressImage'
import {
  PROFILE_FIELDS,
  PROFILE_HINTS,
  PROFILE_LABELS,
  birthDateLabel,
  normalizeField,
  profileFieldError,
  type PersonProfile,
  type ProfileField,
} from '../../../shared/profile/profile'
import { REQUIRED_MARK } from '../../../shared/ui/requiredMark'
import { UiIcon } from '../../../shared/ui/UiIcon'

const inputClass =
  'min-h-11 w-full min-w-0 rounded-xl border border-accent bg-field px-3.5 py-2 text-ink focus:outline-none'
const textButton = 'shrink-0 text-sm font-medium text-accent hover:underline'

function shown(field: ProfileField, value: string): string {
  if (!value) return ''
  if (field === 'birthDate') return birthDateLabel(value)
  if (field === 'phone') return formatPhone(value)
  return value
}

/**
 * "Meus dados" na aba Conta (mock aprovado `atmavox-cadastro.html`, Conta C): uma lista calma para
 * conferir, com "Editar" que abre só aquele campo na própria linha. A caixinha de novidades fica
 * pequena, no fim do cartão.
 */
export function MyDataCard({
  profile,
  email,
  today,
  onSave,
  compress = compressAvatarInBrowser,
}: {
  profile: PersonProfile
  email: string | null
  /** `AAAA-MM-DD`, para não aceitar nascimento no futuro. */
  today: string
  onSave: (change: Partial<PersonProfile>) => Promise<boolean>
  compress?: ImageCompressor
}) {
  const ids = { photo: useId(), news: useId(), status: useId() }
  const [editing, setEditing] = useState<ProfileField | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function open(field: ProfileField) {
    setEditing(field)
    setDraft(profile[field])
    setError(null)
    setStatus(null)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    const problem = profileFieldError(editing, draft, today)
    if (problem) {
      setError(problem)
      return
    }
    setIsSaving(true)
    const ok = await onSave({ [editing]: normalizeField(editing, draft) })
    setIsSaving(false)
    if (!ok) {
      setError('Não deu para salvar agora. Confira a internet e tente de novo.')
      return
    }
    setEditing(null)
    setStatus('Salvo.')
  }

  async function choosePhoto(file: File | undefined) {
    if (!file) return
    setStatus('Preparando a foto…')
    try {
      const { dataUrl } = await compress(file)
      setStatus((await onSave({ photo: dataUrl })) ? 'Foto salva.' : 'Não deu para salvar a foto.')
    } catch {
      setStatus('Não deu para usar esta imagem. Tente outra foto.')
    }
  }

  async function toggleNews(news: boolean) {
    const ok = await onSave({ news })
    setStatus(ok ? null : 'Não deu para salvar a sua escolha agora.')
  }

  return (
    <section
      aria-label="Meus dados"
      className="flex flex-col rounded-[22px] border border-line bg-surface p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">
          Meus dados
        </h2>
        <span className="flex items-center gap-4">
          {profile.photo && (
            <button
              type="button"
              onClick={() => void onSave({ photo: '' }).then(() => setStatus('Foto removida.'))}
              className="text-sm text-ink-faint hover:text-accent"
            >
              Remover foto
            </button>
          )}
          <label
            htmlFor={ids.photo}
            className={`inline-flex cursor-pointer items-center gap-1.5 ${textButton}`}
          >
            <UiIcon name="camera" size={16} />
            {profile.photo ? 'Trocar foto' : 'Pôr uma foto'}
          </label>
          <input
            ref={fileRef}
            id={ids.photo}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              void choosePhoto(e.target.files?.[0])
              if (fileRef.current) fileRef.current.value = ''
            }}
          />
        </span>
      </div>

      <ul className="mt-2 flex flex-col">
        {PROFILE_FIELDS.map((field) => {
          const value = shown(field, profile[field])
          const label = PROFILE_LABELS[field].replace(/\?$/, '')
          if (editing === field) {
            const errorId = `${ids.status}-${field}`
            return (
              <li key={field} className="border-b border-line py-3">
                <form onSubmit={(e) => void save(e)} className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`${ids.status}-input`}
                    className={`text-sm text-ink-faint ${REQUIRED_MARK}`}
                  >
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`${ids.status}-input`}
                      // A pessoa tocou em "Editar": o campo já abre pronto para escrever.
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      aria-required="true"
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? errorId : undefined}
                      type={field === 'birthDate' ? 'date' : field === 'phone' ? 'tel' : 'text'}
                      {...(field === 'phone'
                        ? { inputMode: 'tel' as const, autoComplete: 'tel' }
                        : field === 'fullName'
                          ? { autoComplete: 'name' }
                          : field === 'birthDate'
                            ? { max: today, autoComplete: 'bday' }
                            : {})}
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value)
                        setError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditing(null)
                      }}
                      className={inputClass}
                    />
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-accent px-4 font-semibold text-bg hover:opacity-90 disabled:opacity-60"
                    >
                      {isSaving ? 'Salvando…' : 'Salvar'}
                    </button>
                  </div>
                  {error ? (
                    <p id={errorId} className="text-sm text-accent">
                      {error}
                    </p>
                  ) : (
                    PROFILE_HINTS[field] && (
                      <p className="text-xs text-ink-faint">{PROFILE_HINTS[field]}</p>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="self-start text-sm text-ink-faint hover:text-accent"
                  >
                    Cancelar
                  </button>
                </form>
              </li>
            )
          }
          return (
            <li
              key={field}
              className="flex items-center justify-between gap-3 border-b border-line py-3"
            >
              <span className="min-w-0">
                <span className={`block text-sm text-ink-faint ${REQUIRED_MARK}`}>{label}</span>
                {value ? (
                  <span className="block text-ink">{value}</span>
                ) : (
                  <span className="block text-ink-faint italic">Falta preencher</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => open(field)}
                aria-label={`${value ? 'Editar' : 'Preencher'} ${label.toLowerCase()}`}
                className={textButton}
              >
                {value ? 'Editar' : 'Preencher'}
              </button>
            </li>
          )
        })}
        <li className="flex flex-col py-3">
          <span className="text-sm text-ink-faint">E-mail</span>
          <span className="break-all text-ink">{email ?? '—'}</span>
        </li>
      </ul>

      <label
        htmlFor={ids.news}
        className="flex cursor-pointer items-center gap-2 border-t border-line pt-3 text-[13px] text-ink-faint"
      >
        <input
          id={ids.news}
          type="checkbox"
          checked={profile.news}
          onChange={(e) => void toggleNews(e.target.checked)}
          className="size-3.5 shrink-0 accent-[var(--accent)]"
        />
        Receber novidades da Andreía pelo WhatsApp
      </label>

      <p role="status" className="mt-2 min-h-5 text-sm text-ink-muted">
        {status}
      </p>
    </section>
  )
}
