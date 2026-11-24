import { describe, expect, it, vi } from 'vitest'
import { accountPrefill, applyAccountPrefill, largerPhoto } from './accountPrefill'
import { EMPTY_PROFILE } from './profile'

const GOOGLE = {
  displayName: '  Carolina   Rocha ',
  photoUrl: 'https://lh3.googleusercontent.com/a/abc=s96-c',
}
const FIRST_TIME = { profile: EMPTY_PROFILE, savedBefore: false }

describe('nome e foto da conta Google no primeiro cadastro', () => {
  it('puxa o nome (aparado) e a foto maior quando o cadastro está vazio', () => {
    expect(accountPrefill(FIRST_TIME, GOOGLE)).toEqual({
      fullName: 'Carolina Rocha',
      photoUrl: 'https://lh3.googleusercontent.com/a/abc=s320-c',
    })
  })

  it('não puxa nada depois que a pessoa já gravou os dados (foto removida não volta)', () => {
    expect(accountPrefill({ profile: EMPTY_PROFILE, savedBefore: true }, GOOGLE)).toEqual({})
  })

  it('não troca o que já está preenchido', () => {
    const profile = { ...EMPTY_PROFILE, fullName: 'Carol R.', photo: 'data:image/webp;base64,x' }
    expect(accountPrefill({ profile, savedBefore: false }, GOOGLE)).toEqual({})
  })

  it('conta de e-mail e senha não tem nome nem foto: nada a puxar', () => {
    expect(accountPrefill(FIRST_TIME, { displayName: null, photoUrl: null })).toEqual({})
  })

  it('deixa a URL como está quando não tem o tamanho no fim', () => {
    expect(largerPhoto('https://exemplo.com/foto.jpg')).toBe('https://exemplo.com/foto.jpg')
  })

  it('grava o nome e a foto já reduzida', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const loadPhoto = vi.fn().mockResolvedValue('data:image/webp;base64,foto')
    const change = await applyAccountPrefill(FIRST_TIME, GOOGLE, save, loadPhoto)
    expect(loadPhoto).toHaveBeenCalledWith('https://lh3.googleusercontent.com/a/abc=s320-c')
    expect(change).toEqual({ fullName: 'Carolina Rocha', photo: 'data:image/webp;base64,foto' })
    expect(save).toHaveBeenCalledWith(change)
  })

  it('se a foto não baixar, segue só com o nome', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const change = await applyAccountPrefill(
      FIRST_TIME,
      GOOGLE,
      save,
      vi.fn().mockRejectedValue(new Error('403')),
    )
    expect(change).toEqual({ fullName: 'Carolina Rocha' })
  })

  it('sem rede para gravar: devolve null e a tela fica como estava', async () => {
    const change = await applyAccountPrefill(
      FIRST_TIME,
      GOOGLE,
      vi.fn().mockRejectedValue(new Error('offline')),
      vi.fn().mockResolvedValue('data:image/webp;base64,foto'),
    )
    expect(change).toBeNull()
  })
})
