import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { formatPhone, whatsAppDigits } from '../../../shared/ativacao/answers'
import { buildWhatsAppLink } from '../../../shared/lib/whatsapp'
import { EMPTY_PROFILE } from '../../../shared/profile/profile'
import { UiIcon } from '../../../shared/ui/UiIcon'
import {
  CLOSING_BACKDROP,
  CLOSING_DRAWER,
  CLOSING_SHEET,
  useClosing,
} from '../../../shared/ui/useClosing'
import { ageOn, personName, shortDate, type PersonRow } from '../domain/people'
import { AdminTag } from './AdminTag'

export interface PersonAccess {
  key: string
  title: string
  term: string
}

/**
 * A ficha de uma pessoa (mock aprovado `atmavox-acessos-pessoas.html`, C): entra pela direita no
 * computador e sobe de baixo no celular. Todos os dados, o WhatsApp, os acessos dela e "Liberar
 * acesso para ela" (preenche o e-mail lá em cima).
 */
export function PersonDrawer({
  person,
  accesses,
  today,
  isWide,
  onGrant,
  onClose,
}: {
  person: PersonRow
  accesses: readonly PersonAccess[]
  today: string
  isWide: boolean
  onGrant: () => void
  onClose: () => void
}) {
  const titleId = useId()
  const { isClosing, requestClose } = useClosing(onClose)
  const closeRef = useRef<HTMLButtonElement>(null)
  const profile = person.profile ?? EMPTY_PROFILE
  const name = personName(person)
  const age = ageOn(profile.birthDate, today)
  const whatsapp = whatsAppDigits(profile.phone)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [requestClose])

  const row = (label: string, value: ReactNode) => (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm">
      <span className="text-ink-faint">{label}</span>
      <span className="min-w-0 text-right break-all text-ink">{value}</span>
    </div>
  )

  return createPortal(
    <div
      className={`fixed inset-0 z-50 bg-[color-mix(in_oklab,var(--bg)_35%,rgb(20_14_10/0.35))] ${
        isClosing ? CLOSING_BACKDROP : 'animate-[fade-in_250ms_ease-out]'
      }`}
    >
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={requestClose}
        className="absolute inset-0 cursor-default"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute flex flex-col gap-3 overflow-y-auto border-line bg-surface p-5 shadow-[0_20px_50px_rgb(20_14_10/0.25)] ${
          isWide
            ? `inset-y-0 right-0 w-[380px] border-l ${isClosing ? CLOSING_DRAWER : 'animate-[drawer-in_320ms_cubic-bezier(.2,.8,.2,1)]'}`
            : `inset-x-0 bottom-0 max-h-[82dvh] rounded-t-[24px] pb-[calc(1.25rem+env(safe-area-inset-bottom))] ${isClosing ? CLOSING_SHEET : 'animate-[sheet-up_360ms_cubic-bezier(.2,.8,.2,1)]'}`
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-accent/20 font-display text-xl text-accent">
              {profile.photo ? (
                <img src={profile.photo} alt="" className="size-full object-cover" />
              ) : (
                (profile.nickname || name || person.email).charAt(0).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="flex items-center gap-2 font-display text-xl text-ink">
                {name}
                {person.isAdmin && <AdminTag />}
              </h2>
              {profile.nickname && <p className="text-sm text-ink-faint">{profile.nickname}</p>}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={requestClose}
            aria-label="Fechar"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-field text-ink-muted hover:text-ink"
          >
            <UiIcon name="close" size={17} />
          </button>
        </div>

        <div>
          {row('E-mail', person.email)}
          {row(
            'Celular',
            profile.phone ? (
              <span className="text-ok">{formatPhone(profile.phone)}</span>
            ) : (
              <span className="text-ink-faint">Não informado</span>
            ),
          )}
          {row(
            'Nascimento',
            profile.birthDate ? (
              `${shortDate(profile.birthDate)}${age !== null ? ` · ${age} anos` : ''}`
            ) : (
              <span className="text-ink-faint">Não informado</span>
            ),
          )}
          {row(
            'Novidades',
            profile.news ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-ok/14 px-2.5 py-0.5 text-xs font-semibold text-ok">
                <UiIcon name="check" size={13} />
                Aceita
              </span>
            ) : (
              <span className="text-ink-faint">Não aceita</span>
            ),
          )}
        </div>

        {whatsapp && (
          <a
            href={buildWhatsAppLink(whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ok px-5 font-semibold text-bg hover:opacity-90"
          >
            <UiIcon name="chat" size={17} />
            Conversar no WhatsApp
          </a>
        )}

        <h3 className="mt-2 text-xs font-semibold tracking-[0.2em] text-admin-ink uppercase">
          Acessos
        </h3>
        {accesses.length ? (
          <div>
            {accesses.map((access) => (
              <div key={access.key}>{row(access.title, access.term)}</div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-faint">Nenhum acesso liberado.</p>
        )}
        <button
          type="button"
          onClick={() => {
            onGrant()
            requestClose()
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-5 text-ink-muted hover:border-admin-ink hover:text-admin-ink"
        >
          Liberar acesso para {profile.nickname || 'esta pessoa'}
        </button>
      </aside>
    </div>,
    document.body,
  )
}
