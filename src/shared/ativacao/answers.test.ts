import { describe, expect, it } from 'vitest'
import { DEFAULT_ANAMNESIS } from './anamnesis'
import {
  answerError,
  answeredCount,
  answersFor,
  formatPhone,
  initialAnswers,
  isPhone,
  parseSavedAnamnesis,
  sectionErrors,
} from './answers'

const [dados, momento] = DEFAULT_ANAMNESIS.sections
const pergunta = (id: string) =>
  DEFAULT_ANAMNESIS.sections.flatMap((s) => s.questions).find((q) => q.id === id)!

describe('telefone', () => {
  it('aceita celular e fixo com DDD, com ou sem +55', () => {
    expect(isPhone('(41) 9 9876-5432')).toBe(true)
    expect(isPhone('+55 41 99876-5432')).toBe(true)
    expect(isPhone('41 3333-4444')).toBe(true)
    expect(isPhone('99876-5432')).toBe(false)
  })

  it('escreve no jeito de sempre', () => {
    expect(formatPhone('41998765432')).toBe('(41) 9 9876-5432')
    expect(formatPhone('4133334444')).toBe('(41) 3333-4444')
    expect(formatPhone('123')).toBe('123')
  })
})

describe('respostas', () => {
  it('o nome da conta entra preenchido, sem apagar o que a pessoa escreveu', () => {
    expect(initialAnswers(null, ' Mariana Souza ')).toEqual({ nome: 'Mariana Souza' })
    const saved = { answers: { nome: 'Mari S.' }, consent: true, updatedAt: 1 }
    expect(initialAnswers(saved, 'Mariana Souza').nome).toBe('Mari S.')
  })

  it('pede o obrigatório e confere telefone e data', () => {
    expect(answerError(pergunta('cidade'), '  ')).toBe('Responda esta pergunta para seguir.')
    expect(answerError(pergunta('apelido'), undefined)).toBeNull()
    expect(answerError(pergunta('telefone'), '9876')).toMatch(/DDD/)
    expect(answerError(pergunta('nascimento'), '14/03')).toBe('Escolha a data.')
    expect(answerError(pergunta('energia'), 0)).toBeNull()
    expect(answerError(pergunta('areas'), [])).toBe('Responda esta pergunta para seguir.')
  })

  it('confere uma seção inteira', () => {
    const errors = sectionErrors(dados!, { nome: 'Mariana', telefone: '41998765432' })
    expect(Object.keys(errors)).toEqual(['nascimento', 'cidade', 'origem'])
    expect(sectionErrors(momento!, { motivo: 'x', areas: ['Trabalho'], palavra: 'leve' })).toEqual(
      {},
    )
  })

  it('conta e guarda só o que é do formulário', () => {
    const answers = { nome: 'Mariana', energia: 4, antiga: 'x' }
    expect(answeredCount(DEFAULT_ANAMNESIS, answers)).toBe(2)
    expect(answersFor(DEFAULT_ANAMNESIS, answers)).toEqual({ nome: 'Mariana', energia: 4 })
  })

  it('lê o que veio da conta, ignorando o que não é resposta', () => {
    expect(
      parseSavedAnamnesis({
        answers: { nome: 'Mariana', energia: 4, areas: ['Trabalho'], ruim: { a: 1 } },
        consent: true,
        updatedAt: 5,
      }),
    ).toEqual({
      answers: { nome: 'Mariana', energia: 4, areas: ['Trabalho'] },
      consent: true,
      updatedAt: 5,
    })
    expect(parseSavedAnamnesis('x')).toBeNull()
  })
})
