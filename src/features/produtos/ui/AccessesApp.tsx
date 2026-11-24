import { useCallback, useEffect, useState } from 'react'
import type { Product } from '../../../shared/catalog/product'
import { useAuthSession } from '../../../shared/auth/AuthContext'
import { useNow } from '../../../shared/lib/useNow'
import { markAdmins } from '../domain/people'
import { expiresAtFor, isEmail, termLabel, type TermChoice } from '../domain/accessGrant'
import type { AccessAdmin, GrantedAccess, Person } from '../infrastructure/accessAdmin'
import { Field, Section } from './fields'
import { inputClass } from './styles'
import { LoadingNote } from '../../../shared/ui/LoadingNote'
import { useMediaQuery } from '../../../shared/lib/useMediaQuery'
import { PeopleSection } from './PeopleSection'

const adminButton =
  'inline-flex min-h-[42px] items-center justify-center rounded-full bg-admin px-5 text-sm font-semibold whitespace-nowrap text-on-admin hover:opacity-90 disabled:opacity-60'

interface Row extends GrantedAccess {
  email: string
  title: string
}

/** Acessos (mock aprovado): liberar à mão por e-mail, ver os liberados, revogar ou renovar. */
export function AccessesApp({
  admin,
  products,
}: {
  admin: AccessAdmin
  products: readonly Product[]
}) {
  const now = useNow()
  // Quem usa o Modo Andreía é admin: aparece marcada mesmo antes de as regras deixarem listar `admins`.
  const myUid = useAuthSession().state?.user?.uid ?? null
  const [email, setEmail] = useState('')
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [term, setTerm] = useState<TermChoice>('produto')
  const [until, setUntil] = useState('')
  const [person, setPerson] = useState<Person | null | 'unknown'>('unknown')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [people, setPeople] = useState<Person[] | null>(null)
  const isWide = useMediaQuery('(min-width: 900px)')
  const [notice, setNotice] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)

  /** Busca as pessoas e os acessos (já com o e-mail e o nome do produto); `null` se não deu. */
  const fetchRows = useCallback(async (): Promise<{ rows: Row[]; people: Person[] } | null> => {
    try {
      const [people, accesses] = await Promise.all([admin.listPeople(), admin.listAccesses()])
      const emails = new Map(people.map((p) => [p.uid, p.email]))
      const rows = accesses
        .map((a) => ({
          ...a,
          email: emails.get(a.uid) ?? a.uid,
          title: products.find((p) => p.id === a.productId)?.title ?? a.productId,
        }))
        .sort((a, b) => b.grantedAt - a.grantedAt)
      return { rows, people }
    } catch {
      return null
    }
  }, [admin, products])

  const showRows = useCallback((result: { rows: Row[]; people: Person[] } | null) => {
    setRows(result?.rows ?? [])
    setPeople(result?.people ?? [])
    if (!result) setNotice('Não foi possível carregar os acessos. Verifique sua internet.')
  }, [])

  const load = async () => showRows(await fetchRows())

  useEffect(() => {
    let cancelled = false
    void fetchRows().then((result) => {
      if (!cancelled) showRows(result)
    })
    return () => {
      cancelled = true
    }
  }, [fetchRows, showRows])
  async function lookup() {
    if (!isEmail(email)) {
      setPerson('unknown')
      return
    }
    setPerson((await admin.findByEmail(email).catch(() => null)) ?? null)
  }

  async function grant() {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    if (!isEmail(email)) {
      setNotice('Digite um e-mail válido.')
      return
    }
    const found =
      person !== 'unknown' && person ? person : await admin.findByEmail(email).catch(() => null)
    setPerson(found)
    if (!found) {
      setNotice('Ninguém com esse e-mail entrou no site ainda. Peça para a pessoa entrar uma vez.')
      return
    }
    const expiresAt = expiresAtFor(term, product, Date.now(), until)
    if (expiresAt === undefined) {
      setNotice('Escolha uma data a partir de hoje.')
      return
    }
    setIsBusy(true)
    try {
      await admin.grant(found.uid, product.id, expiresAt)
      setNotice(
        `Acesso liberado para ${found.email}: ${product.title}, ${termLabel(expiresAt, Date.now())}.`,
      )
      await load()
    } catch {
      setNotice('Não foi possível liberar agora. Tente de novo.')
    } finally {
      setIsBusy(false)
    }
  }

  async function revoke(row: Row) {
    setConfirming(null)
    try {
      await admin.revoke(row.uid, row.productId)
      setNotice(`Acesso revogado: ${row.email}, ${row.title}.`)
      await load()
    } catch {
      setNotice('Não foi possível revogar agora. Tente de novo.')
    }
  }

  function renew(row: Row) {
    setEmail(row.email)
    setProductId(row.productId)
    setTerm('produto')
    setPerson({ uid: row.uid, email: row.email, name: '' })
    setNotice('Confira o prazo e toque em "Liberar" para renovar.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl animate-[page-in_400ms_ease-out] flex-col gap-4.5 p-4 sm:p-7">
      <h1 className="font-display text-[1.6rem] text-ink sm:text-[2rem]">Acessos</h1>

      <Section title="Liberar um acesso">
        <div className="grid gap-3.5 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-end">
          <Field label="E-mail da pessoa">
            {(props) => (
              <input
                {...props}
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setPerson('unknown')
                }}
                onBlur={() => void lookup()}
                className={inputClass}
              />
            )}
          </Field>
          <Field label="Produto">
            {(props) => (
              <select
                {...props}
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className={inputClass}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Prazo">
            {(props) => (
              <select
                {...props}
                value={term}
                onChange={(e) => setTerm(e.target.value as TermChoice)}
                className={inputClass}
              >
                <option value="produto">O do produto</option>
                <option value="sempre">Para sempre</option>
                <option value="ate">Até uma data</option>
              </select>
            )}
          </Field>
          <button
            type="button"
            onClick={() => void grant()}
            disabled={isBusy}
            className={adminButton}
          >
            {isBusy ? 'Liberando…' : 'Liberar'}
          </button>
        </div>
        {term === 'ate' && (
          <Field label="Vale até">
            {(props) => (
              <input
                {...props}
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                className={`${inputClass} sm:w-56`}
              />
            )}
          </Field>
        )}
        {person !== 'unknown' && (
          <p className="text-sm">
            {person ? (
              <span className="font-semibold text-ok">
                ✓ {person.name || person.email} tem conta no site.
              </span>
            ) : (
              <span className="text-accent">
                Ninguém com esse e-mail entrou no site ainda. Peça para a pessoa entrar uma vez.
              </span>
            )}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-ink-muted">
            {notice}
          </p>
        )}
      </Section>

      <Section title="Liberados">
        {rows === null ? (
          <LoadingNote className="text-ink-muted" />
        ) : rows.length === 0 ? (
          <p className="text-ink-muted">Nenhum acesso liberado ainda.</p>
        ) : (
          <ul className="flex flex-col">
            {rows.map((row) => {
              const key = `${row.uid}/${row.productId}`
              const expired = row.expiresAt !== null && row.expiresAt <= now
              return (
                <li
                  key={key}
                  className="grid gap-1 border-b border-line py-3 text-sm sm:grid-cols-[1.3fr_1fr_auto_auto_auto] sm:items-center sm:gap-3"
                >
                  <span className="truncate text-ink">{row.email}</span>
                  <span className="text-ink-muted">{row.title}</span>
                  <span className={expired ? 'text-accent' : 'text-ink-muted'}>
                    {termLabel(row.expiresAt, now)}
                  </span>
                  <span className="text-ink-faint">
                    {row.source === 'payment' ? 'Pagamento' : 'À mão'}
                  </span>
                  <span className="flex gap-3">
                    {expired && (
                      <button
                        type="button"
                        onClick={() => renew(row)}
                        className="font-medium text-admin-ink hover:underline"
                      >
                        Renovar
                      </button>
                    )}
                    {confirming === key ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void revoke(row)}
                          className="font-semibold text-accent hover:underline"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="text-ink-faint"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(key)}
                        aria-label={`Revogar ${row.title} de ${row.email}`}
                        className="text-ink-faint hover:text-accent"
                      >
                        Revogar
                      </button>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      <PeopleSection
        people={people && markAdmins(people, myUid ? [myUid] : [])}
        isWide={isWide}
        accessesOf={(uid) =>
          (rows ?? [])
            .filter((row) => row.uid === uid)
            .map((row) => ({
              key: row.productId,
              title: row.title,
              term: termLabel(row.expiresAt, now),
            }))
        }
        onGrant={(found) => {
          setEmail(found.email)
          setPerson(found)
          setNotice('Escolha o produto e o prazo e toque em "Liberar".')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    </div>
  )
}
