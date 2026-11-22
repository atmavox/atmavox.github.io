import { describe, expect, it } from 'vitest'
import { chamaInterna21 } from '../content/chama-interna-21'
import { START_STEP, VICTORIES_STEP } from '../domain/access'
import { emptyProgress, markStepDone, type JourneyProgress } from '../domain/progress'
import { furthestUnlockedTab, isTabUnlocked } from './tabAccess'

const withDays = (p: JourneyProgress, upTo: number): JourneyProgress => ({
  ...p,
  completedDays: Array.from({ length: upTo }, (_, i) => i + 1),
})
const started = markStepDone(emptyProgress(), START_STEP, 1)
const reviewIds = chamaInterna21.reviews.flatMap((r) => r.questions.map((q) => q.fieldId))

describe('abas em sequência', () => {
  it('no começo, só a Abertura está aberta', () => {
    expect(isTabUnlocked('abertura', chamaInterna21, emptyProgress())).toBe(true)
    expect(isTabUnlocked('semana-1', chamaInterna21, emptyProgress())).toBe(false)
    expect(furthestUnlockedTab(chamaInterna21, emptyProgress())).toBe('abertura')
  })

  it('"Começar a jornada" abre a Semana I; a Semana II só com os 7 dias concluídos', () => {
    expect(isTabUnlocked('semana-1', chamaInterna21, started)).toBe(true)
    expect(isTabUnlocked('semana-2', chamaInterna21, withDays(started, 6))).toBe(false)
    expect(isTabUnlocked('semana-2', chamaInterna21, withDays(started, 7))).toBe(true)
  })

  it('Revisões abrem depois da Semana III; Vitórias, depois das 11 perguntas feitas', () => {
    const all21 = withDays(started, 21)
    expect(isTabUnlocked('revisoes', chamaInterna21, withDays(started, 20))).toBe(false)
    expect(isTabUnlocked('revisoes', chamaInterna21, all21)).toBe(true)
    expect(isTabUnlocked('vitorias', chamaInterna21, all21)).toBe(false)
    const reviewsDone = reviewIds.reduce((p, id) => markStepDone(p, id, 1), all21)
    expect(isTabUnlocked('vitorias', chamaInterna21, reviewsDone)).toBe(true)
    expect(isTabUnlocked('encerramento', chamaInterna21, reviewsDone)).toBe(false)
    const victoriesDone = markStepDone(reviewsDone, VICTORIES_STEP, 1)
    expect(isTabUnlocked('encerramento', chamaInterna21, victoriesDone)).toBe(true)
    expect(furthestUnlockedTab(chamaInterna21, victoriesDone)).toBe('encerramento')
  })

  it('quem já usava uma aba antes da regra continua com ela aberta', () => {
    const legacy = { ...emptyProgress(), entries: { 'r7:q1': 'já respondido' } }
    expect(isTabUnlocked('revisoes', chamaInterna21, legacy)).toBe(true)
  })

  it('a admin abre qualquer aba', () => {
    expect(isTabUnlocked('encerramento', chamaInterna21, emptyProgress(), { bypass: true })).toBe(
      true,
    )
  })
})
