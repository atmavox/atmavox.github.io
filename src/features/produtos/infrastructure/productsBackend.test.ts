import { describe, expect, it, vi } from 'vitest'
import { createProductsBackend } from './productsBackend'

describe('gravações do Modo Andreía por REST', () => {
  const config = { projectId: 'p', apiKey: 'k' }

  it('guarda a imagem do banner em media e devolve o id criado', async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ name: 'projects/p/databases/(default)/documents/media/abc123' }),
        ),
    )
    const backend = createProductsBackend(
      config,
      async () => 'tok',
      fetchFn,
      () => 7,
    )
    const id = await backend.saveImage({
      dataUrl: 'data:image/webp;base64,AAAA',
      width: 1200,
      height: 675,
    })
    expect(id).toBe('abc123')
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/documents/media?key=k')
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body)).fields.width).toEqual({ integerValue: '1200' })
  })

  it('sem login não grava nada', async () => {
    const fetchFn = vi.fn()
    const backend = createProductsBackend(config, async () => null, fetchFn)
    await expect(backend.saveCatalog([])).rejects.toThrow('Sem login.')
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('quem não é admin (ou sem rede) não passa na conferência', async () => {
    const backend = createProductsBackend(
      config,
      async () => 'tok',
      async () => new Response('', { status: 404 }),
    )
    expect(await backend.isAdmin('uid-ana')).toBe(false)
  })
})
