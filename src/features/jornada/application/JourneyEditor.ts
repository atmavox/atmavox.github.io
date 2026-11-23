// Estado do modo Andreía. Três versões da jornada convivem:
// - working: o que está na tela, com as edições ainda não salvas (fica no aparelho, não se perde)
// - saved: o rascunho salvo na nuvem ("Salvar dia"); as participantes ainda não veem
// - published: o que as participantes veem
// Mudanças de estrutura (novo dia, ordem dos dias, tema da semana) vão direto para o rascunho salvo.
import { allDays, type Journey, type JourneyDay } from '../domain/journey'
import {
  addDay as addDayTo,
  dayProblems,
  findDay,
  moveDay as moveDayIn,
  removeDay as removeDayFrom,
  replaceDay,
  sameDay,
  setOpening as setOpeningIn,
  setWeekTheme as setWeekThemeIn,
} from '../domain/journeyEditing'
import { parseJourney } from '../domain/parseJourney'
import type { JourneyContent } from './JourneyContent'
import type { MediaCache } from './MediaCache'
import type {
  ImageCompressor,
  JourneyContentCache,
  JourneyEditorBackend,
  VersionSummary,
} from './ports'

export type DayStatus = 'draft' | 'saved' | 'published'

export interface EditorState {
  status: 'loading' | 'ready' | 'error'
  working: Journey
  saved: Journey
  published: Journey
  versions: VersionSummary[]
  isBusy: boolean
  /** Última mensagem para a Andreía ("Dia salvo", erro de conexão…). */
  message: string | null
  /** Muda a cada mensagem nova, para o aviso reaparecer mesmo com o mesmo texto. */
  messageSeq: number
}

export interface JourneyEditor {
  getSnapshot(): EditorState
  subscribe(listener: () => void): () => void
  load(): Promise<void>
  editDay(day: JourneyDay): void
  saveDay(dayNumber: number): Promise<void>
  discardDay(dayNumber: number): void
  addDay(weekNumber: number): Promise<void>
  moveDay(dayNumber: number, delta: number): Promise<void>
  /** Tira o dia da jornada (vai para o rascunho salvo; sai do ar ao publicar). */
  removeDay(dayNumber: number): Promise<void>
  setWeekTheme(weekNumber: number, theme: string): Promise<void>
  /** Texto da Abertura de uma jornada nova. */
  setOpening(text: string): Promise<void>
  publish(): Promise<void>
  restoreVersion(versionId: string): Promise<void>
  /** Aviso curto vindo da tela (ex.: "Bloco removido"). */
  notify(message: string): void
  /** Reduz e grava a imagem escolhida; devolve o id para o bloco, ou null se não deu. */
  uploadImage(file: Blob): Promise<string | null>
}

export function dayStatus(state: EditorState, dayNumber: number): DayStatus {
  const working = findDay(state.working, dayNumber)
  const saved = findDay(state.saved, dayNumber)
  if (!sameDay(working, saved)) return 'draft'
  return sameDay(saved, findDay(state.published, dayNumber)) ? 'published' : 'saved'
}

export function draftDayCount(state: EditorState): number {
  return allDays(state.working).filter((day) => dayStatus(state, day.number) === 'draft').length
}

/** Pode publicar: nenhum dia em rascunho, nenhum problema e algo diferente do que está no ar. */
export function publishBlocker(state: EditorState): string | null {
  const drafts = draftDayCount(state)
  if (drafts > 0) {
    return drafts === 1
      ? 'Falta salvar 1 dia em rascunho.'
      : `Faltam salvar ${drafts} dias em rascunho.`
  }
  if (allDays(state.saved).some((day) => dayProblems(day).length > 0)) {
    return 'Há dias com campos para completar.'
  }
  if (JSON.stringify(state.saved) === JSON.stringify(state.published)) {
    return 'Tudo o que está salvo já está publicado.'
  }
  return null
}

interface Dependencies {
  content: JourneyContent
  loadBackend: () => Promise<JourneyEditorBackend>
  /** Cópia das edições não salvas no aparelho. */
  workingCopy: JourneyContentCache
  /** Sufixo único para ids novos (data em base 36 + sorteio). */
  newSuffix?: () => string
  compressImage?: ImageCompressor
  /** Recebe a imagem enviada, para a prévia aparecer sem buscar de novo. */
  media?: MediaCache
}

const IMAGE_ERROR = 'Não deu para usar este arquivo. Escolha uma foto (JPG, PNG, WebP ou HEIC).'
const CONNECTION_ERROR = 'Não foi possível falar com a nuvem. Verifique a internet e tente de novo.'

export function createJourneyEditor({
  content,
  loadBackend,
  workingCopy,
  newSuffix = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
  compressImage,
  media,
}: Dependencies): JourneyEditor {
  const initial = content.getSnapshot()
  const journeyId = initial.id
  let state: EditorState = {
    status: 'loading',
    working: initial,
    saved: initial,
    published: initial,
    versions: [],
    isBusy: false,
    message: null,
    messageSeq: 0,
  }
  const listeners = new Set<() => void>()

  function set(patch: Partial<EditorState>) {
    const isNewMessage = typeof patch.message === 'string'
    state = { ...state, ...patch, messageSeq: state.messageSeq + (isNewMessage ? 1 : 0) }
    listeners.forEach((listener) => listener())
  }

  const parse = (json: string | null): Journey | null => {
    if (json === null) return null
    try {
      const journey = parseJourney(JSON.parse(json))
      return journey?.id === journeyId ? journey : null
    } catch {
      return null
    }
  }

  function setWorking(working: Journey) {
    workingCopy.save(journeyId, JSON.stringify(working))
    set({ working })
  }

  /** Roda uma gravação na nuvem com "ocupado" e mensagem; erro vira aviso sem perder a tela. */
  async function remote(action: (backend: JourneyEditorBackend) => Promise<void>, done: string) {
    set({ isBusy: true, message: null })
    try {
      await action(await loadBackend())
      set({ isBusy: false, message: done })
    } catch {
      set({ isBusy: false, message: CONNECTION_ERROR })
    }
  }

  /** Mudança de estrutura: vale para a tela e para o rascunho salvo ao mesmo tempo. */
  function structural(change: (journey: Journey) => Journey, done: string) {
    const saved = change(state.saved)
    setWorking(change(state.working))
    set({ saved })
    return remote((backend) => backend.saveDraft(journeyId, JSON.stringify(saved)), done)
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    async load() {
      set({ status: 'loading' })
      try {
        const backend = await loadBackend()
        const published = content.getSnapshot()
        const [draftJson, versions] = await Promise.all([
          backend.loadDraft(journeyId),
          backend.listVersions(journeyId),
        ])
        const saved = parse(draftJson) ?? published
        const working = parse(workingCopy.load(journeyId)) ?? saved
        set({ status: 'ready', published, saved, working, versions })
      } catch {
        set({ status: 'error', message: CONNECTION_ERROR })
      }
    },

    editDay(day) {
      setWorking(replaceDay(state.working, day))
    },

    async saveDay(dayNumber) {
      const day = findDay(state.working, dayNumber)
      if (!day || dayProblems(day).length > 0) return
      const saved = replaceDay(state.saved, day)
      await remote(async (backend) => {
        await backend.saveDraft(journeyId, JSON.stringify(saved))
        set({ saved })
      }, 'Dia salvo. Ele entra no ar quando você publicar.')
    },

    discardDay(dayNumber) {
      const saved = findDay(state.saved, dayNumber)
      if (saved) setWorking(replaceDay(state.working, saved))
    },

    addDay: (weekNumber) => {
      const suffix = newSuffix()
      return structural((journey) => addDayTo(journey, weekNumber, suffix), 'Dia novo criado.')
    },

    removeDay: (dayNumber) =>
      structural(
        (journey) => removeDayFrom(journey, dayNumber),
        'Dia apagado. Ele sai da jornada quando você publicar.',
      ),

    moveDay: (dayNumber, delta) =>
      structural((journey) => moveDayIn(journey, dayNumber, delta), 'Ordem dos dias salva.'),

    setWeekTheme: (weekNumber, theme) =>
      structural((journey) => setWeekThemeIn(journey, weekNumber, theme), 'Tema salvo.'),

    setOpening: (text) =>
      structural((journey) => setOpeningIn(journey, text), 'Texto da Abertura salvo.'),

    async publish() {
      if (publishBlocker(state) !== null) return
      const saved = state.saved
      const json = JSON.stringify(saved)
      // Confere antes de gravar: o que não passar na leitura nunca chegaria às participantes.
      if (!parse(json)) {
        set({ message: 'Algo no conteúdo não está no formato certo. Nada foi publicado.' })
        return
      }
      await remote(async (backend) => {
        await backend.publish(journeyId, json)
        const versions = await backend.listVersions(journeyId)
        set({ published: saved, versions })
        void content.refresh()
      }, 'Jornada publicada. As participantes já veem a versão nova.')
    },

    notify(message) {
      set({ message })
    },

    async uploadImage(file) {
      if (!compressImage) return null
      set({ isBusy: true, message: null })
      let image
      try {
        image = await compressImage(file)
      } catch {
        set({ isBusy: false, message: IMAGE_ERROR })
        return null
      }
      try {
        const mediaId = await (await loadBackend()).saveImage(image)
        media?.put(mediaId, image.dataUrl)
        set({ isBusy: false, message: 'Imagem enviada.' })
        return mediaId
      } catch {
        set({ isBusy: false, message: CONNECTION_ERROR })
        return null
      }
    },

    async restoreVersion(versionId) {
      await remote(async (backend) => {
        const journey = parse(await backend.loadVersion(journeyId, versionId))
        if (!journey) throw new Error('versão ilegível')
        await backend.saveDraft(journeyId, JSON.stringify(journey))
        setWorking(journey)
        set({ saved: journey })
      }, 'Versão restaurada como rascunho salvo. Publique para colocar no ar.')
    },
  }
}
