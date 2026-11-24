import type { AuthUser } from './ports'

/**
 * Quem criou a conta com e-mail e senha e ainda não clicou no link de confirmação (pedido de
 * 2026-11-24): pode olhar os hubs, mas jornadas, meditações dos hubs e compras esperam a confirmação.
 */
export function needsEmailConfirmation(user: AuthUser | null | undefined): boolean {
  return !!user && !user.emailVerified
}
