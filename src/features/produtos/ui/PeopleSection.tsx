import { useId, useState } from 'react'
import { localDate } from '../../../shared/ativacao/availability'
import { useNow } from '../../../shared/lib/useNow'
import { EMPTY_PROFILE, isProfileComplete } from '../../../shared/profile/profile'
import { UiIcon } from '../../../shared/ui/UiIcon'
import {
  PEOPLE_FILTERS,
  countByFilter,
  filterPeople,
  newsPhones,
  peopleCsv,
  personName,
  type PeopleFilter,
  type PersonRow,
} from '../domain/people'
import { Section } from './fields'
import { inputClass } from './styles'
import { PersonDrawer, type PersonAccess } from './PersonDrawer'

const chip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-[13px] transition-colors ${
    on
      ? 'border-transparent bg-admin font-medium text-on-admin'
      : 'border-line bg-field text-ink-muted hover:text-admin-ink'
  }`

/** Baixa a planilha pelo navegador (com o BOM do UTF-8, para o Excel mostrar os acentos). */
function download(csv: string, today: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `atmavox-pessoas-${today}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Pessoas (mock aprovado `atmavox-acessos-pessoas.html`, C, com busca também no celular): lista curta
 * com nome, e-mail e etiquetas; tocar abre a ficha. "Copiar celulares" leva os de quem aceitou
 * novidades (para uma lista de transmissão do WhatsApp) e "Baixar planilha", a lista filtrada.
 */
export function PeopleSection({
  people,
  accessesOf,
  isWide,
  onGrant,
}: {
  people: readonly PersonRow[] | null
  accessesOf: (uid: string) => PersonAccess[]
  isWide: boolean
  /** "Liberar acesso para ela": preenche o e-mail no formulário de cima. */
  onGrant: (person: PersonRow) => void
}) {
  const today = localDate(useNow())
  const searchId = useId()
  const [filter, setFilter] = useState<PeopleFilter>('todas')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<PersonRow | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  if (!people) return null
  const shown = filterPeople(people, filter, query, today)
  const counts = countByFilter(people, today)
  const phones = newsPhones(shown)

  async function copyPhones() {
    try {
      await navigator.clipboard.writeText(phones.join('\n'))
      setStatus(
        `${phones.length} ${phones.length === 1 ? 'celular copiado' : 'celulares copiados'}. Cole na lista de transmissão do WhatsApp.`,
      )
    } catch {
      setStatus('Não deu para copiar. Baixe a planilha e copie de lá.')
    }
  }

  return (
    <Section title="Pessoas">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar pessoas">
          {PEOPLE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={chip(filter === f.id)}
            >
              {f.label} · {counts[f.id]}
            </button>
          ))}
        </div>
        <label htmlFor={searchId} className="relative w-full sm:w-72">
          <span className="sr-only">Buscar pessoa</span>
          <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-ink-faint">
            <UiIcon name="search" size={16} />
          </span>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nome, e-mail ou celular"
            className={`${inputClass} pl-9`}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyPhones()}
          disabled={phones.length === 0}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-admin px-4 text-sm font-semibold text-on-admin hover:opacity-90 disabled:opacity-50"
        >
          <UiIcon name="copy" size={15} />
          Copiar celulares ({phones.length})
        </button>
        <button
          type="button"
          onClick={() => download(peopleCsv(shown, today), today)}
          disabled={shown.length === 0}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm text-ink-muted hover:border-admin-ink hover:text-admin-ink disabled:opacity-50"
        >
          Baixar planilha
        </button>
      </div>
      {status && (
        <p role="status" className="text-sm text-ink-muted">
          {status}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="text-ink-muted">
          {people.length === 0 ? 'Ninguém entrou no site ainda.' : 'Ninguém encontrado.'}
        </p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((person) => {
            const profile = person.profile ?? EMPTY_PROFILE
            const name = personName(person)
            const complete = isProfileComplete(profile, today)
            return (
              <li key={person.uid}>
                <button
                  type="button"
                  onClick={() => setOpen(person)}
                  aria-label={`Abrir a ficha de ${name === 'Sem nome' ? person.email : name}`}
                  className={`flex w-full items-center justify-between gap-3 border-b border-line px-1.5 py-2.5 text-left transition-colors hover:bg-admin/8 ${
                    open?.uid === person.uid ? 'rounded-xl bg-admin/10' : ''
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-accent/20 font-display text-accent">
                      {profile.photo ? (
                        <img src={profile.photo} alt="" className="size-full object-cover" />
                      ) : (
                        (profile.nickname || name || person.email).charAt(0).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0">
                      <b
                        className={`block truncate font-medium ${name === 'Sem nome' ? 'text-ink-faint italic' : 'text-ink'}`}
                      >
                        {name}
                      </b>
                      <span className="block truncate text-xs text-ink-faint">{person.email}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {!complete && (
                      <span className="rounded-full bg-accent/13 px-2.5 py-0.5 text-xs font-semibold text-accent">
                        {isWide ? 'Cadastro incompleto' : 'Incompleto'}
                      </span>
                    )}
                    {profile.news && (
                      <span
                        title="Aceita novidades"
                        className="inline-flex items-center rounded-full bg-ok/14 px-2 py-0.5 text-ok"
                      >
                        <UiIcon name="check" size={13} />
                        <span className="sr-only">Aceita novidades</span>
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {open && (
        <PersonDrawer
          person={open}
          accesses={accessesOf(open.uid)}
          today={today}
          isWide={isWide}
          onGrant={() => onGrant(open)}
          onClose={() => setOpen(null)}
        />
      )}
    </Section>
  )
}
