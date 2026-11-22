import { describe, expect, it } from 'vitest'
import { classifyMediaLink, hostOf, isAudioFileUrl, youtubeIdFromUrl } from './mediaLinks'

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

describe('classifyMediaLink', () => {
  it('YouTube vira miniatura; arquivo de áudio toca no site; o resto abre o site do link', () => {
    expect(classifyMediaLink('https://youtu.be/jKuKSAQUTCA')).toEqual({
      kind: 'youtube',
      videoId: 'jKuKSAQUTCA',
    })
    expect(classifyMediaLink('https://atmavox.github.io/audio/pratica.m4a')).toEqual({
      kind: 'audio-file',
      src: 'https://atmavox.github.io/audio/pratica.m4a',
    })
    expect(classifyMediaLink('https://drive.google.com/file/d/abc/view')).toEqual({
      kind: 'external',
      host: 'drive.google.com',
    })
  })

  it('só olha a extensão do caminho, não do texto todo', () => {
    expect(isAudioFileUrl('https://site.com/pagina?arquivo=a.mp3')).toBe(false)
    expect(isAudioFileUrl('https://site.com/a.MP3')).toBe(true)
  })
})
