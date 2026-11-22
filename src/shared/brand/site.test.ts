import { describe, expect, it } from 'vitest'
import packageJson from '../../../package.json'
import { BRAND_PERSON } from './links'
import { parseSiteInfo, SITE } from './site'

describe('versão do site', () => {
  it('lê o site.json com nome do site, cliente e versão', () => {
    expect(SITE.site).toBe('Atmavox')
    expect(SITE.client).toBe(BRAND_PERSON)
    expect(SITE.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('mantém a versão do package.json igual à do site.json', () => {
    expect(packageJson.version).toBe(SITE.version)
  })

  it('recusa versão fora do formato major.minor.patch', () => {
    expect(() => parseSiteInfo({ site: 'A', client: 'B', version: '1.0' })).toThrow()
  })

  it('recusa campos ausentes', () => {
    expect(() => parseSiteInfo({ site: 'A', version: '1.0.0' })).toThrow()
    expect(() => parseSiteInfo(null)).toThrow()
  })
})
