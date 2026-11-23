import type { ReactNode } from 'react'
import { BrandMark } from '../../../shared/ui/BrandMark'
import type { BannerTone } from './bannerTones'

interface ProductBannerProps {
  tone: BannerTone
  /** Produto "Em breve": o desenho fica um pouco mais apagado. */
  muted?: boolean
  className?: string
  children?: ReactNode
}

export function ProductBanner({
  tone,
  muted = false,
  className = '',
  children,
}: ProductBannerProps) {
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
      {children}
    </div>
  )
}
