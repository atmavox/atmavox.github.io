import { describe, expect, it } from 'vitest'
import { recordOpened } from './useRecordOpened'

describe('quem abriu o conteúdo', () => {
  it('grava só a data da última vez, no documento da própria pessoa', async () => {
    const calls: { url: string; body: unknown }[] = []
    const fetchFn = async (url: string, init?: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init?.body)) })
      return new Response('{}', { status: 200 })
    }
    await recordOpened({ projectId: 'p', apiKey: 'k' }, 'ana', 't', 'retorne', 42, fetchFn)
    expect(calls[0]?.url).toContain('/documents/users/ana/opened/retorne')
    expect(calls[0]?.body).toEqual({ fields: { lastOpenedAt: { integerValue: '42' } } })
  })
})
