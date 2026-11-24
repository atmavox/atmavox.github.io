import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EMPTY_PROFILE, type PersonProfile } from '../../../shared/profile/profile'
import { MyDataCard } from './MyDataCard'

const TODAY = '2026-11-24'

function setup(profile: PersonProfile = EMPTY_PROFILE, ok = true) {
  const onSave = vi.fn(async () => ok)
  const compress = vi.fn(async () => ({
    dataUrl: 'data:image/webp;base64,AA',
    width: 1,
    height: 1,
  }))
  render(
    <MyDataCard
      profile={profile}
      email="carol@exemplo.com"
      emailVerified
      today={TODAY}
      onSave={onSave}
      compress={compress}
    />,
  )
  return { onSave, compress }
}

describe('Meus dados (aba Conta)', () => {
  it('mostra o que falta e o e-mail; as novidades vêm marcadas', () => {
    setup()
    expect(screen.getAllByText('Falta preencher')).toHaveLength(4)
    expect(screen.getByText('carol@exemplo.com')).toBeInTheDocument()
    expect(screen.getByLabelText('Receber novidades da Andreía pelo WhatsApp')).toBeChecked()
  })

  it('edita só o campo tocado: valida, formata o celular e grava', async () => {
    const { onSave } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Preencher celular (whatsapp)' }))
    const input = screen.getByLabelText('Celular (WhatsApp)')
    expect(input).toHaveFocus()
    fireEvent.change(input, { target: { value: '9876-5432' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(screen.getByText(/com DDD/)).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '41998765432' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    })
    expect(onSave).toHaveBeenCalledWith({ phone: '(41) 9 9876-5432' })
    expect(screen.getByRole('status')).toHaveTextContent('Salvo.')
  })

  it('se não der para gravar, avisa e mantém o campo aberto', async () => {
    setup(EMPTY_PROFILE, false)
    fireEvent.click(screen.getByRole('button', { name: 'Preencher como prefere ser chamado(a)' }))
    fireEvent.change(screen.getByLabelText('Como prefere ser chamado(a)'), {
      target: { value: 'Carol' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    })
    expect(screen.getByText(/Não deu para salvar agora/)).toBeInTheDocument()
    expect(screen.getByLabelText('Como prefere ser chamado(a)')).toHaveValue('Carol')
  })

  it('mostra a data por extenso e desmarcar as novidades grava na hora', async () => {
    const { onSave } = setup({ ...EMPTY_PROFILE, birthDate: '1988-03-14' })
    expect(screen.getByText('14 de março de 1988')).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Receber novidades da Andreía pelo WhatsApp'))
    })
    expect(onSave).toHaveBeenCalledWith({ news: false })
  })

  it('a foto escolhida é reduzida antes de gravar', async () => {
    const { onSave, compress } = setup()
    const file = new File(['x'], 'eu.jpg', { type: 'image/jpeg' })
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Pôr uma foto'), { target: { files: [file] } })
    })
    expect(compress).toHaveBeenCalledWith(file)
    expect(onSave).toHaveBeenCalledWith({ photo: 'data:image/webp;base64,AA' })
  })
})
