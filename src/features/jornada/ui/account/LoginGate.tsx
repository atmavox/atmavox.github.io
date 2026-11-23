import type { ReactNode } from 'react'
import { useCatalog } from '../../../../shared/catalog/CatalogContext'
import type { Account } from '../../application/account'
import { LoginDialog } from '../../../../shared/auth/LoginDialog'

const HUB_HREF = '#/jornadas'
const noop = () => {}

interface LoginGateProps {
  account: Account
  journeyId: string
  /** O que fica desfocado por trás (o hub de jornadas, entregue pela composição em `app/`). */
  background?: ReactNode
}

/**
 * A jornada pede login (ADR-020): o hub fica desfocado e a janela mostra a jornada escolhida. Fechar
 * volta ao hub; ao entrar, a jornada aparece no lugar (com o progresso do aparelho mesclado à conta).
 */
export function LoginGate({ account, journeyId, background }: LoginGateProps) {
  const product = useCatalog().find(journeyId)
  const chosen = product
    ? {
        title: product.title,
        territory: product.territory,
        mediaId: product.bannerMediaId,
      }
    : undefined

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none min-h-dvh blur-[7px] saturate-90 select-none"
      >
        {background}
      </div>
      <LoginDialog
        account={account}
        variant="gate"
        {...(chosen ? { chosen } : {})}
        onClose={() => {
          window.location.hash = HUB_HREF
        }}
        onSignedIn={noop}
      />
    </>
  )
}
