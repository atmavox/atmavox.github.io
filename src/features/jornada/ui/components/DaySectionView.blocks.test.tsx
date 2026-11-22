import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { createAudioPlayer } from '../../../../shared/media/audioPlayer'
import { FakeAudio } from '../../../../shared/media/FakeAudio'
import { setAudioPlayerForTests } from '../../../../shared/media/useAudioPlayer'
import type { DaySection } from '../../domain/journey'
import { DaySectionView } from './DaySectionView'

const show = (section: DaySection) => render(<DaySectionView day={1} section={section} />)

describe('blocos do Modo Andreía na tela da participante', () => {
  afterEach(() => setAudioPlayerForTests(null))

  it('texto, citação e divisor aparecem com a marcação da marca', () => {
    show({ type: 'text', id: 'd1:t', text: 'Um texto **forte**.' })
    expect(screen.getByText('forte').tagName).toBe('STRONG')
    show({ type: 'quote', id: 'd1:q', text: 'Uma frase.' })
    expect(screen.getByText('Uma frase.').closest('blockquote')).not.toBeNull()
    show({ type: 'divider', id: 'd1:d' })
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('vídeo do YouTube mostra só a miniatura até tocar', () => {
    show({
      type: 'video',
      id: 'd1:v',
      label: 'Para assistir',
      title: 'Retorne ao Seu Centro',
      url: 'https://youtu.be/jKuKSAQUTCA',
    })
    expect(screen.getByText('Para assistir')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Assistir: Retorne ao Seu Centro' })).toBeVisible()
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('link de outro site abre lá, numa aba nova e segura', () => {
    show({
      type: 'audio',
      id: 'd1:a',
      label: 'Para ouvir',
      title: 'Prática guiada',
      url: 'https://drive.google.com/file/d/abc/view',
    })
    const link = screen.getByRole('link', { name: /Prática guiada/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveTextContent('Ouvir')
    expect(link).toHaveTextContent('drive.google.com')
  })

  it('arquivo de áudio toca no player do site', () => {
    const player = createAudioPlayer(new FakeAudio())
    setAudioPlayerForTests(player)
    show({
      type: 'audio',
      id: 'd1:a',
      label: 'Para ouvir',
      title: 'Respiração',
      url: 'https://atmavox.github.io/audio/respiracao.m4a',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ouvir: Respiração' }))
    expect(player.getSnapshot().track).toMatchObject({ id: 'd1:a', title: 'Respiração' })
  })
})
