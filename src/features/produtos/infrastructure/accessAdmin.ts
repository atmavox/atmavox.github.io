// Acessos de todo mundo, para a admin (Modo Andreía · Acessos): achar a pessoa pelo e-mail, liberar,
// listar e revogar. REST com o token da admin; as regras recusam os outros (firestore.rules).
import {
  deleteDocument,
  documentId,
  fieldsOf,
  isNullField,
  numberField,
  patchDocument,
  restInteger,
  restNull,
  restString,
  stringField,
  type FetchFn,
  type RestConfig,
} from '../../../shared/firebase/firestoreRest'
import type { PersonProfile } from '../../../shared/profile/profile'
import { markAdmins } from '../domain/people'
import { profileFromFields } from '../../../shared/profile/profileSource'

export interface Person {
  uid: string
  email: string
  /** Nome da conta (do login). */
  name: string
  /** Os dados da aba Conta (ADR-030); vazio para quem ainda não preencheu. */
  profile?: PersonProfile
  /** Tem `admins/{uid}`. */
  isAdmin?: boolean
}

export interface GrantedAccess {
  uid: string
  productId: string
  grantedAt: number
  expiresAt: number | null
  source: 'manual' | 'payment'
}

export interface AccessAdmin {
  findByEmail(email: string): Promise<Person | null>
  listPeople(): Promise<Person[]>
  listAccesses(): Promise<GrantedAccess[]>
  grant(uid: string, productId: string, expiresAt: number | null): Promise<void>
  revoke(uid: string, productId: string): Promise<void>
}

const personOf = (document: unknown): Person | null => {
  const uid = documentId(document)
  const fields = fieldsOf(document)
  const email = fields ? stringField(fields, 'email') : undefined
  return uid && fields && email
    ? { uid, email, name: stringField(fields, 'name') ?? '', profile: profileFromFields(fields) }
    : null
}

/** `projects/…/documents/users/{uid}/access/{produto}` → uid e produto. */
export function accessOf(document: unknown): GrantedAccess | null {
  if (typeof document !== 'object' || document === null || !('name' in document)) return null
  const name = String((document as { name: unknown }).name)
  const match = /\/documents\/users\/([^/]+)\/access\/([^/]+)$/.exec(name)
  const fields = fieldsOf(document)
  if (!match || !fields) return null
  const grantedAt = numberField(fields, 'grantedAt')
  const expiresAt = isNullField(fields, 'expiresAt') ? null : numberField(fields, 'expiresAt')
  const source = stringField(fields, 'source')
  if (grantedAt === undefined || expiresAt === undefined) return null
  return {
    uid: decodeURIComponent(match[1]!),
    productId: decodeURIComponent(match[2]!),
    grantedAt,
    expiresAt,
    source: source === 'payment' ? 'payment' : 'manual',
  }
}

export function createAccessAdmin(
  config: RestConfig,
  getToken: () => Promise<string | null>,
  fetchFn: FetchFn = (input, init) => fetch(input, init),
  now: () => number = Date.now,
): AccessAdmin {
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents`

  async function token(): Promise<string> {
    const value = await getToken()
    if (!value) throw new Error('Sem login.')
    return value
  }

  /** Consulta estruturada (`:runQuery`): devolve os documentos encontrados. */
  async function runQuery(structuredQuery: unknown): Promise<unknown[]> {
    const response = await fetchFn(`${base}:runQuery?key=${encodeURIComponent(config.apiKey)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery }),
    })
    if (!response.ok) throw new Error(`Firestore respondeu ${response.status}`)
    const rows = (await response.json()) as { document?: unknown }[]
    return Array.isArray(rows) ? rows.flatMap((row) => (row.document ? [row.document] : [])) : []
  }

  return {
    async findByEmail(email) {
      const documents = await runQuery({
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'email' },
            op: 'EQUAL',
            value: { stringValue: email.trim().toLowerCase() },
          },
        },
        limit: 1,
      })
      return documents.map(personOf).find((p) => p !== null) ?? null
    },
    async listPeople() {
      const [documents, admins] = await Promise.all([
        runQuery({ from: [{ collectionId: 'users' }] }),
        // Com as regras antigas a admin só lê o próprio `admins/{uid}`: aí segue sem a lista, e a tela
        // marca ao menos quem está usando o Modo Andreía.
        runQuery({ from: [{ collectionId: 'admins' }] }).catch(() => []),
      ])
      const adminUids = admins.flatMap((d) => documentId(d) ?? [])
      return markAdmins(
        documents.flatMap((d) => personOf(d) ?? []),
        adminUids,
      )
    },
    async listAccesses() {
      const documents = await runQuery({ from: [{ collectionId: 'access', allDescendants: true }] })
      return documents.flatMap((d) => accessOf(d) ?? [])
    },
    async grant(uid, productId, expiresAt) {
      await patchDocument(
        config,
        `users/${uid}/access/${productId}`,
        {
          grantedAt: restInteger(now()),
          expiresAt: expiresAt === null ? restNull() : restInteger(expiresAt),
          source: restString('manual'),
        },
        await token(),
        fetchFn,
      )
    },
    async revoke(uid, productId) {
      await deleteDocument(config, `users/${uid}/access/${productId}`, await token(), fetchFn)
    },
  }
}

/** Para os testes: tudo na memória. */
export function createInMemoryAccessAdmin(people: Person[] = []): AccessAdmin & {
  accesses: GrantedAccess[]
} {
  const state = { accesses: [] as GrantedAccess[] }
  return Object.assign(state, {
    findByEmail: async (email: string) =>
      people.find((p) => p.email === email.trim().toLowerCase()) ?? null,
    listPeople: async () => [...people],
    listAccesses: async () => [...state.accesses],
    grant: async (uid: string, productId: string, expiresAt: number | null) => {
      state.accesses = state.accesses.filter((a) => !(a.uid === uid && a.productId === productId))
      state.accesses.push({ uid, productId, grantedAt: Date.now(), expiresAt, source: 'manual' })
    },
    revoke: async (uid: string, productId: string) => {
      state.accesses = state.accesses.filter((a) => !(a.uid === uid && a.productId === productId))
    },
  })
}
