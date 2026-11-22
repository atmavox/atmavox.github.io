import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createAccount } from '../../application/account'
import { createJourneyContent } from '../../application/JourneyContent'
import { createJourneyEditor } from '../../application/JourneyEditor'
import { createJourneyStore } from '../../application/JourneyStore'
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

  const createEditor = () =>
    createJourneyEditor({
      content,
      loadBackend: () => account.loadEditorBackend(),
      workingCopy: noCache,
    })
  render(
    <JourneyContext.Provider value={{ content, store, account, createEditor }}>
      <JourneyApp path="/jornada/editar" />
    </JourneyContext.Provider>,
  )
  return { backend }
}

describe('Modo Andreía', () => {
  it('quem não é admin vê o aviso, não o editor', async () => {
    await renderEditor({ admin: false })
    expect(await screen.findByRole('heading', { name: 'Só para a admin' })).toBeVisible()
  })

  it('edita um dia, salva e publica', async () => {
    const { backend } = await renderEditor()
    expect(await screen.findByRole('heading', { name: 'Editar a jornada' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Publicar jornada' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /O Estado que você não consegue/ }))
    fireEvent.change(screen.getByLabelText('Título do dia'), { target: { value: 'Título novo' } })
    expect(screen.getByText('Rascunho')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Salvar dia' }))
    await screen.findByText(/Dia salvo/)
    expect(backend.editor.drafts.get(chamaInterna21.id)).toContain('Título novo')

    fireEvent.click(screen.getByRole('button', { name: 'Todos os dias' }))
    fireEvent.click(screen.getByRole('button', { name: 'Publicar jornada' }))
    await screen.findByText(/Jornada publicada/)
    expect(backend.editor.published.get(chamaInterna21.id)).toContain('Título novo')
    expect(screen.getByRole('heading', { name: 'Publicações anteriores' })).toBeVisible()
  })

  it('adiciona um bloco pelo menu com ícones e aponta o que falta para salvar', async () => {
    await renderEditor()
    fireEvent.click(await screen.findByRole('button', { name: /O Estado que você não consegue/ }))
    fireEvent.click(screen.getByRole('button', { name: 'bloco' }))
    fireEvent.click(screen.getByRole('button', { name: /Vídeo/ }))

    expect(screen.getByRole('button', { name: 'Salvar dia' })).toBeDisabled()
    expect(screen.getByText(/cole um link que comece com https/)).toBeVisible()
  })
})
