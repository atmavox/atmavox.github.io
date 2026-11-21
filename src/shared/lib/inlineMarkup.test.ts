import { describe, expect, it } from 'vitest'
import { parseInlineMarkup } from './inlineMarkup'

describe('parseInlineMarkup', () => {
  it('devolve texto simples como um único nó', () => {
    expect(parseInlineMarkup('Respire.')).toEqual([{ type: 'text', text: 'Respire.' }])
  })

  it('reconhece negrito e itálico', () => {
    expect(parseInlineMarkup('Isso tem nome: **Estado Cinza.** e *presença*')).toEqual([
      { type: 'text', text: 'Isso tem nome: ' },
      { type: 'strong', children: [{ type: 'text', text: 'Estado Cinza.' }] },
      { type: 'text', text: ' e ' },
      { type: 'em', children: [{ type: 'text', text: 'presença' }] },
    ])
  })

  it('reconhece link com itálico dentro', () => {
    expect(parseInlineMarkup('Ouça [*Retorne ao Seu Centro*](https://youtu.be/x) agora')).toEqual([
      { type: 'text', text: 'Ouça ' },
      {
        type: 'link',
        href: 'https://youtu.be/x',
        children: [{ type: 'em', children: [{ type: 'text', text: 'Retorne ao Seu Centro' }] }],
      },
      { type: 'text', text: ' agora' },
    ])
  })

  it('aceita rotas internas e mantém colchetes sem link como texto', () => {
    expect(parseInlineMarkup('**[colchetes]** e [aba](#/jornada/encerramento)')).toEqual([
      { type: 'strong', children: [{ type: 'text', text: '[colchetes]' }] },
      { type: 'text', text: ' e ' },
      { type: 'link', href: '#/jornada/encerramento', children: [{ type: 'text', text: 'aba' }] },
    ])
  })

  it('não cria links com esquemas perigosos', () => {
    expect(parseInlineMarkup('[clique](javascript:alert(1))')).toEqual([
      { type: 'text', text: '[clique](javascript:alert(1))' },
    ])
  })
})
