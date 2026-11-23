const GENERIC = 'Não foi possível entrar agora. Tente de novo em instantes.'

const MESSAGES: Record<string, string | null> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
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
