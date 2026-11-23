import { describe, expect, it } from 'vitest'
import type { MeditationProduct } from '../../shared/catalog/product'
import {
  availableMeditationFilters,
  filterMeditations,
  formatDuration,
  parseMeditationContent,
  toHubAudio,
} from './meditations'
import { meditationIdFromPath, hubSectionFromPath } from './navigation'
import { visibleProducts } from '../../shared/catalog/product'
import { seedCatalog } from '../../shared/catalog/seedCatalog'
import { isMeditation } from '../../shared/catalog/CatalogContext'

const allMeditations = visibleProducts(seedCatalog).filter(isMeditation)

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

describe('conteúdo de meditação paga', () => {
  it('aceita áudio ou vídeo, com e-book opcional, só por https', () => {
    expect(
      parseMeditationContent(
        JSON.stringify({ audioUrl: 'https://x.com/a.m4a', ebookUrl: 'https://drive/e' }),
      ),
    ).toEqual({ audioSrc: 'https://x.com/a.m4a', ebookUrl: 'https://drive/e' })
    expect(parseMeditationContent(JSON.stringify({ youtubeId: 'jKuKSAQUTCA' }))).toEqual({
      youtubeId: 'jKuKSAQUTCA',
    })
    expect(parseMeditationContent(JSON.stringify({ audioUrl: 'javascript:alert(1)' }))).toBeNull()
    expect(
      parseMeditationContent(
        JSON.stringify({ youtubeId: 'jKuKSAQUTCA', ebookUrl: 'http://inseguro' }),
      ),
    ).toEqual({ youtubeId: 'jKuKSAQUTCA' })
    expect(parseMeditationContent('não é json')).toBeNull()
  })

  it('"Minhas" mostra só as que a pessoa tem; o filtro só aparece com alguma', () => {
    const owned = new Set(['boas-vindas'])
    expect(filterMeditations(allMeditations, 'minhas', owned).map((m) => m.id)).toEqual([
      'boas-vindas',
    ])
    expect(availableMeditationFilters(allMeditations, { logged: true })).not.toContain('minhas')
    expect(availableMeditationFilters(allMeditations, { logged: true, owned })).toContain('minhas')
  })
})
