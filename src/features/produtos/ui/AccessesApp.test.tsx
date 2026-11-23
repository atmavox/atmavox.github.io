import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { JourneyProduct } from '../../../shared/catalog/product'
import { seedCatalog } from '../../../shared/catalog/seedCatalog'
import { patchDocument } from '../../../shared/firebase/firestoreRest'
import { expiresAtFor, termLabel } from '../domain/accessGrant'
import { accessOf, createInMemoryAccessAdmin } from '../infrastructure/accessAdmin'
import { AccessesApp } from './AccessesApp'

const NOW = Date.UTC(2026, 10, 23, 15)
const paid: JourneyProduct = {
  ...(seedCatalog[0] as JourneyProduct),
  id: 'raizes',
  title: 'Raízes',
  pricing: { type: 'paid', priceCents: 6700, accessMonths: 12 },
}

describe('prazo de um acesso liberado à mão', () => {
  it('o do produto, para sempre ou até uma data (fim do dia em Brasília)', () => {
    expect(expiresAtFor('produto', paid, NOW)).toBe(Date.UTC(2027, 10, 23, 15))
    expect(expiresAtFor('produto', { ...paid, pricing: { type: 'free' } }, NOW)).toBeNull()
    expect(expiresAtFor('sempre', paid, NOW)).toBeNull()
    expect(expiresAtFor('ate', paid, NOW, '2027-01-10')).toBe(Date.UTC(2027, 0, 11, 2, 59, 59))
    expect(expiresAtFor('ate', paid, NOW, '2020-01-01')).toBeUndefined()
    expect(expiresAtFor('ate', paid, NOW, '')).toBeUndefined()
  })

  it('descreve o prazo', () => {
    expect(termLabel(null, NOW)).toBe('para sempre')
    expect(termLabel(Date.UTC(2027, 10, 23, 15), NOW)).toBe('até 23/11/2027')
    expect(termLabel(NOW - 1, NOW)).toMatch(/^venceu em/)
  })

  it('lê um acesso da consulta em grupo, com a pessoa e o produto do caminho', () => {
    expect(
      accessOf({
        name: 'projects/p/databases/(default)/documents/users/uid-ana/access/raizes',
        fields: {
          grantedAt: { integerValue: '1' },
          expiresAt: { nullValue: null },
          source: { stringValue: 'manual' },
        },
      }),
    ).toEqual({
      uid: 'uid-ana',
      productId: 'raizes',
      grantedAt: 1,
      expiresAt: null,
      source: 'manual',
    })
  })

  it('a gravação usa só os campos dados (updateMask), com o token', async () => {
    const fetchFn = vi.fn(async () => new Response('{}'))
    await patchDocument(
      { projectId: 'p', apiKey: 'k' },
      'users/u',
      { email: { stringValue: 'a@b.c' } },
      'tok',
      fetchFn,
    )
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/documents/users/u?key=k&updateMask.fieldPaths=email'),
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    )
  })
})

describe('tela de Acessos', () => {
  const people = [{ uid: 'uid-ana', email: 'ana@exemplo.com', name: 'Ana Lima' }]

  it('libera um acesso para quem tem conta e mostra na lista', async () => {
    const admin = createInMemoryAccessAdmin(people)
    render(<AccessesApp admin={admin} products={[paid, ...seedCatalog]} />)
    expect(await screen.findByText('Nenhum acesso liberado ainda.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('E-mail da pessoa'), {
      target: { value: 'ana@exemplo.com' },
    })
    fireEvent.blur(screen.getByLabelText('E-mail da pessoa'))
    expect(await screen.findByText('✓ Ana Lima tem conta no site.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Prazo'), { target: { value: 'sempre' } })
    fireEvent.click(screen.getByRole('button', { name: 'Liberar' }))

    await waitFor(() => expect(admin.accesses).toHaveLength(1))
    expect(admin.accesses[0]).toMatchObject({
      uid: 'uid-ana',
      productId: 'raizes',
      expiresAt: null,
    })
    expect(await screen.findByText('para sempre')).toBeInTheDocument()
  })

  it('e-mail de quem nunca entrou: explica o que fazer', async () => {
    render(<AccessesApp admin={createInMemoryAccessAdmin(people)} products={[paid]} />)
    fireEvent.change(screen.getByLabelText('E-mail da pessoa'), {
      target: { value: 'nova@exemplo.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Liberar' }))
    expect(
      await screen.findAllByText(/Ninguém com esse e-mail entrou no site ainda/),
    ).not.toHaveLength(0)
  })

  it('revogar pede confirmação', async () => {
    const admin = createInMemoryAccessAdmin(people)
    await admin.grant('uid-ana', 'raizes', null)
    render(<AccessesApp admin={admin} products={[paid]} />)
    fireEvent.click(
      await screen.findByRole('button', { name: 'Revogar Raízes de ana@exemplo.com' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(admin.accesses).toHaveLength(0))
  })
})
