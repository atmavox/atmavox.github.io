// Quem entra pelo Google já chega com nome e foto (pedido de 2026-11-24): na primeira vez, os dois
// vão para o cadastro, e a pessoa edita depois. O celular o Google não entrega sem uma permissão
// sensível, então continua sendo digitado.
import { normalizeField, type PersonProfile } from './profile'
import type { StoredProfile } from './profileSource'

export interface AccountInfo {
  displayName: string | null
  photoUrl: string | null
}

/** Baixa a foto e devolve já reduzida (`data:image/…`), ou rejeita. */
export type PhotoLoader = (url: string) => Promise<string>

/** O que puxar da conta: só no primeiro cadastro e só nos campos vazios. */
export function accountPrefill(
  stored: StoredProfile,
  account: AccountInfo,
): { fullName?: string; photoUrl?: string } {
  if (stored.savedBefore) return {}
  const fullName = normalizeField('fullName', account.displayName ?? '')
  return {
    ...(fullName && !stored.profile.fullName ? { fullName } : {}),
    ...(account.photoUrl && !stored.profile.photo
      ? { photoUrl: largerPhoto(account.photoUrl) }
      : {}),
  }
}

/** O Google manda a foto com 96 px ("…=s96-c"); 320 px é o tamanho do círculo do perfil. */
export function largerPhoto(url: string): string {
  return url.replace(/=s\d+-c$/, '=s320-c')
}

/**
 * Preenche e grava o que vier da conta. Se a foto não baixar, segue só com o nome; se nada der para
 * gravar, devolve `null` e a tela fica com o que já tinha.
 */
export async function applyAccountPrefill(
  stored: StoredProfile,
  account: AccountInfo,
  save: (change: Partial<PersonProfile>) => Promise<void>,
  loadPhoto: PhotoLoader,
): Promise<Partial<PersonProfile> | null> {
  const { fullName, photoUrl } = accountPrefill(stored, account)
  const change: Partial<PersonProfile> = fullName ? { fullName } : {}
  if (photoUrl) {
    try {
      change.photo = await loadPhoto(photoUrl)
    } catch {
      // Foto fora do ar ou bloqueada: a pessoa escolhe uma no perfil, se quiser.
    }
  }
  if (Object.keys(change).length === 0) return null
  try {
    await save(change)
  } catch {
    return null
  }
  return change
}
