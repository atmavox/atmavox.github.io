import { describe, expect, it, vi } from 'vitest'
import { EMPTY_PROFILE } from './profile'
import { createRestProfileSource } from './profileSource'

const config = { projectId: 'p', apiKey: 'k' }

describe('dados do perfil no Firestore', () => {
  it('lê os campos de users/{uid}; sem documento, perfil vazio', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            fields: {
              fullName: { stringValue: 'Carolina Rocha' },
              phone: { stringValue: '(41) 9 9876-5432' },
              news: { booleanValue: false },
              profileUpdatedAt: { integerValue: '42' },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(new Response('', { status: 404 }))
    const source = createRestProfileSource(config, async () => 't', fetchFn)
    expect(await source.load('u1')).toEqual({
      profile: {
        ...EMPTY_PROFILE,
        fullName: 'Carolina Rocha',
        phone: '(41) 9 9876-5432',
        news: false,
      },
      savedBefore: true,
    })
    expect(String(fetchFn.mock.calls[0]?.[0])).toContain('documents/users/u1?')
    expect(await source.load('u2')).toEqual({ profile: EMPTY_PROFILE, savedBefore: false })
  })

  it('documento só com o e-mail do login: ainda não gravou os dados', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ fields: { email: { stringValue: 'a@b.c' } } })),
      )
    const source = createRestProfileSource(config, async () => 't', fetchFn)
    expect((await source.load('u1')).savedBefore).toBe(false)
  })

  it('grava só o que mudou, com a data da mudança', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('{}'))
    const source = createRestProfileSource(config, async () => 't', fetchFn)
    await source.save('u1', { phone: '(41) 9 9876-5432', news: false })
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('updateMask.fieldPaths=phone')
    expect(url).toContain('updateMask.fieldPaths=news')
    expect(url).toContain('updateMask.fieldPaths=profileUpdatedAt')
    expect(url).not.toContain('fieldPaths=fullName')
    const body = JSON.parse(String(init.body)) as { fields: Record<string, unknown> }
    expect(body.fields.news).toEqual({ booleanValue: false })
  })
})
