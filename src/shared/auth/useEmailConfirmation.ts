import { useCallback, useEffect, useState } from 'react'
import { useAuthSession } from './AuthContext'
import { needsEmailConfirmation } from './emailConfirmation'

/**
 * O estado da confirmação de e-mail e as duas ações ("Reenviar" e "Já confirmei"). Ao voltar para a
 * aba (a pessoa confirmou no app de e-mail), confere sozinho: a faixa some sem precisar recarregar.
 */
export function useEmailConfirmation() {
  const { session, state } = useAuthSession()
  const user = state?.user ?? null
  const isPending = needsEmailConfirmation(user)
  const [notice, setNotice] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    if (!isPending || !session) return
    const check = () => {
      if (document.visibilityState === 'visible') void session.refreshUser().catch(() => {})
    }
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [isPending, session])

  const resend = useCallback(async () => {
    if (!session) return
    setIsBusy(true)
    try {
      await session.sendEmailVerification()
      setNotice('Enviamos de novo. Confira também a caixa de spam ou de promoções.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não deu para enviar agora.')
    } finally {
      setIsBusy(false)
    }
  }, [session])

  /** Devolve `true` se o e-mail já aparece como confirmado. */
  const check = useCallback(async (): Promise<boolean> => {
    if (!session) return false
    setIsBusy(true)
    try {
      await session.refreshUser()
    } catch {
      // Sem rede: segue como estava e a mensagem abaixo explica.
    } finally {
      setIsBusy(false)
    }
    const confirmed = !needsEmailConfirmation(session.getSnapshot().user)
    if (!confirmed) {
      setNotice('Ainda não aparece como confirmado. Abra o link do e-mail e tente de novo.')
    }
    return confirmed
  }, [session])

  return { isPending, email: user?.email ?? '', notice, isBusy, resend, check }
}
