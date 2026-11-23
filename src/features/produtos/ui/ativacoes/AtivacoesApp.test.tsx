import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_ANAMNESIS } from '../../../../shared/ativacao/anamnesis'
import { DEFAULT_THERAPIES } from '../../../../shared/ativacao/therapy'
import { setWideViewport } from '../../../../test/viewport'
import { createInMemoryAtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import { AtivacoesApp } from './AtivacoesApp'
import { sectionFromPath } from './sections'

afterEach(() => setWideViewport(false))

describe('Modo Andreía · terapias', () => {
  it('começa pelas terapias combinadas, sem preço e desativadas', async () => {
    setWideViewport(true)
    render(<AtivacoesApp backend={createInMemoryAtivacoesBackend()} section="terapias" />)
    expect(await screen.findByText(/ainda sem preço e desativadas/)).toBeInTheDocument()
    for (const therapy of DEFAULT_THERAPIES) {
      expect(screen.getByRole('switch', { name: `${therapy.name} ativa` })).not.toBeChecked()
    }
  })

  it('ativar sem preço abre a terapia apontando o preço', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend()
    render(<AtivacoesApp backend={backend} section="terapias" />)
    fireEvent.click(await screen.findByRole('switch', { name: 'Reiki a distância ativa' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar terapia' })
    expect(within(dialog).getByText('Para ativar, a terapia precisa de preço.')).toBeInTheDocument()
    expect(backend.therapies).toBeNull()
  })

  it('põe o preço, ativa e salva', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend()
    render(<AtivacoesApp backend={backend} section="terapias" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Reiki a distância' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar terapia' })
    fireEvent.change(within(dialog).getByLabelText('Preço (R$)'), { target: { value: '120' } })
    fireEvent.click(within(dialog).getByRole('switch', { name: 'Ativa' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Salvo ✓')).toBeInTheDocument()
    expect(backend.therapies?.[0]).toMatchObject({
      id: 'reiki-a-distancia',
      priceCents: 12000,
      active: true,
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cria uma terapia nova, conferindo os campos antes', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend({ therapies: [] })
    render(<AtivacoesApp backend={backend} section="terapias" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Nova terapia' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nova terapia' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Criar terapia' }))
    expect(within(dialog).getByText('Dê um nome à terapia.')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText('Nome'), {
      target: { value: 'Aromaterapia a distância' },
    })
    fireEvent.change(within(dialog).getByLabelText('Descrição (aparece para a pessoa)'), {
      target: { value: 'Óleos escolhidos para o seu momento.' },
    })
    fireEvent.click(within(dialog).getByRole('radio', { name: 'Folha' }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Criar terapia' }))
    expect(await screen.findByText('Salvo ✓')).toBeInTheDocument()
    expect(backend.therapies).toEqual([
      expect.objectContaining({ id: 'aromaterapia-a-distancia', icon: 'leaf', active: false }),
    ])
  })

  it('no celular, o formulário abre em blocos e só um fica aberto', async () => {
    const backend = createInMemoryAtivacoesBackend()
    render(<AtivacoesApp backend={backend} section="terapias" />)
    fireEvent.click(await screen.findByRole('button', { name: /Barras de Access/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar terapia' })
    expect(within(dialog).getByLabelText('Nome')).toBeInTheDocument()
    expect(within(dialog).queryByLabelText('Preço (R$)')).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: /Sessão/ }))
    expect(within(dialog).getByLabelText('Preço (R$)')).toBeInTheDocument()
    expect(within(dialog).queryByLabelText('Nome')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver o site' })).toHaveAttribute('href', '#/')
  })
})

describe('Modo Andreía · anamnese', () => {
  it('abre no modelo aprovado e salva uma pergunta mudada', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend()
    render(<AtivacoesApp backend={backend} section="anamnese" />)
    expect(await screen.findByText(/modelo aprovado no mock/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Cidade onde você mora/ }))
    fireEvent.change(screen.getByLabelText('Pergunta'), {
      target: { value: 'Em que cidade você mora?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Salvo ✓')).toBeInTheDocument()
    const saved = backend.anamnesis?.sections[0]?.questions.find((q) => q.id === 'cidade')
    expect(saved?.label).toBe('Em que cidade você mora?')
  })

  it('nome e telefone não mudam de tipo nem saem', async () => {
    setWideViewport(true)
    render(
      <AtivacoesApp
        backend={createInMemoryAtivacoesBackend({ anamnesis: DEFAULT_ANAMNESIS })}
        section="anamnese"
      />,
    )
    fireEvent.click(await screen.findByRole('button', { name: /Telefone com WhatsApp/ }))
    expect(screen.getByText(/Nome e telefone são fixos/)).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Tipo de resposta' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tirar do formulário' })).not.toBeInTheDocument()
  })

  it('pergunta já salva que sai do formulário fica guardada', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend({ anamnesis: DEFAULT_ANAMNESIS })
    render(<AtivacoesApp backend={backend} section="anamnese" />)
    fireEvent.click(await screen.findByRole('button', { name: /Cidade onde você mora/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Tirar do formulário' }))
    expect(screen.getByText('Perguntas guardadas (1)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Salvo ✓')).toBeInTheDocument()
    expect(backend.anamnesis?.archived.map((q) => q.id)).toEqual(['cidade'])
  })

  it('pergunta nova sem texto não deixa salvar', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend({ anamnesis: DEFAULT_ANAMNESIS })
    render(<AtivacoesApp backend={backend} section="anamnese" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Nova pergunta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText(/Faltam alguns campos/)).toBeInTheDocument()
    expect(screen.getAllByText('Escreva a pergunta.').length).toBeGreaterThan(0)
    expect(backend.anamnesis).toEqual(DEFAULT_ANAMNESIS)
  })
})

describe('rota', () => {
  it('abre cada seção pelo endereço; sem seção, os pedidos', () => {
    expect(sectionFromPath('/admin/ativacoes/anamnese')).toBe('anamnese')
    expect(sectionFromPath('/admin/ativacoes/terapias')).toBe('terapias')
    expect(sectionFromPath('/admin/ativacoes/agenda')).toBe('agenda')
    expect(sectionFromPath('/admin/ativacoes')).toBe('pedidos')
  })
})
