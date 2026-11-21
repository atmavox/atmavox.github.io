import { EMOTIONS, MOODS, TOTAL_DAYS, type Emotion, type Mood } from './journey'

export const PROGRESS_VERSION = 1

export interface Victory {
  id: string
  /** Data escolhida pela pessoa (`AAAA-MM-DD`) ou vazio. */
  date: string
  day: number | null
  action: string
  result: string
  createdAt: number
}

/** Tudo o que a pessoa fez na jornada. Chaves de dia são o número do dia em texto ("1".."21"). */
export interface JourneyProgress {
  version: typeof PROGRESS_VERSION
  completedDays: number[]
  entries: Record<string, string>
  emotions: Record<string, Emotion[]>
  moods: Record<string, Mood>
  victories: Victory[]
  updatedAt: number
}

export function emptyProgress(): JourneyProgress {
  return {
    version: PROGRESS_VERSION,
    completedDays: [],
    entries: {},
    emotions: {},
    moods: {},
    victories: [],
    updatedAt: 0,
  }
}

export function isValidDay(day: unknown): day is number {
  return typeof day === 'number' && Number.isInteger(day) && day >= 1 && day <= TOTAL_DAYS
}

// ---------- comandos (puros: recebem o estado e devolvem um novo) ----------

export function toggleDay(progress: JourneyProgress, day: number, now: number): JourneyProgress {
  if (!isValidDay(day)) return progress
  const completedDays = progress.completedDays.includes(day)
    ? progress.completedDays.filter((d) => d !== day)
    : [...progress.completedDays, day].sort((a, b) => a - b)
  return { ...progress, completedDays, updatedAt: now }
}

/** Texto vazio remove a resposta, para que "vazio" signifique sempre "sem resposta". */
export function setEntry(
  progress: JourneyProgress,
  fieldId: string,
  text: string,
  now: number,
): JourneyProgress {
  const entries = { ...progress.entries }
  if (text.trim() === '') delete entries[fieldId]
  else entries[fieldId] = text
  return { ...progress, entries, updatedAt: now }
}

export function toggleEmotion(
  progress: JourneyProgress,
  day: number,
  emotion: Emotion,
  now: number,
): JourneyProgress {
  const key = String(day)
  const current = progress.emotions[key] ?? []
  const next = current.includes(emotion)
    ? current.filter((e) => e !== emotion)
    : EMOTIONS.filter((e) => e === emotion || current.includes(e))
  const emotions = { ...progress.emotions }
  if (next.length === 0) delete emotions[key]
  else emotions[key] = next
  return { ...progress, emotions, updatedAt: now }
}

export function setMood(
  progress: JourneyProgress,
  day: number,
  mood: Mood | null,
  now: number,
): JourneyProgress {
  const key = String(day)
  const moods = { ...progress.moods }
  if (mood === null) delete moods[key]
  else moods[key] = mood
  return { ...progress, moods, updatedAt: now }
}

export function addVictory(progress: JourneyProgress, victory: Victory): JourneyProgress {
  return {
    ...progress,
    victories: [victory, ...progress.victories],
    updatedAt: victory.createdAt,
  }
}

export function removeVictory(progress: JourneyProgress, id: string, now: number): JourneyProgress {
  return { ...progress, victories: progress.victories.filter((v) => v.id !== id), updatedAt: now }
}

// ---------- leitura de dados externos (localStorage, Firestore) ----------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEmotion(value: unknown): value is Emotion {
  return EMOTIONS.some((e) => e === value)
}

function isMood(value: unknown): value is Mood {
  return MOODS.some((m) => m.value === value)
}

function parseVictory(value: unknown): Victory | null {
  if (!isRecord(value)) return null
  const { id, date, day, action, result, createdAt } = value
  if (typeof id !== 'string' || typeof action !== 'string' || action.trim() === '') return null
  return {
    id,
    date: typeof date === 'string' ? date : '',
    day: isValidDay(day) ? day : null,
    action,
    result: typeof result === 'string' ? result : '',
    createdAt: typeof createdAt === 'number' ? createdAt : 0,
  }
}

/**
 * Lê qualquer coisa e devolve um progresso válido, descartando só o que estiver corrompido.
 * Nunca lança: perder um campo é melhor do que perder tudo. Migrações de ids entram aqui.
 */
export function parseProgress(raw: unknown): JourneyProgress {
  if (!isRecord(raw)) return emptyProgress()

  const completedDays = Array.isArray(raw.completedDays)
    ? [...new Set(raw.completedDays.filter(isValidDay))].sort((a, b) => a - b)
    : []

  const entries: Record<string, string> = {}
  if (isRecord(raw.entries)) {
    for (const [key, value] of Object.entries(raw.entries)) {
      if (typeof value === 'string' && value.trim() !== '') entries[key] = value
    }
  }

  const emotions: Record<string, Emotion[]> = {}
  if (isRecord(raw.emotions)) {
    for (const [key, value] of Object.entries(raw.emotions)) {
      if (!isValidDay(Number(key)) || !Array.isArray(value)) continue
      const valid = EMOTIONS.filter((e) => value.filter(isEmotion).includes(e))
      if (valid.length > 0) emotions[key] = valid
    }
  }

  const moods: Record<string, Mood> = {}
  if (isRecord(raw.moods)) {
    for (const [key, value] of Object.entries(raw.moods)) {
      if (isValidDay(Number(key)) && isMood(value)) moods[key] = value
    }
  }

  const victories = Array.isArray(raw.victories)
    ? raw.victories.map(parseVictory).filter((v): v is Victory => v !== null)
    : []

  return {
    version: PROGRESS_VERSION,
    completedDays,
    entries,
    emotions,
    moods,
    victories,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  }
}

// ---------- merge (aparelho + nuvem, ao fazer login) ----------

function mergeRecords<T>(
  local: Record<string, T>,
  remote: Record<string, T>,
  localIsNewer: boolean,
): Record<string, T> {
  const merged: Record<string, T> = {}
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const localValue = local[key]
    const remoteValue = remote[key]
    const value =
      localValue === undefined
        ? remoteValue
        : remoteValue === undefined
          ? localValue
          : localIsNewer
            ? localValue
            : remoteValue
    if (value !== undefined) merged[key] = value
  }
  return merged
}

/**
 * Dias e vitórias: união (nunca perde). Textos, emoções e humor: vence o lado que tem conteúdo; se os
 * dois têm, vence o progresso salvo mais recentemente. Valores vazios não existem nos registros
 * (ver setEntry), então um texto vazio nunca apaga um texto existente.
 */
export function mergeProgress(local: JourneyProgress, remote: JourneyProgress): JourneyProgress {
  const localIsNewer = local.updatedAt >= remote.updatedAt

  const victoriesById = new Map<string, Victory>()
  for (const victory of [...remote.victories, ...local.victories]) {
    victoriesById.set(victory.id, victory)
  }

  return {
    version: PROGRESS_VERSION,
    completedDays: [...new Set([...local.completedDays, ...remote.completedDays])].sort(
      (a, b) => a - b,
    ),
    entries: mergeRecords(local.entries, remote.entries, localIsNewer),
    emotions: mergeRecords(local.emotions, remote.emotions, localIsNewer),
    moods: mergeRecords(local.moods, remote.moods, localIsNewer),
    victories: [...victoriesById.values()].sort((a, b) => b.createdAt - a.createdAt),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  }
}
