import { describe, expect, it, vi } from 'vitest'
import { createFirestoreRestJourneySource } from './FirestoreRestJourneySource'

const config = { projectId: 'atmavox-teste', apiKey: 'chave-de-teste' }
const reply = (status: number, body: unknown = {}) =>
  vi.fn<(url: string) => Promise<Response>>(() =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  )

describe('FirestoreRestJourneySource', () => {
  it('lê o campo content do documento publicado', async () => {
    const fetchFn = reply(200, { fields: { content: { stringValue: '{"id":"x"}' } } })
    const source = createFirestoreRestJourneySource(config, fetchFn)

    await expect(source.load('chama-interna-21')).resolves.toBe('{"id":"x"}')
    expect(String(fetchFn.mock.calls[0]?.[0])).toContain(
      '/projects/atmavox-teste/databases/(default)/documents/published/chama-interna-21?key=',
    )
  })

  it('devolve null quando ainda não há nada publicado', async () => {
    const source = createFirestoreRestJourneySource(config, reply(404))
    await expect(source.load('chama-interna-21')).resolves.toBeNull()
  })

  it('avisa o erro quando a nuvem falha (quem chama mantém o conteúdo atual)', async () => {
    const source = createFirestoreRestJourneySource(config, reply(503))
    await expect(source.load('chama-interna-21')).rejects.toThrow('503')
  })
})
