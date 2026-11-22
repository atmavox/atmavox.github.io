import { describe, expect, it } from 'vitest'
import { hostOf, youtubeIdFromUrl } from './youtube'

describe('youtubeIdFromUrl', () => {
  it('reconhece os formatos comuns de link', () => {
    expect(youtubeIdFromUrl('https://youtu.be/jKuKSAQUTCA')).toBe('jKuKSAQUTCA')
    expect(youtubeIdFromUrl('https://www.youtube.com/watch?v=jKuKSAQUTCA&t=3')).toBe('jKuKSAQUTCA')
    expect(youtubeIdFromUrl('https://youtube.com/shorts/jKuKSAQUTCA')).toBe('jKuKSAQUTCA')
  })

  it('devolve null para outros sites', () => {
    expect(youtubeIdFromUrl('https://vimeo.com/123')).toBeNull()
    expect(youtubeIdFromUrl('')).toBeNull()
  })
})

describe('hostOf', () => {
  it('mostra o site sem www, e vazio para link inválido', () => {
    expect(hostOf('https://www.instagram.com/p/x')).toBe('instagram.com')
    expect(hostOf('não é link')).toBe('')
  })
})
