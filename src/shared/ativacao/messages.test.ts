import { describe, expect, it } from 'vitest'
import { DEFAULT_MESSAGES, fillMessage, parseMessages } from './messages'

describe('mensagens prontas', () => {
  it('preenche os campos e deixa o que não conhece', () => {
    expect(
      fillMessage('Oi, {apelido}! {terapia} em {data}, às {hora}. {outro}', {
        nome: 'Mariana Souza',
        apelido: 'Mari',
        terapia: 'Reiki',
        data: 'quinta, 3 de dezembro',
        hora: '19h',
        pedido: 'A7KX2Q',
        link: 'https://x',
      }),
    ).toBe('Oi, Mari! Reiki em quinta, 3 de dezembro, às 19h. {outro}')
  })

  it('o que faltar ou estiver vazio vem do padrão', () => {
    expect(parseMessages({ approved: 'Aprovado!', other: '  ' })).toEqual({
      ...DEFAULT_MESSAGES,
      approved: 'Aprovado!',
    })
    expect(parseMessages(null)).toEqual(DEFAULT_MESSAGES)
  })
})
