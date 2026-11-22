import siteJson from '../../../site.json'

export interface SiteInfo {
  site: string
  client: string
  version: string
}

const SEMVER = /^\d+\.\d+\.\d+$/

/** Garante que o `site.json` tem o formato esperado; um erro aqui derruba os testes do check antes do deploy. */
export function parseSiteInfo(raw: unknown): SiteInfo {
  if (typeof raw !== 'object' || raw === null) throw new Error('site.json inválido')
  const { site, client, version } = raw as Record<string, unknown>
  if (typeof site !== 'string' || typeof client !== 'string' || typeof version !== 'string') {
    throw new Error('site.json precisa de "site", "client" e "version" como texto')
  }
  if (!SEMVER.test(version))
    throw new Error(`Versão "${version}" fora do formato major.minor.patch`)
  return { site, client, version }
}

export const SITE = parseSiteInfo(siteJson)
