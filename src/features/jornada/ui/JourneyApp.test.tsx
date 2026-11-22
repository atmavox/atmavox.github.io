import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createJourneyStore } from '../application/JourneyStore'
import { chamaInterna21 } from '../content/chama-interna-21'
import { InMemoryProgressRepository } from '../infrastructure/InMemoryProgressRepository'
import { JourneyApp } from './JourneyApp'
import { JourneyContext } from './JourneyContext'

function renderJourney(path: string, repository = new InMemoryProgressRepository()) {
  const store = createJourneyStore({ repository })
  const view = render(
    <JourneyContext.Provider value={{ journey: chamaInterna21, store, account: null }}>
      <JourneyApp path={path} />
    </JourneyContext.Provider>,
  )
  return { ...view, repository }
}

describe('JourneyApp', () => {
  it('mostra a abertura com o rastreador dos 21 dias', () => {
    renderJourney('/jornada')
    expect(screen.getByRole('heading', { level: 1, name: 'Saindo do Estado Cinza' })).toBeVisible()
    expect(screen.getAllByRole('button', { name: /^Dia \d+$/ })).toHaveLength(21)
  })

  it('guarda a reflexão do dia e a mantém depois de recarregar', () => {
    const { repository, unmount } = renderJourney('/jornada/semana-1')

    fireEvent.click(screen.getByRole('button', { name: /Dia 1: O Estado que você não consegue/ }))
    const field = screen.getByRole('textbox', {
      name: 'Como o Estado Cinza aparece na minha vida hoje? editável',
    })
    fireEvent.change(field, { target: { value: 'Peço permissão demais' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ansiosa', pressed: false }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Chama acesa' })[0]!)
    unmount()

    renderJourney('/jornada/semana-1', repository)
    fireEvent.click(screen.getByRole('button', { name: /Dia 1: O Estado que você não consegue/ }))
    expect(
      screen.getByRole('textbox', {
        name: 'Como o Estado Cinza aparece na minha vida hoje? editável',
      }),
    ).toHaveValue('Peço permissão demais')
    expect(screen.getByRole('button', { name: 'Ansiosa', pressed: true })).toBeInTheDocument()
    expect(repository.saved.moods['1']).toBe(5)
  })

  it('concluir um dia na semana marca o rastreador da abertura', () => {
    const { repository, unmount } = renderJourney('/jornada/semana-2')
    fireEvent.click(screen.getByRole('button', { name: 'Dia 8 concluído' }))
    unmount()

    renderJourney('/jornada', repository)
    expect(screen.getByRole('button', { name: 'Dia 8', pressed: true })).toBeInTheDocument()
    expect(screen.getByText('1/21 dias')).toBeInTheDocument()
  })

  it('marcar um dia atualiza a evolução da aba na hora', () => {
    renderJourney('/jornada/semana-1')
    const nav = screen.getByRole('navigation', { name: 'Etapas da jornada' })
    expect(within(nav).getByRole('link', { name: /Semana I progresso: 0\/7/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Dia 3 concluído' }))

    expect(within(nav).getByRole('link', { name: /Semana I progresso: 1\/7/ })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: /Abertura progresso: 5%/ })).toBeInTheDocument()
  })

  it('registra vitórias como texto puro, sem interpretar HTML', () => {
    renderJourney('/jornada/vitorias')

    fireEvent.change(screen.getByLabelText('O que aconteceu / foi tentado'), {
      target: { value: '<img src=x onerror=alert(1)>' },
    })
    fireEvent.click(screen.getByRole('button', { name: '✦ Registrar Conquista' }))

    const list = screen.getByRole('list', { name: 'Conquistas registradas' })
    expect(within(list).getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(list.querySelector('img')).toBeNull()
  })

  it('avisa quando falta descrever a conquista', () => {
    renderJourney('/jornada/vitorias')
    fireEvent.click(screen.getByRole('button', { name: '✦ Registrar Conquista' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Conte o que aconteceu')
  })
})
