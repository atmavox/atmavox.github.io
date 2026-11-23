import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_MESSAGES,
  fillMessage,
  MESSAGE_FIELDS,
  MESSAGE_INFO,
  MESSAGE_KEYS,
  type MessageKey,
  type Messages,
} from '../../../../shared/ativacao/messages'
import { UiIcon } from '../../../../shared/ui/UiIcon'
import type { AtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import { adminButton, ghostButton, inputClass } from '../styles'
import { LoadingNote } from '../../../../shared/ui/LoadingNote'

/** Como cada mensagem fica, com um pedido de exemplo. */
const SAMPLE = {
  nome: 'Mariana Souza',
  apelido: 'Mari',
  terapia: 'Reiki a distância',
  data: 'quinta, 3 de dezembro',
  hora: '19h',
  pedido: 'A7KX2Q',
  link: 'atmavox.github.io/#/ativacao/confirmar/A7KX2Q',
}

/**
 * Mensagens prontas do WhatsApp (mock aprovado): a lista à esquerda, o texto e a prévia à direita
 * (no celular, cartões que abrem). Nada é enviado sozinho: o WhatsApp abre com o texto.
 */
export function MessagesPanel({ backend, isWide }: { backend: AtivacoesBackend; isWide: boolean }) {
  const [saved, setSaved] = useState<Messages | null>(null)
  const [messages, setMessages] = useState<Messages | null>(null)
  const [selected, setSelected] = useState<MessageKey>('approved')
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let cancelled = false
    void backend
      .loadMessages()
      .catch(() => DEFAULT_MESSAGES)
      .then((loaded) => {
        if (cancelled) return
        setSaved(loaded)
        setMessages(loaded)
      })
    return () => {
      cancelled = true
    }
  }, [backend])

  if (!messages || !saved) return <LoadingNote text="Carregando as mensagens…" />

  const isDirty = JSON.stringify(messages) !== JSON.stringify(saved)
  const set = (key: MessageKey, text: string) => {
    setMessages({ ...messages, [key]: text })
    setNotice(null)
  }

  /** Põe o campo onde está o cursor. */
  function insert(key: MessageKey, field: string) {
    const area = textRef.current
    const text = messages![key]
    const at = area ? area.selectionStart : text.length
    const end = area ? area.selectionEnd : text.length
    set(key, text.slice(0, at) + field + text.slice(end))
    requestAnimationFrame(() => {
      area?.focus()
      area?.setSelectionRange(at + field.length, at + field.length)
    })
  }

  async function save() {
    setIsSaving(true)
    try {
      await backend.saveMessages(messages!)
      setSaved(messages)
      setNotice('Salvo ✓')
    } catch {
      setNotice('Não deu para salvar. Confira a internet e tente de novo.')
    } finally {
      setIsSaving(false)
    }
  }

  const editor = (key: MessageKey) => (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-muted">Texto</span>
        <textarea
          ref={textRef}
          rows={isWide ? 6 : 5}
          value={messages[key]}
          onChange={(e) => set(key, e.target.value)}
          className={`${inputClass} py-2.5 leading-relaxed`}
        />
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm text-ink-faint">Inserir:</span>
        {MESSAGE_FIELDS.map((field) => (
          <button
            key={field}
            type="button"
            onClick={() => insert(key, field)}
            className="rounded-full border border-admin-ink/35 px-2.5 py-0.5 text-xs text-admin-ink hover:bg-admin/10"
          >
            {field}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-muted">Como fica</span>
        <p className="max-w-[460px] rounded-2xl rounded-br-sm bg-[color-mix(in_oklab,var(--ok)_14%,var(--surface))] px-3.5 py-3 text-sm leading-relaxed whitespace-pre-line text-ink">
          {fillMessage(messages[key], SAMPLE)}
        </p>
      </div>
      {messages[key] !== DEFAULT_MESSAGES[key] && (
        <button
          type="button"
          onClick={() => set(key, DEFAULT_MESSAGES[key])}
          className="self-start text-sm text-ink-faint hover:text-admin-ink"
        >
          Voltar ao texto de antes
        </button>
      )}
    </div>
  )

  const footer = (
    <div
      className={`sticky z-20 flex flex-wrap items-center justify-end gap-2.5 rounded-2xl border border-line bg-surface/95 px-4 py-3 backdrop-blur ${
        isWide ? 'bottom-4' : 'bottom-[76px]'
      }`}
    >
      {notice ? (
        <p
          role="status"
          className={`mr-auto text-sm ${notice.endsWith('✓') ? 'text-ok' : 'text-accent'}`}
        >
          {notice}
        </p>
      ) : (
        isDirty && <span className="mr-auto text-sm text-draft">Alterações não salvas</span>
      )}
      {isDirty && (
        <button type="button" onClick={() => setMessages(saved)} className={ghostButton}>
          Descartar
        </button>
      )}
      <button
        type="button"
        onClick={() => void save()}
        disabled={isSaving || !isDirty}
        className={adminButton}
      >
        {isSaving ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  )

  const hint = (
    <p className="text-sm text-ink-faint">
      Os textos abrem prontos no WhatsApp; nada é enviado sozinho. Se um dia ligarmos o robô oficial
      do WhatsApp, ele usa estes mesmos textos.
    </p>
  )

  if (isWide) {
    return (
      <div className="mx-auto flex w-full max-w-5xl animate-[page-in_400ms_ease-out] flex-col gap-4 px-7 py-7">
        <h1 className="font-display text-[2rem] text-ink">Mensagens</h1>
        {hint}
        <div className="grid grid-cols-[260px_minmax(0,1fr)] overflow-hidden rounded-[18px] border border-line bg-surface">
          <ul className="border-r border-line">
            {MESSAGE_KEYS.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  aria-current={selected === key ? 'true' : undefined}
                  onClick={() => setSelected(key)}
                  className={`flex w-full flex-col border-b border-line px-4 py-3 text-left transition-colors ${
                    selected === key
                      ? 'bg-admin/10 shadow-[inset_3px_0_0_var(--admin-ink)]'
                      : 'hover:bg-admin/5'
                  }`}
                >
                  <b className="text-sm text-ink">{MESSAGE_INFO[key].title}</b>
                  <span className="text-xs text-ink-faint">{MESSAGE_INFO[key].who}</span>
                </button>
              </li>
            ))}
          </ul>
          <div key={selected} className="flex animate-[page-in_300ms_ease-out] flex-col gap-3 p-6">
            <div>
              <h2 className="font-display text-2xl text-ink">{MESSAGE_INFO[selected].title}</h2>
              <p className="text-sm text-ink-faint">{MESSAGE_INFO[selected].who}</p>
            </div>
            {editor(selected)}
          </div>
        </div>
        {footer}
      </div>
    )
  }

  return (
    <div className="flex animate-[page-in_400ms_ease-out] flex-col gap-3 p-4">
      <h1 className="font-display text-[1.6rem] text-ink">Mensagens</h1>
      {hint}
      {MESSAGE_KEYS.map((key) => {
        const isOpen = selected === key
        return (
          <section
            key={key}
            className={`rounded-2xl border bg-surface ${isOpen ? 'border-admin-ink/60' : 'border-line'}`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setSelected(key)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span>
                <b className="block text-ink">{MESSAGE_INFO[key].title}</b>
                <span className="text-sm text-ink-faint">{MESSAGE_INFO[key].who}</span>
              </span>
              <UiIcon name={isOpen ? 'up' : 'down'} />
            </button>
            {isOpen && (
              <div className="animate-[page-in_300ms_ease-out] px-4 pb-4">{editor(key)}</div>
            )}
          </section>
        )
      })}
      {footer}
    </div>
  )
}
