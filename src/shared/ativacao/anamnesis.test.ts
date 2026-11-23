import { describe, expect, it } from 'vitest'
import {
  addQuestion,
  addSection,
  canRemoveSection,
  cleanAnamnesis,
  DEFAULT_ANAMNESIS,
  moveQuestion,
  moveSection,
  parseAnamnesis,
  removeQuestion,
  removeSection,
  restoreQuestion,
  savedIdsOf,
  updateQuestion,
  validateAnamnesis,
  type AnamnesisForm,
} from './anamnesis'

const ids = (form: AnamnesisForm) => form.sections.flatMap((s) => s.questions.map((q) => q.id))
const find = (form: AnamnesisForm, id: string) =>
  form.sections.flatMap((s) => s.questions).find((q) => q.id === id)

describe('modelo da anamnese', () => {
  it('começa com nome e telefone, e passa na validação', () => {
    expect(ids(DEFAULT_ANAMNESIS).slice(0, 2)).toEqual(['nome', 'telefone'])
    expect(validateAnamnesis(DEFAULT_ANAMNESIS)).toEqual({})
  })

  it('não tem ids repetidos', () => {
    const all = ids(DEFAULT_ANAMNESIS)
    expect(new Set(all).size).toBe(all.length)
  })
})

describe('parseAnamnesis', () => {
  it('lê o modelo de volta sem perder nada', () => {
    expect(parseAnamnesis(JSON.parse(JSON.stringify(DEFAULT_ANAMNESIS)))).toEqual(DEFAULT_ANAMNESIS)
  })

  it('devolve nome e telefone ao começo, mesmo que tenham sumido ou mudado de tipo', () => {
    const form = parseAnamnesis({
      sections: [
        {
          id: 'a',
          title: 'A',
          questions: [
            { id: 'cidade', label: 'Cidade', type: 'short' },
            { id: 'nome', label: 'Seu nome', type: 'long', required: false },
          ],
        },
      ],
      consent: 'Ok',
    })
    expect(ids(form!)).toEqual(['nome', 'telefone', 'cidade'])
    expect(find(form!, 'nome')).toMatchObject({ label: 'Seu nome', type: 'short', required: true })
  })

  it('ignora perguntas quebradas e ids repetidos', () => {
    const form = parseAnamnesis({
      sections: [
        {
          id: 'a',
          title: 'A',
          questions: [
            { id: 'x', label: 'X', type: 'short' },
            { id: 'x', label: 'De novo', type: 'short' },
            { id: 'y', label: 'Tipo estranho', type: 'cor' },
          ],
        },
      ],
    })
    expect(ids(form!)).toEqual(['nome', 'telefone', 'x'])
  })

  it('recusa o que não é formulário', () => {
    expect(parseAnamnesis('x')).toBeNull()
    expect(parseAnamnesis({})).toBeNull()
  })
})

describe('edição', () => {
  it('nome e telefone só mudam o texto, nunca o tipo nem a obrigatoriedade', () => {
    const form = updateQuestion(DEFAULT_ANAMNESIS, 'telefone', {
      label: 'Seu WhatsApp',
      type: 'short',
      required: false,
    })
    expect(find(form, 'telefone')).toMatchObject({
      label: 'Seu WhatsApp',
      type: 'phone',
      required: true,
    })
  })

  it('trocar o tipo cuida das opções', () => {
    const semOpcoes = updateQuestion(DEFAULT_ANAMNESIS, 'sono', { type: 'long' })
    expect(find(semOpcoes, 'sono')?.options).toEqual([])
    const comOpcoes = updateQuestion(DEFAULT_ANAMNESIS, 'cidade', { type: 'single' })
    expect(find(comOpcoes, 'cidade')?.options).toEqual(['', ''])
  })

  it('pergunta já salva vai para as guardadas; pergunta nova some', () => {
    const saved = savedIdsOf(DEFAULT_ANAMNESIS)
    const comNova = addQuestion(DEFAULT_ANAMNESIS, 'o-seu-momento', 'nova')
    const semNova = removeQuestion(comNova, 'nova', saved)
    expect(semNova.archived).toEqual([])
    const semSono = removeQuestion(DEFAULT_ANAMNESIS, 'sono', saved)
    expect(find(semSono, 'sono')).toBeUndefined()
    expect(semSono.archived.map((q) => q.id)).toEqual(['sono'])
    expect(ids(restoreQuestion(semSono, 'sono')).at(-1)).toBe('sono')
  })

  it('nome e telefone não saem do formulário', () => {
    const form = removeQuestion(DEFAULT_ANAMNESIS, 'nome', savedIdsOf(DEFAULT_ANAMNESIS))
    expect(find(form, 'nome')).toBeDefined()
  })

  it('nome e telefone ficam no começo da primeira seção', () => {
    expect(moveQuestion(DEFAULT_ANAMNESIS, 'seus-dados', 3, 0)).toEqual(DEFAULT_ANAMNESIS)
    const moved = moveQuestion(DEFAULT_ANAMNESIS, 'seus-dados', 4, 2)
    expect(ids(moved).slice(0, 4)).toEqual(['nome', 'telefone', 'cidade', 'apelido'])
  })

  it('a seção dos dados não sai nem muda de lugar; as outras guardam o que já foi salvo', () => {
    expect(canRemoveSection(DEFAULT_ANAMNESIS, 'seus-dados')).toBe(false)
    expect(moveSection(DEFAULT_ANAMNESIS, 0, 2)).toEqual(DEFAULT_ANAMNESIS)
    const form = removeSection(
      DEFAULT_ANAMNESIS,
      'energia-e-emocoes',
      savedIdsOf(DEFAULT_ANAMNESIS),
    )
    expect(form.sections.map((s) => s.id)).not.toContain('energia-e-emocoes')
    expect(form.archived.map((q) => q.id)).toEqual(['energia', 'sentimentos', 'sono'])
  })
})

describe('validação e limpeza', () => {
  it('aponta seção sem nome, pergunta vazia e opções de menos', () => {
    let form = addSection(DEFAULT_ANAMNESIS, 'nova-secao')
    form = addQuestion(form, 'nova-secao', 'p1')
    form = updateQuestion(form, 'cidade', { type: 'multi' })
    form = { ...form, consent: ' ' }
    expect(validateAnamnesis(form)).toEqual({
      'nova-secao': 'Dê um nome à seção.',
      p1: 'Escreva a pergunta.',
      cidade: 'Dê pelo menos duas opções.',
      consent: 'Escreva a frase de consentimento.',
    })
  })

  it('tira espaços e opções vazias antes de salvar', () => {
    const form = updateQuestion(DEFAULT_ANAMNESIS, 'sono', {
      label: '  Sono?  ',
      options: [' Bom ', '', 'Ruim'],
    })
    expect(find(cleanAnamnesis(form), 'sono')).toMatchObject({
      label: 'Sono?',
      options: ['Bom', 'Ruim'],
    })
  })
})
