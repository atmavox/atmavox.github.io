import { describe, expect, it, vi } from 'vitest'
import { createMediaCache } from './MediaCache'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('MediaCache', () => {
  it('busca cada imagem uma vez só e avisa a tela quando chega', async () => {
    const loadImage = vi.fn(() => Promise.resolve('data:image/webp;base64,AAA'))
    const cache = createMediaCache({ loadImage })
    const listener = vi.fn()
    cache.subscribe(listener)

    cache.request('m1')
    cache.request('m1')
    expect(cache.get('m1')).toBeUndefined()
    await flush()

    expect(cache.get('m1')).toBe('data:image/webp;base64,AAA')
    expect(loadImage).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('falha ou imagem inexistente viram null (a tela não mostra nada)', async () => {
    const cache = createMediaCache({ loadImage: () => Promise.reject(new Error('rede')) })
    cache.request('m1')
    await flush()
    expect(cache.get('m1')).toBeNull()

    const offline = createMediaCache(null)
    offline.request('m2')
    expect(offline.get('m2')).toBeNull()
  })

  it('a imagem recém-enviada entra direto, sem buscar', () => {
    const loadImage = vi.fn(() => Promise.resolve(null))
    const cache = createMediaCache({ loadImage })
    cache.put('m1', 'data:image/webp;base64,BBB')
    cache.request('m1')
    expect(cache.get('m1')).toBe('data:image/webp;base64,BBB')
    expect(loadImage).not.toHaveBeenCalled()
  })
})
