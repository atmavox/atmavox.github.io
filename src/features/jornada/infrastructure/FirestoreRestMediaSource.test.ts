import { describe, expect, it, vi } from 'vitest'
import { createFirestoreRestMediaSource } from './FirestoreRestMediaSource'

const config = { projectId: 'atmavox-teste', apiKey: 'chave-de-teste' }
const reply = (status: number, body: unknown = {}) =>
  vi.fn<(url: string) => Promise<Response>>(() =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  )

describe('FirestoreRestMediaSource', () => {
  it('lê a imagem de media/{id} como data URL', async () => {
    const fetchFn = reply(200, {
      fields: { dataUrl: { stringValue: 'data:image/webp;base64,AAA=' } },
    })
    const source = createFirestoreRestMediaSource(config, fetchFn)
    await expect(source.loadImage('m1')).resolves.toBe('data:image/webp;base64,AAA=')
    expect(String(fetchFn.mock.calls[0]?.[0])).toContain('/documents/media/m1?key=')
  })

  it('ignora o que não for uma imagem (nada de outro tipo de conteúdo vindo do banco)', async () => {
    const source = createFirestoreRestMediaSource(
      config,
      reply(200, { fields: { dataUrl: { stringValue: 'javascript:alert(1)' } } }),
    )
    await expect(source.loadImage('m1')).resolves.toBeNull()
  })

  it('imagem que não existe vira null', async () => {
    const source = createFirestoreRestMediaSource(config, reply(404))
    await expect(source.loadImage('m1')).resolves.toBeNull()
  })
})
