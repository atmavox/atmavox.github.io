// Mensagens prontas do WhatsApp da ativação individual (ADR-029, tela Mensagens do Modo Andreía).
// Guardadas em `catalog/messages` (leitura pública: a pessoa usa a de "pagou"). Os campos entre
// chaves se preenchem sozinhos; se um dia houver robô oficial, ele usa os mesmos textos.

export const MESSAGE_KEYS = ['paid', 'approved', 'other', 'reminder'] as const
export type MessageKey = (typeof MESSAGE_KEYS)[number]

export type Messages = Record<MessageKey, string>

export const MESSAGE_INFO: Record<MessageKey, { title: string; who: string }> = {
  paid: { title: 'Quando a pessoa paga', who: 'Enviada pela pessoa' },
  approved: { title: 'Horário aprovado', who: 'Enviada pela Andreía' },
  other: { title: 'Sugerir outro horário', who: 'Enviada pela Andreía' },
  reminder: { title: 'Lembrete (1 dia antes)', who: 'Enviada pela Andreía' },
}

export const MESSAGE_FIELDS = [
  '{nome}',
  '{apelido}',
  '{terapia}',
  '{data}',
  '{hora}',
  '{pedido}',
  '{link}',
] as const

export const DEFAULT_MESSAGES: Messages = {
  paid: 'Olá, Andreía! Acabei de pagar uma ativação pelo site.\nPedido: {pedido}\nTerapia: {terapia}\nNome: {nome}\nData que prefiro: {data}, às {hora}',
  approved:
    'Oi, {apelido}! Seu horário de {terapia} está aprovado: {data}, às {hora}. Toque para confirmar: {link}',
  other:
    'Oi, {apelido}! O horário que você escolheu não vai dar. Que tal {data}, às {hora}? Se for bom, toque para confirmar: {link}',
  reminder: 'Oi, {apelido}! Amanhã é o nosso encontro de {terapia}, às {hora}. Até lá!',
}

export interface MessageValues {
  nome: string
  apelido: string
  terapia: string
  data: string
  hora: string
  pedido: string
  link: string
}

/** Troca os campos pelos valores; campo desconhecido fica como está. */
export function fillMessage(template: string, values: MessageValues): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? values[key as keyof MessageValues] : whole,
  )
}

/** O `content` de `catalog/messages`; o que faltar ou estiver vazio vem do padrão. */
export function parseMessages(raw: unknown): Messages {
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  return Object.fromEntries(
    MESSAGE_KEYS.map((key) => {
      const value = r[key]
      return [key, typeof value === 'string' && value.trim() ? value : DEFAULT_MESSAGES[key]]
    }),
  ) as Messages
}
