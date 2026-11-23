import type { ReactNode } from 'react'
import { useTerritories } from '../catalog/TerritoryContext'
import { BrandMark } from './BrandMark'
import type { BannerTone } from './bannerTones'
import { useBannerImage } from './useBannerImage'

type ProductBannerProps = (
  | /** A cor do território do produto (ADR-027). */ { territory: string; tone?: never }
  | /** Uma cor escolhida (capas de meditação, prévia de um território novo). */ {
      tone: BannerTone
      territory?: never
    }
) & {
  /** Imagem escolhida pela Andreía (`media/{id}`); enquanto carrega (ou sem ela), o fundo desenhado. */
  mediaId?: string | undefined
  /** Produto "Em breve": o desenho fica um pouco mais apagado. */
  muted?: boolean
  className?: string
  children?: ReactNode
}

export function ProductBanner({
  tone: chosenTone,
  territory,
  mediaId,
  muted = false,
  className = '',
  children,
}: ProductBannerProps) {
  const { territoryOf } = useTerritories()
  const tone = chosenTone ?? territoryOf(territory ?? '').tone
  const image = useBannerImage(mediaId)
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${muted ? 'grayscale-[0.35]' : ''}`}
        style={{ backgroundImage: `var(--tone-${tone})` }}
      >
        <BrandMark
          tone="banner"
          className="absolute -right-[8%] -bottom-[18%] w-[70%] opacity-50"
        />
      </div>
      {image && (
        <img
          src={image}
          alt=""
          className={`absolute inset-0 size-full animate-[fade-in_400ms_ease-out] object-cover ${muted ? 'grayscale-[0.35]' : ''}`}
        />
      )}
      {children}
    </div>
  )
}
