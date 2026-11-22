import type { SyncStatus } from '../../application/account'

export const SYNC_TEXT: Record<SyncStatus, string> = {
  idle: 'Salvo neste aparelho',
  connecting: 'Conectando…',
  saving: 'Salvando…',
  saved: 'Salvo na nuvem',
  offline: 'Sem conexão — salvo no aparelho',
}

export const SYNC_DOT_CLASS: Record<SyncStatus, string> = {
  idle: 'bg-gray-state',
  connecting: 'bg-gold animate-pulse',
  saving: 'bg-gold animate-pulse',
  saved: 'bg-accent',
  offline: 'bg-wine ring-1 ring-ink-faint',
}
