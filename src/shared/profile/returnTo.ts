// Para onde voltar depois de completar o cadastro no perfil (mock aprovado, Complete seu cadastro C):
// a janela leva à aba Conta e, com os dados prontos, o perfil oferece "Voltar para {título}". Fica na
// aba do navegador (sessionStorage); sem ele (aba privada, bloqueio), o perfil só não mostra o botão.

const KEY = 'atmavox:voltar'

export interface ReturnTarget {
  href: string
  title: string
}

export function saveReturnTarget(target: ReturnTarget): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(target))
  } catch {
    // Sem armazenamento: o perfil não oferece a volta, e a pessoa volta pelo menu.
  }
}

export function readReturnTarget(): ReturnTarget | null {
  try {
    const raw: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
    if (typeof raw !== 'object' || raw === null) return null
    const { href, title } = raw as Record<string, unknown>
    // Só caminhos do próprio site (#/…), nunca um endereço de fora.
    return typeof href === 'string' && href.startsWith('#/') && typeof title === 'string'
      ? { href, title }
      : null
  } catch {
    return null
  }
}

export function clearReturnTarget(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Nada a limpar.
  }
}
