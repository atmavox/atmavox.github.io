import { useRecordOpened } from './useRecordOpened'

/**
 * Posto onde o conteúdo aparece de fato (a jornada aberta, a meditação com o player): registra que a
 * pessoa logada acessou. Não desenha nada.
 */
export function RecordOpened({ productId }: { productId: string }) {
  useRecordOpened(productId)
  return null
}
