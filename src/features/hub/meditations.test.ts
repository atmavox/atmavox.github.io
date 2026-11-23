import { describe, expect, it } from 'vitest'
import type { MeditationProduct } from '../../shared/catalog/product'
import {
  allMeditations,
  availableMeditationFilters,
  filterMeditations,
  formatDuration,
  toHubAudio,
} from './meditations'
import { meditationIdFromPath, hubSectionFromPath } from './navigation'

const base = allMeditations[0]!
const withEbook: MeditationProduct = { ...base, id: 'com-ebook', ebook: { pages: 24 } }

describe('meditações do hub', () => {
  it('formata a duração', () => {
    expect(formatDuration(48)).toBe('48 s')
    expect(formatDuration(67)).toBe('1 min')
    expect(formatDuration(300)).toBe('5 min')
  })

  it('as gratuitas trazem o link certo: áudio no player, vídeo no YouTube', () => {
    expect(toHubAudio(allMeditations.find((m) => m.id === 'boas-vindas')!)).toMatchObject({
      audioSrc: '/audio/atmavox-boas-vindas.m4a',
      meta: 'Áudio · 1 min',
    })
    expect(toHubAudio(allMeditations.find((m) => m.id === 'retorne-ao-seu-centro')!)).toMatchObject(
      { youtubeId: 'jKuKSAQUTCA', kind: 'video' },
    )
  })

  it('filtra por tipo e por e-book, e só oferece filtros que mostram algo', () => {
    const list = [...allMeditations, withEbook]
    expect(filterMeditations(list, 'ebook').map((m) => m.id)).toEqual(['com-ebook'])
    expect(filterMeditations(list, 'video').every((m) => m.media === 'video')).toBe(true)
    expect(availableMeditationFilters(allMeditations)).not.toContain('ebook')
    expect(availableMeditationFilters(list)).toContain('ebook')
  })

  it('lê a rota da página de uma meditação', () => {
    expect(meditationIdFromPath('/meditacao/boas-vindas')).toBe('boas-vindas')
    expect(meditationIdFromPath('/meditacoes')).toBeNull()
    expect(hubSectionFromPath('/meditacao/boas-vindas')).toBe('meditacoes')
  })
})
