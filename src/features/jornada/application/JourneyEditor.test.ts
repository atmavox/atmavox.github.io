import { describe, expect, it } from 'vitest'
import { chamaInterna21 } from '../content/chama-interna-21'
import { allDays } from '../domain/journey'
import { findDay } from '../domain/journeyEditing'
import { InMemoryEditorBackend } from '../infrastructure/InMemoryCloudBackend'
import { createJourneyContent } from './JourneyContent'
import { createJourneyEditor, dayStatus, draftDayCount, publishBlocker } from './JourneyEditor'
import type { JourneyContentCache } from './ports'

function memoryCache(): JourneyContentCache & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, load: (id) => data.get(id) ?? null, save: (id, json) => void data.set(id, json) }
}

async function setup({ backend = new InMemoryEditorBackend(), workingCopy = memoryCache() } = {}) {
  const content = createJourneyContent({ fallback: chamaInterna21 })
  const editor = createJourneyEditor({
    content,
    loadBackend: () => Promise.resolve(backend),
    workingCopy,
    newSuffix: () => 'n1',
  })
  await editor.load()
  return { editor, backend, workingCopy }
}

const day1 = allDays(chamaInterna21)[0]!
const renamed = { ...day1, title: 'Título novo' }

describe('JourneyEditor', () => {
  it('começa com tudo publicado e nada para publicar', async () => {
    const { editor } = await setup()
    const state = editor.getSnapshot()
    expect(state.status).toBe('ready')
    expect(dayStatus(state, 1)).toBe('published')
    expect(publishBlocker(state)).toBe('Tudo o que está salvo já está publicado.')
  })

  it('editar deixa o dia em rascunho e bloqueia a publicação', async () => {
    const { editor, workingCopy } = await setup()
    editor.editDay(renamed)
    const state = editor.getSnapshot()
    expect(dayStatus(state, 1)).toBe('draft')
    expect(draftDayCount(state)).toBe(1)
    expect(publishBlocker(state)).toBe('Falta salvar 1 dia em rascunho.')
    expect(workingCopy.data.has(chamaInterna21.id)).toBe(true)
  })

  it('"Salvar dia" grava o rascunho na nuvem; "Publicar" coloca no ar e guarda no histórico', async () => {
    const { editor, backend } = await setup()
    editor.editDay(renamed)
    await editor.saveDay(1)
    expect(dayStatus(editor.getSnapshot(), 1)).toBe('saved')
    expect(backend.drafts.get(chamaInterna21.id)).toContain('Título novo')
    expect(publishBlocker(editor.getSnapshot())).toBeNull()

    await editor.publish()
    const state = editor.getSnapshot()
    expect(dayStatus(state, 1)).toBe('published')
    expect(backend.published.get(chamaInterna21.id)).toContain('Título novo')
    expect(state.versions).toHaveLength(1)
  })

  it('"Descartar" volta o dia para o que estava salvo', async () => {
    const { editor } = await setup()
    editor.editDay(renamed)
    editor.discardDay(1)
    expect(dayStatus(editor.getSnapshot(), 1)).toBe('published')
  })

  it('não salva um dia com problemas (ex.: título vazio)', async () => {
    const { editor, backend } = await setup()
    editor.editDay({ ...day1, title: '' })
    await editor.saveDay(1)
    expect(backend.drafts.size).toBe(0)
    expect(dayStatus(editor.getSnapshot(), 1)).toBe('draft')
  })

  it('edições não salvas sobrevivem a fechar e abrir de novo', async () => {
    const workingCopy = memoryCache()
    const first = await setup({ workingCopy })
    first.editor.editDay(renamed)
    const second = await setup({ workingCopy, backend: first.backend })
    expect(findDay(second.editor.getSnapshot().working, 1)?.title).toBe('Título novo')
  })

  it('dia novo vai direto para o rascunho salvo, mas precisa ser completado antes de publicar', async () => {
    const { editor, backend } = await setup()
    await editor.addDay(1)
    const state = editor.getSnapshot()
    expect(findDay(state.saved, 22)?.title).toBe('Novo dia')
    expect(backend.drafts.get(chamaInterna21.id)).toContain('"number":22')
    expect(publishBlocker(state)).toBe('Há dias com campos para completar.')
  })

  it('restaurar uma versão antiga vira o rascunho salvo', async () => {
    const { editor } = await setup()
    editor.editDay(renamed)
    await editor.saveDay(1)
    await editor.publish()
    const firstVersion = editor.getSnapshot().versions[0]!.id
    editor.editDay({ ...renamed, title: 'Outro título' })
    await editor.saveDay(1)
    await editor.publish()

    await editor.restoreVersion(firstVersion)
    const state = editor.getSnapshot()
    expect(findDay(state.saved, 1)?.title).toBe('Título novo')
    expect(dayStatus(state, 1)).toBe('saved')
  })

  it('sem conexão, avisa e mantém as edições na tela', async () => {
    const { editor, backend } = await setup()
    editor.editDay(renamed)
    backend.isOffline = true
    await editor.saveDay(1)
    const state = editor.getSnapshot()
    expect(state.message).toMatch(/Não foi possível falar com a nuvem/)
    expect(dayStatus(state, 1)).toBe('draft')
  })
})
