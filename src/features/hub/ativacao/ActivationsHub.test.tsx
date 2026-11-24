import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_THERAPIES } from '../../../shared/ativacao/therapy'
import ActivationsHub from './ActivationsHub'
import { createInMemoryAtivacaoSource } from './ativacaoSource'

const therapies = DEFAULT_THERAPIES.map((t) => ({
  ...t,
  priceCents: 12000,
  active: t.id !== 'barras-de-access',
}))

describe('hub de ativações', () => {
  it('convida a agendar e mostra só as terapias ativas, sem preço', async () => {
    render(<ActivationsHub layout="wide" source={createInMemoryAtivacaoSource({ therapies })} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Um encontro só seu, com a Andreía',
    )
    expect(screen.getByRole('link', { name: /Agendar minha ativação/ })).toHaveAttribute(
      'href',
      '#/ativacao',
    )
    expect(await screen.findByRole('link', { name: 'Agendar: Reiki a distância' })).toHaveAttribute(
      'href',
      '#/ativacao/terapia/reiki-a-distancia',
    )
    expect(screen.getByText('50 min · A distância')).toBeInTheDocument()
    expect(screen.queryByText('Barras de Access')).toBeNull()
    expect(document.body.textContent).not.toMatch(/R\$/)
  })

  it('no celular, cada terapia é um cartão que abre o agendamento', async () => {
    render(<ActivationsHub layout="narrow" source={createInMemoryAtivacaoSource({ therapies })} />)
    expect(
      await screen.findByRole('link', { name: 'Agendar: Avaliação energética com radiestesia' }),
    ).toHaveAttribute('href', '#/ativacao/terapia/avaliacao-energetica-radiestesia')
    expect(screen.getByRole('heading', { name: 'Como funciona' })).toBeInTheDocument()
  })

  it('sem terapia ativa ainda: avisa e oferece o WhatsApp', async () => {
    render(<ActivationsHub layout="wide" source={createInMemoryAtivacaoSource()} />)
    expect(await screen.findByText(/As práticas aparecem aqui em breve/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Chamar no WhatsApp/ })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    )
  })
})
