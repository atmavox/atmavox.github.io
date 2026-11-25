import { describe, expect, it } from 'vitest'
import { orderIdFromPath, sectionFromPath } from './sections'

describe('endereços das ativações', () => {
  it('o link da agenda abre a tela de pedidos já com o pedido', () => {
    expect(sectionFromPath('/admin/ativacoes/pedidos/A7KX2Q')).toBe('pedidos')
    expect(orderIdFromPath('/admin/ativacoes/pedidos/A7KX2Q')).toBe('A7KX2Q')
    expect(orderIdFromPath('/admin/ativacoes/pedidos')).toBeNull()
    expect(orderIdFromPath('/admin/ativacoes/agenda/A7KX2Q')).toBeNull()
  })
})
