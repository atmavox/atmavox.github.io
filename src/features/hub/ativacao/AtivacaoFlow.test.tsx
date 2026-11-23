import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnamnesisForm } from '../../../shared/ativacao/anamnesis'
import { FIXED_QUESTIONS } from '../../../shared/ativacao/anamnesis'
import { DEFAULT_THERAPIES } from '../../../shared/ativacao/therapy'
import { AuthContext } from '../../../shared/auth/AuthContext'
import { InMemoryAuth } from '../../../shared/auth/InMemoryAuth'
import { createAuthSession } from '../../../shared/auth/session'
import { setWideViewport } from '../../../test/viewport'
import { createInMemoryAtivacaoSource } from './ativacaoSource'
import { AtivacaoFlow } from './AtivacaoFlow'

// Hoje é quinta, 3 de dezembro de 2026; a Andreía abriu a sexta, 4, das 18h às 20h.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 11, 3, 10))
  window.location.hash = '#/ativacao'
})
afterEach(() => {
  vi.useRealTimers()
  setWideViewport(false)
})

const form: AnamnesisForm = {
  sections: [
    { id: 'dados', title: 'Seus dados', questions: [...FIXED_QUESTIONS] },
    {
      id: 'momento',
      title: 'O seu momento',
      questions: [
        {
          id: 'motivo',
          label: 'O que trouxe você até aqui agora?',
          hint: '',
          type: 'long',
          options: [],
          required: true,
        },
      ],
    },
  ],
  consent: 'Concordo que a Andreía leia estas respostas.',
  archived: [],
}

const therapies = DEFAULT_THERAPIES.map((t) => ({
  ...t,
  priceCents: 12000,
  active: t.id !== 'barras-de-access',
}))

function setup({ signedIn = true } = {}) {
  const auth = new InMemoryAuth()
  const session = createAuthSession({
    loadAuth: async () => auth,
    hint: { get: () => signedIn, set: () => {} },
  })
  const source = createInMemoryAtivacaoSource({
    therapies,
    anamnesis: form,
    availability: {
      windows: [
        {
          id: 'w',
          date: '2026-12-04',
          start: '18:00',
          end: '20:00',
          therapyIds: ['reiki-a-distancia'],
          weekly: false,
          until: null,
          skip: [],
        },
      ],
      booked: [],
    },
  })
  return { auth, session, source }
}

describe('ativação individual', () => {
  it('pede login primeiro; fechar sem entrar volta ao início', async () => {
    const { session, source } = setup({ signedIn: false })
    render(
      <AuthContext.Provider value={session}>
        <AtivacaoFlow source={source} />
      </AuthContext.Provider>,
    )
    expect(await screen.findByRole('dialog', { name: 'Entre para agendar' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(window.location.hash).toBe('#/')
  })

  it('do login ao resumo: anamnese, terapia, data e o pagamento ainda em breve', async () => {
    setWideViewport(true)
    const { session, source } = setup({ signedIn: false })
    render(
      <AuthContext.Provider value={session}>
        <AtivacaoFlow source={source} />
      </AuthContext.Provider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar com o Google' }))

    // Anamnese: o nome da conta já vem; telefone com DDD é obrigatório.
    expect(await screen.findByLabelText('Nome completo')).toHaveValue('Maria')
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    expect(screen.getByText('Responda esta pergunta para seguir.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Telefone com WhatsApp'), {
      target: { value: '41998765432' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }))
    fireEvent.change(await screen.findByLabelText('O que trouxe você até aqui agora?'), {
      target: { value: 'Quero sair do automático.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Enviar e escolher a terapia/ }))
    expect(screen.getByText('Marque para seguir.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Enviar e escolher a terapia/ }))
    })
    expect(source.mine['google-uid']?.answers).toMatchObject({
      nome: 'Maria',
      telefone: '41998765432',
      motivo: 'Quero sair do automático.',
    })

    // Terapia: só as ativas; a pergunta extra da escolhida é obrigatória.
    expect(screen.queryByRole('button', { name: /Barras de Access/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Reiki a distância/ }))
    fireEvent.click(screen.getByRole('button', { name: /Escolher a data/ }))
    expect(screen.getByText('Responda esta pergunta para seguir.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Em casa' }))
    fireEvent.click(screen.getByRole('button', { name: /Escolher a data/ }))

    // Data: só os dias com horário livre daquela terapia.
    expect(
      await screen.findByText(/A Andreía confere a agenda e aprova o horário/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Sábado, 5 de dezembro, sem horário' }),
    ).toBeDisabled()
    const horarios = screen.getByRole('radiogroup', { name: 'Horário' })
    expect(
      within(horarios)
        .getAllByRole('radio')
        .map((r) => r.textContent),
    ).toEqual(['18h', '19h'])
    fireEvent.click(within(horarios).getByRole('radio', { name: '19h' }))
    fireEvent.click(screen.getByRole('button', { name: /Revisar e pagar/ }))

    // Resumo.
    expect(await screen.findByText('Revise o seu pedido')).toBeInTheDocument()
    expect(screen.getByText('Sexta, 4 de dezembro, às 19h')).toBeInTheDocument()
    expect(screen.getByText('3 respostas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pagamento em breve' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Editar terapia' }))
    expect(await screen.findByText('Qual terapia você quer?')).toBeInTheDocument()
  })

  it('logada, fechar leva ao perfil', async () => {
    const { session, source } = setup()
    await session.signInWithGoogle()
    render(
      <AuthContext.Provider value={session}>
        <AtivacaoFlow source={source} />
      </AuthContext.Provider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Fechar e ir para o meu perfil' }))
    expect(window.location.hash).toBe('#/perfil')
  })

  it('respostas de antes voltam preenchidas', async () => {
    const { session, source } = setup()
    source.mine['google-uid'] = {
      answers: { nome: 'Maria Souza', telefone: '(41) 9 9876-5432' },
      consent: true,
      updatedAt: 1,
    }
    await session.signInWithGoogle()
    render(
      <AuthContext.Provider value={session}>
        <AtivacaoFlow source={source} />
      </AuthContext.Provider>,
    )
    expect(await screen.findByLabelText('Nome completo')).toHaveValue('Maria Souza')
    expect(screen.getByLabelText('Telefone com WhatsApp')).toHaveValue('(41) 9 9876-5432')
  })
})
