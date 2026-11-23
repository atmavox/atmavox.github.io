import { useEffect, useMemo, useState } from 'react'
import { AdminHeader } from '../../shared/ui/AdminHeader'
import { useAuthSession } from '../../shared/auth/AuthContext'
import { LoginDialog } from '../../shared/auth/LoginDialog'
import { useCatalog } from '../../shared/catalog/CatalogContext'
import { readFirebaseConfig } from '../../shared/firebase/config'
import {
  createInMemoryProductsBackend,
  createProductsBackend,
  type ProductsBackend,
} from './infrastructure/productsBackend'
import {
  createAccessAdmin,
  createInMemoryAccessAdmin,
  type AccessAdmin,
} from './infrastructure/accessAdmin'
import {
  createAtivacoesBackend,
  createInMemoryAtivacoesBackend,
  type AtivacoesBackend,
} from './infrastructure/ativacoesBackend'
import { AccessesApp } from './ui/AccessesApp'
import { AtivacoesApp } from './ui/ativacoes/AtivacoesApp'
import { sectionFromPath } from './ui/ativacoes/sections'
import { ProductsApp } from './ui/ProductsApp'

/**
 * Porta de entrada do Modo Andreía de produtos (`#/admin/produtos`), carregada sob demanda: só a admin
 * baixa este código. Sem login, pede para entrar; quem não é admin vê um aviso.
 */
export function ProdutosEntry({
  path = '/admin/produtos',
  backend: injected,
  accessAdmin: injectedAccess,
  ativacoes: injectedAtivacoes,
}: {
  path?: string
  backend?: ProductsBackend
  accessAdmin?: AccessAdmin
  ativacoes?: AtivacoesBackend
}) {
  const area = path.startsWith('/admin/acessos')
    ? 'acessos'
    : path.startsWith('/admin/ativacoes')
      ? 'ativacoes'
      : 'produtos'
  const { session, state } = useAuthSession()
  const { store, products } = useCatalog()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [admin, setAdmin] = useState<{ uid: string; isAdmin: boolean } | null>(null)
  const uid = state?.user?.uid ?? null

  const backend = useMemo<ProductsBackend | null>(() => {
    if (injected) return injected
    const config = readFirebaseConfig(import.meta.env)
    if (!config || !session) return null
    return createProductsBackend(config, () => session.getIdToken())
  }, [injected, session])

  const accessAdmin = useMemo<AccessAdmin | null>(() => {
    if (injectedAccess) return injectedAccess
    const config = readFirebaseConfig(import.meta.env)
    if (!config || !session) return null
    return createAccessAdmin(config, () => session.getIdToken())
  }, [injectedAccess, session])

  const ativacoes = useMemo<AtivacoesBackend | null>(() => {
    if (injectedAtivacoes) return injectedAtivacoes
    const config = readFirebaseConfig(import.meta.env)
    if (!config || !session) return null
    return createAtivacoesBackend(config, () => session.getIdToken())
  }, [injectedAtivacoes, session])

  useEffect(() => {
    if (!uid || !backend) return
    let cancelled = false
    void backend.isAdmin(uid).then((isAdmin) => {
      if (!cancelled) setAdmin({ uid, isAdmin })
    })
    return () => {
      cancelled = true
    }
  }, [uid, backend])

  useEffect(() => {
    document.title = 'AtmaVox'
  }, [])

  const message = (text: string, action?: React.ReactNode) => (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="max-w-md text-ink-muted">{text}</p>
      {action}
    </div>
  )

  let body: React.ReactNode
  if (!backend && !injected) {
    body = message('O Modo Andreía precisa do Firebase configurado.')
  } else if (!state?.authChecked) {
    body = message('Carregando…')
  } else if (!uid || !session) {
    body = message(
      'Entre com a conta da Andreía para editar os produtos.',
      <>
        <button
          type="button"
          onClick={() => setIsLoginOpen(true)}
          className="inline-flex min-h-11 items-center rounded-full bg-admin px-6 font-semibold text-on-admin"
        >
          Entrar
        </button>
        {isLoginOpen && session && (
          <LoginDialog account={session} variant="hub" onClose={() => setIsLoginOpen(false)} />
        )}
      </>,
    )
  } else if (admin?.uid !== uid) {
    body = message('Carregando…')
  } else if (!admin.isAdmin) {
    body = message(
      'Esta área é só da Andreía.',
      <a href="#/" className="font-medium text-accent underline">
        Voltar ao site
      </a>,
    )
  } else {
    body =
      area === 'acessos' ? (
        <AccessesApp admin={accessAdmin ?? createInMemoryAccessAdmin()} products={products} />
      ) : area === 'ativacoes' ? (
        <AtivacoesApp
          backend={ativacoes ?? createInMemoryAtivacoesBackend()}
          section={sectionFromPath(path)}
        />
      ) : (
        <ProductsApp backend={backend ?? createInMemoryProductsBackend()} catalog={store} />
      )
  }

  return (
    <div className="min-h-dvh bg-bg">
      <AdminHeader active={area} />
      {body}
    </div>
  )
}
