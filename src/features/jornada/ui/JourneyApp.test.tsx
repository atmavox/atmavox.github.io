import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createJourneyContent } from '../application/JourneyContent'
import { createJourneyStore } from '../application/JourneyStore'
import { chamaInterna21 } from '../content/chama-interna-21'
import { START_STEP, VICTORIES_STEP } from '../domain/access'
import { withSectionIds, type Journey } from '../domain/journey'
import { emptyProgress, markStepDone, type JourneyProgress } from '../domain/progress'
import { createInMemoryBackend, createTestAccount } from '../infrastructure/InMemoryCloudBackend'
import { InMemoryProgressRepository } from '../infrastructure/InMemoryProgressRepository'
import { JourneyApp } from './JourneyApp'
import { JourneyContext } from './JourneyContext'

function renderJourney(path: string, repository = new InMemoryProgressRepository()) {
  const store = createJourneyStore({ repository })
  const view = render(
    <JourneyContext.Provider
      value={{ content: createJourneyContent({ fallback: chamaInterna21 }), store, account: null }}
    >
      <JourneyApp path={path} />
    </JourneyContext.Provider>,
  )
  return { ...view, repository, store }
}

const started = () => new InMemoryProgressRepository(markStepDone(emptyProgress(), START_STEP, 1))

/** Tudo pronto até as Revisões: libera a aba Vitórias. */
function readyForVictories(): JourneyProgress {
  const reviewIds = chamaInterna21.reviews.flatMap((r) => r.questions.map((q) => q.fieldId))
  return {
    ...markStepDone(emptyProgress(), START_STEP, 1),
    completedDays: Array.from({ length: 21 }, (_, i) => i + 1),
    completedSteps: [START_STEP, ...reviewIds],
  }
}

const openDay1 = () =>
  fireEvent.click(screen.getByRole('button', { name: /Dia 1: O Estado que você não consegue/ }))
const done = () => fireEvent.click(screen.getByRole('button', { name: 'Feito ✦' }))

describe('JourneyApp por tema', () => {
  const themes: Journey = {
    id: 'corpo-que-escuta',
    structure: 'themes',
    weeks: ['Respiração', 'Sensação'].map((theme, i) => ({
      number: i + 1,
      roman: '',
      theme,
      days: [
        withSectionIds({
          number: i + 1,
          title: theme,
          subtitle: '',
          isReview: false,
          sections: [{ type: 'text', text: `Conteúdo de ${theme}.` }],
        }),
      ],
    })),
    reviews: [],
    closingQuestions: [],
  }

  it('mostra o tema inteiro, sem "Dia", e concluir abre o próximo tema', () => {
    const store = createJourneyStore({ repository: started() })
    render(
      <JourneyContext.Provider
        value={{ content: createJourneyContent({ fallback: themes }), store, account: null }}
      >
        <JourneyApp path="/jornada/corpo-que-escuta/tema-1" />
      </JourneyContext.Provider>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Respiração' })).toBeVisible()
    expect(screen.getByText('Tema 1 de 2')).toBeVisible()
    expect(screen.queryByText(/Dia 1/)).not.toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Etapas da jornada' })
    expect(within(nav).getByText(/Sensação/)).toHaveTextContent('fechada')
    fireEvent.click(screen.getByRole('button', { name: 'Concluir tema ✦' }))
    expect(within(nav).getByRole('link', { name: /Sensação/ })).toBeInTheDocument()
  })
})

describe('JourneyApp', () => {
  it('a abertura mostra o rastreador e o botão de começar; a Semana I ainda está fechada', () => {
    renderJourney('/jornada')
    expect(screen.getByRole('heading', { level: 1, name: 'Saindo do Estado Cinza' })).toBeVisible()
    expect(screen.getAllByRole('listitem', { name: /^Dia \d+, fechado$/ })).toHaveLength(21)
    const nav = screen.getByRole('navigation', { name: 'Etapas da jornada' })
    expect(within(nav).queryByRole('link', { name: /Semana I progresso/ })).toBeNull()
    const lockedTabs = [...nav.querySelectorAll('[aria-disabled="true"]')].map(
      (el) => el.textContent,
    )
    expect(lockedTabs).toContain('Semana I, fechada')
    expect(lockedTabs).toHaveLength(6)
  })

  it('"Começar a jornada" abre a Semana I e o dia 1', () => {
    const { repository } = renderJourney('/jornada')
    fireEvent.click(screen.getByRole('button', { name: 'Começar a jornada ✦' }))
    expect(repository.saved.completedSteps).toContain(START_STEP)
    expect(screen.getByRole('listitem', { name: 'Dia 1, aberto' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continuar no dia 1 →' })).toHaveAttribute(
      'href',
      '#/jornada/chama-interna-21/semana-1',
    )
  })

  it('as etapas do dia abrem uma de cada vez e a pergunta pede resposta antes do "Feito"', () => {
    renderJourney('/jornada/semana-1', started())
    openDay1()

    expect(screen.getAllByText('conclua a etapa anterior').length).toBeGreaterThan(0)
    done() // check-in
    done() // ritual
    const feito = screen.getByRole('button', { name: 'Feito ✦' })
    expect(feito).toBeDisabled()

    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'Como o Estado Cinza aparece na minha vida hoje? editável',
      }),
      { target: { value: 'Peço permissão demais' } },
    )
    expect(screen.getByRole('button', { name: 'Feito ✦' })).toBeEnabled()
  })

  it('concluir todas as etapas libera "Concluir dia", que fica salvo; o dia seguinte abre à meia-noite', () => {
    const { repository, unmount } = renderJourney('/jornada/semana-1', started())
    openDay1()
    expect(
      screen.getByRole('button', { name: 'Conclua as etapas para fechar o dia' }),
    ).toBeDisabled()

    done() // check-in
    done() // ritual
    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'Como o Estado Cinza aparece na minha vida hoje? editável',
      }),
      { target: { value: 'Peço permissão demais' } },
    )
    done() // reflexão
    done() // afirmação
    fireEvent.click(screen.getAllByRole('button', { name: 'Chama acesa' })[0]!)
    done() // fechamento
    fireEvent.click(screen.getByRole('button', { name: 'Concluir dia ✦' }))

    expect(repository.saved.completedDays).toEqual([1])
    expect(screen.getByRole('button', { name: /Dia 2: Os sintomas/ })).toBeDisabled()
    expect(screen.getAllByText('Abre amanhã, à meia-noite').length).toBeGreaterThan(0)
    unmount()

    renderJourney('/jornada/semana-1', repository)
    openDay1()
    expect(
      screen.getByRole('textbox', {
        name: 'Como o Estado Cinza aparece na minha vida hoje? editável',
      }),
    ).toHaveValue('Peço permissão demais')
  })

  it('o dia seguinte fica fechado até a meia-noite', () => {
    renderJourney('/jornada/semana-1', started())
    expect(screen.getByRole('button', { name: /Dia 2: Os sintomas/ })).toBeDisabled()
    expect(screen.getByText('Dia 2 fechado')).toBeInTheDocument()
  })

  it('quem abre o link de uma aba fechada vê o aviso e um atalho para onde está', () => {
    renderJourney('/jornada/semana-2', started())
    expect(screen.getByRole('heading', { name: 'Esta etapa ainda está fechada' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Continuar em Semana I →' })).toHaveAttribute(
      'href',
      '#/jornada/chama-interna-21/semana-1',
    )
  })

  it('respeita quem já tinha dias marcados antes da regra e mostra a evolução da aba', () => {
    const legacy = new InMemoryProgressRepository({ ...emptyProgress(), completedDays: [1, 2, 3] })
    renderJourney('/jornada/semana-1', legacy)
    const nav = screen.getByRole('navigation', { name: 'Etapas da jornada' })
    expect(within(nav).getByRole('link', { name: /Semana I progresso: 3\/7/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dia 4: Procrastinação/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Dia 5: A voz/ })).toBeDisabled()
  })

  it('a admin vê todas as abas e dias abertos, sem ter começado', async () => {
    const backend = createInMemoryBackend()
    backend.admins.uids.add('google-uid')
    const store = createJourneyStore({ repository: new InMemoryProgressRepository() })
    const { account } = createTestAccount({
      store,
      local: new InMemoryProgressRepository(),
      backend,
    })
    await account.signInWithGoogle()
    await waitFor(() => expect(account.getSnapshot().isAdmin).toBe(true))

    render(
      <JourneyContext.Provider
        value={{ content: createJourneyContent({ fallback: chamaInterna21 }), store, account }}
      >
        <JourneyApp path="/jornada/semana-2" />
      </JourneyContext.Provider>,
    )
    const nav = screen.getByRole('navigation', { name: 'Etapas da jornada' })
    expect(nav.querySelectorAll('[aria-disabled="true"]')).toHaveLength(0)
    expect(screen.getByRole('button', { name: /Dia 8:/ })).toBeEnabled()
  })

  it('registra vitórias como texto puro, sem interpretar HTML', () => {
    renderJourney('/jornada/vitorias', new InMemoryProgressRepository(readyForVictories()))

    fireEvent.change(screen.getByLabelText('O que aconteceu / foi tentado'), {
      target: { value: '<img src=x onerror=alert(1)>' },
    })
    fireEvent.click(screen.getByRole('button', { name: '✦ Registrar Conquista' }))

    const list = screen.getByRole('list', { name: 'Conquistas registradas' })
    expect(within(list).getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(list.querySelector('img')).toBeNull()
  })

  it('avisa quando falta descrever a conquista', () => {
    renderJourney('/jornada/vitorias', new InMemoryProgressRepository(readyForVictories()))
    fireEvent.click(screen.getByRole('button', { name: '✦ Registrar Conquista' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Conte o que aconteceu')
  })

  it('"Feito" nas Vitórias libera o Encerramento', () => {
    const { repository } = renderJourney(
      '/jornada/vitorias',
      new InMemoryProgressRepository(readyForVictories()),
    )
    done()
    expect(repository.saved.completedSteps).toContain(VICTORIES_STEP)
    expect(screen.getByRole('link', { name: 'Ir para o Encerramento →' })).toBeInTheDocument()
  })
})
