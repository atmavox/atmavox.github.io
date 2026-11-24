/**
 * O * vermelho ao lado do rótulo de um campo obrigatório (pedido de 2026-11-24). Vem do CSS (`::after`)
 * para não entrar no nome do campo lido pelo leitor de tela; o campo leva `aria-required`.
 */
export const REQUIRED_MARK = "after:ml-0.5 after:text-required after:content-['*']"
