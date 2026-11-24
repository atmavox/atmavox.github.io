const GENERIC = 'Não foi possível entrar agora. Tente de novo em instantes.'

/**
 * O Firebase não diz se o e-mail tem conta (proteção contra enumeração ligada, decisão de 2026-11-24):
 * a janela de login mostra esta mensagem com "Ainda não tem conta? Criar conta com este e-mail".
 */
export const WRONG_CREDENTIALS = 'E-mail ou senha incorretos.'

const MESSAGES: Record<string, string | null> = {
  'auth/invalid-credential': WRONG_CREDENTIALS,
  'auth/wrong-password': WRONG_CREDENTIALS,
  'auth/user-not-found': WRONG_CREDENTIALS,
  'auth/invalid-email': 'Este e-mail não parece válido. Confira e tente de novo.',
  'auth/missing-password': 'Digite a sua senha.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail. Tente entrar.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com a internet. Verifique e tente de novo.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/unauthorized-domain': 'O login ainda não foi liberado para este endereço.',
  'auth/operation-not-allowed': 'Esta forma de entrar ainda não está disponível.',
  // A pessoa fechou a janela do Google: não é erro, não mostra nada.
  'auth/popup-closed-by-user': null,
  'auth/cancelled-popup-request': null,
}

/** Mensagem em português para um código de erro do Firebase Auth; `null` = ignorar em silêncio. */
export function authErrorMessage(code: unknown): string | null {
  if (typeof code !== 'string') return GENERIC
  const message = MESSAGES[code]
  return message === undefined ? GENERIC : message
}
