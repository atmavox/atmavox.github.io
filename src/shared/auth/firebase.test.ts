import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './authErrors'
import { readFirebaseConfig } from '../firebase/config'

describe('readFirebaseConfig', () => {
  const full = {
    VITE_FIREBASE_API_KEY: 'chave',
    VITE_FIREBASE_AUTH_DOMAIN: 'atmavox-b72a4.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'atmavox-b72a4',
    VITE_FIREBASE_APP_ID: '1:123:web:abc',
  }

  it('monta a configuração quando as quatro variáveis existem', () => {
    expect(readFirebaseConfig(full)).toEqual({
      apiKey: 'chave',
      authDomain: 'atmavox-b72a4.firebaseapp.com',
      projectId: 'atmavox-b72a4',
      appId: '1:123:web:abc',
    })
  })

  it('sem alguma variável (ou com ela vazia), o login fica desligado', () => {
    expect(readFirebaseConfig({})).toBeNull()
    expect(readFirebaseConfig({ ...full, VITE_FIREBASE_APP_ID: '  ' })).toBeNull()
  })
})

describe('authErrorMessage', () => {
  it('traduz os erros comuns para português', () => {
    expect(authErrorMessage('auth/invalid-credential')).toBe('E-mail ou senha incorretos.')
    expect(authErrorMessage('auth/weak-password')).toContain('6 caracteres')
  })

  it('ignora quando a pessoa só fechou a janela do Google', () => {
    expect(authErrorMessage('auth/popup-closed-by-user')).toBeNull()
  })

  it('usa uma mensagem genérica para o que não conhece', () => {
    expect(authErrorMessage('auth/coisa-nova')).toBe(
      'Não foi possível entrar agora. Tente de novo em instantes.',
    )
    expect(authErrorMessage(undefined)).toContain('Não foi possível entrar')
  })
})
