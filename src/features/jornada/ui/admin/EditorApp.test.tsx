import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createAccount } from '../../application/account'
import { createJourneyContent } from '../../application/JourneyContent'
import { createJourneyEditor } from '../../application/JourneyEditor'
import { createJourneyStore } from '../../application/JourneyStore'
import { createMediaCache } from '../../application/MediaCache'
import type { JourneyContentCache } from '../../application/ports'
import { chamaInterna21 } from '../../content/chama-interna-21'
import { createInMemoryBackend } from '../../infrastructure/InMemoryCloudBackend'
import { InMemoryProgressRepository } from '../../infrastructure/InMemoryProgressRepository'
import { JourneyApp } from '../JourneyApp'
import { JourneyContext } from '../JourneyContext'

const noCache: JourneyContentCache = { load: () => null, save: () => {} }

async function renderEditor({ admin = true } = {}) {
  const backend = createInMemoryBackend()
  if (admin) backend.admins.uids.add('google-uid')
  const store = createJourneyStore({ repository: new InMemoryProgressRepository() })
  const content = createJourneyContent({ fallback: chamaInterna21 })
  const account = createAccount({
    store,
    local: new InMemoryProgressRepository(),
    loadBackend: () => Promise.resolve(backend),
    hint: { get: () => false, set: () => {} },
  })
  await account.signInWithGoogle()
  await waitFor(() => expect(account.getSnapshot().user).not.toBeNull())
  if (admin) await waitFor(() => expect(account.getSnapshot().isAdmin).toBe(true))

  const media = createMediaCache(null)
  const createEditor = () =>
    createJourneyEditor({
      content,
      media,
      loadBackend: () => account.loadEditorBackend(),
      workingCopy: noCache,
      compressImage: () =>
        Promise.resolve({ dataUrl: 'data:image/webp;base64,AAA=', width: 800, height: 600 }),
    })
  render(
    <JourneyContext.Provider value={{ content, store, account, media, createEditor }}>
      <JourneyApp path="/jornada/editar" />
    </JourneyContext.Provider>,
  )
  return { backend }
}

const openDay1 = async () =>
  fireEvent.click(await screen.findByRole('button', { name: /Editar dia 1: O Estado/ }))

describe('Modo Andreía', () => {
  it('quem não é admin vê o aviso, não o editor', async () => {
    await renderEditor({ admin: false })
    expect(await screen.findByRole('heading', { name: 'Só para a admin' })).toBeVisible()
  })

  it('edita um dia no lugar, salva, publica e a versão aparece no histórico', async () => {
    const { backend } = await renderEditor()
    expect(await screen.findByRole('heading', { name: 'A Chama Interna' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Publicar jornada' })).toBeDisabled()

    await openDay1()
    fireEvent.change(screen.getByRole('textbox', { name: 'Título do dia' }), {
      target: { value: 'Título novo' },
    })
    expect(screen.getByText('Rascunho · alterações não salvas')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar dia' }))
    await screen.findByText(/Dia salvo/)
    expect(backend.editor.drafts.get(chamaInterna21.id)).toContain('Título novo')

    fireEvent.click(screen.getByRole('button', { name: 'Todos os dias' }))
    fireEvent.click(screen.getByRole('button', { name: 'Publicar jornada' }))
    const dialog = screen.getByRole('dialog', { name: 'Publicar a jornada?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }))
    await screen.findByText(/Jornada publicada/)
    expect(backend.editor.published.get(chamaInterna21.id)).toContain('Título novo')

    fireEvent.click(screen.getByRole('button', { name: 'Histórico' }))
    const drawer = screen.getByRole('dialog', { name: 'Histórico' })
    expect(within(drawer).getByText('Versão 1')).toBeVisible()
  })

  it('bloco de imagem: escolhe a foto, mostra a prévia e pede a descrição antes de salvar', async () => {
    const { backend } = await renderEditor()
    await openDay1()
    fireEvent.click(screen.getAllByRole('button', { name: 'Adicionar bloco aqui' }).at(-1)!)
    fireEvent.click(screen.getByRole('button', { name: /^Imagem/ }))

    const file = new File(['foto'], 'foto.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Escolher imagem'), { target: { files: [file] } })

    // Sem descrição ainda, a imagem é "decorativa" para o leitor de tela: procura pela fonte.
    await waitFor(() =>
      expect(document.querySelector('img[src="data:image/webp;base64,AAA="]')).not.toBeNull(),
    )
    expect(backend.editor.images.size).toBe(1)
    expect(screen.getByText(/descreva a imagem/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Salvar dia' })).toBeDisabled()

    fireEvent.change(screen.getByRole('textbox', { name: 'Descrição da imagem' }), {
      target: { value: 'Mãos sobre o peito' },
    })
    expect(screen.getByRole('button', { name: 'Salvar dia' })).toBeEnabled()
  })

  it('"Apagar dia" pede confirmação e tira o dia do quadro', async () => {
    const { backend } = await renderEditor()
    fireEvent.click(await screen.findByRole('button', { name: /Editar dia 21:/ }))
    fireEvent.click(screen.getByRole('button', { name: /Apagar dia/ }))

    const dialog = screen.getByRole('dialog', { name: 'Apagar o Dia 21?' })
    expect(within(dialog).getByText(/fica guardado/)).toBeVisible()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apagar dia' }))

    await screen.findByText(/Dia apagado/)
    expect(screen.queryByRole('button', { name: /Editar dia 21:/ })).toBeNull()
    expect(screen.getByText('20 de 20 dias salvos')).toBeVisible()
    expect(backend.editor.drafts.get(chamaInterna21.id)).toContain('"retiredDays":[21]')
  })

  it('a lixeira do cartão apaga o dia direto do quadro, com confirmação', async () => {
    await renderEditor()
    fireEvent.click(await screen.findByRole('button', { name: /Apagar dia 20:/ }))
    const dialog = screen.getByRole('dialog', { name: 'Apagar o Dia 20?' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apagar dia' }))

    await screen.findByText(/Dia apagado/)
    expect(screen.queryByRole('button', { name: /Editar dia 21:/ })).toBeNull()
    expect(screen.getByText('20 de 20 dias salvos')).toBeVisible()
  })

  it('o "+" entre blocos abre os ladrilhos e aponta o que falta para salvar', async () => {
    await renderEditor()
    await openDay1()
    const adders = screen.getAllByRole('button', { name: 'Adicionar bloco aqui' })
    fireEvent.click(adders.at(-1)!)
    fireEvent.click(screen.getByRole('button', { name: /^Vídeo/ }))

    expect(screen.getByRole('button', { name: 'Salvar dia' })).toBeDisabled()
    expect(screen.getByText(/cole um link que comece com https/)).toBeVisible()
  })
})
