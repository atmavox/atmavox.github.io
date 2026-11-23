import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AdminHeader } from './AdminHeader'
import { AdminStrip } from './AdminStrip'
import { AdminTabBar } from './AdminTabBar'

describe('cabeçalhos do Modo Andreía', () => {
  it('no site, a faixa só leva para a edição', () => {
    render(<AdminStrip />)
    expect(screen.getByRole('link', { name: 'Começar a editar' })).toHaveAttribute(
      'href',
      '#/admin/produtos',
    )
    expect(screen.queryByRole('link', { name: 'Acessos' })).not.toBeInTheDocument()
  })

  it('nas telas de edição, as três áreas, voltar ao hub e ver o site', () => {
    render(<AdminHeader active="ativacoes" />)
    const areas = screen.getByRole('navigation', { name: 'Áreas do Modo Andreía' })
    expect(areas).toHaveTextContent('ProdutosAtivaçõesAcessos')
    expect(screen.getByRole('link', { name: 'Ativações' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Voltar ao hub' })).toHaveAttribute(
      'href',
      '#/jornadas',
    )
    expect(screen.getByRole('link', { name: 'Ver o site' })).toHaveAttribute('href', '#/')
  })

  it('no celular, a faixa fica só com a tag e as áreas vão para as abas de baixo', () => {
    render(
      <>
        <AdminHeader active="ativacoes" compact />
        <AdminTabBar active="ativacoes" />
      </>,
    )
    expect(screen.getByText('Modo Andreía')).toBeInTheDocument()
    const tabs = screen.getByRole('navigation', { name: 'Áreas do Modo Andreía' })
    expect(tabs).toHaveTextContent('ProdutosAtivaçõesAcessosVer o site')
    expect(screen.getByRole('link', { name: 'Ativações' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Ver o site' })).toHaveAttribute('href', '#/')
  })
})
