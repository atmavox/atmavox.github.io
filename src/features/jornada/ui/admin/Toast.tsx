/** Aviso curto no rodapé ("Dia salvo"). A `key` muda a cada mensagem, então a animação recomeça. */
export function Toast({ message, seq }: { message: string | null; seq: number }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none">
      {message && (
        <p
          key={seq}
          className="fixed bottom-6 left-1/2 z-50 max-w-[calc(100vw-2rem)] rounded-full bg-ink px-5 py-2.5 text-center text-sm text-bg shadow-lg [animation:toast_4s_ease_forwards]"
        >
          {message}
        </p>
      )}
    </div>
  )
}
