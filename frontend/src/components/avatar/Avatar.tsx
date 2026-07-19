import { useState } from 'react'
import { cn } from '../../utils/cn'
import styles from './Avatar.module.css'

export interface AvatarProps {
  avatarId: number
  size?: 'small' | 'medium' | 'large'
  className?: string
  isSelected?: boolean
  onClick?: (avatarId: number) => void
}

const sizeClasses = {
  small: 'w-16 h-16', // 64px (game table, leaderboard)
  medium: 'w-32 h-32', // 128px (lobby, player slots)
  large: 'w-64 h-64', // 256px (profile, settings)
}

const avatarData = {
  1: { name: 'Kofi', description: 'Confident Leader', accent: '#FF4444' },
  2: { name: 'Ama', description: 'Cool Strategist', accent: '#4444FF' },
  3: { name: 'Kwame', description: 'Playful Challenger', accent: '#FFD700' },
  4: { name: 'Yaa', description: 'Fierce Competitor', accent: '#8B008B' },
  5: { name: 'Adjoa', description: 'Wise Veteran', accent: '#FFD700' },
}

export function Avatar({
  avatarId,
  size = 'medium',
  className = '',
  isSelected = false,
  onClick,
}: AvatarProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const avatar = avatarData[avatarId as keyof typeof avatarData] || {
    name: 'Default',
    description: 'Avatar',
    accent: '#666666',
  }

  const altText =
    avatarId in avatarData ? `${avatar.name} - ${avatar.description}` : 'Default Avatar'

  const imagePath =
    avatarId >= 1 && avatarId <= 5
      ? `/assets/avatars/avatar_0${avatarId}.svg`
      : '/assets/avatars/default.svg'

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleClick = () => {
    if (onClick) {
      onClick(avatarId)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick(avatarId)
    }
  }

  return (
    <div
      data-testid="avatar-container"
      className={cn(
        styles.avatar,
        'relative rounded-full overflow-hidden',
        sizeClasses[size],
        isSelected && styles['avatar--selected'],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `Select ${altText}` : undefined}
      style={
        {
          '--avatar-border-color': isSelected ? '#FFD700' : avatar.accent,
        } as React.CSSProperties
      }
    >
      {isLoading && (
        <div
          data-testid="avatar-loading"
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900"
        >
          <div className="animate-pulse text-white text-2xl font-bold">{avatar.name[0]}</div>
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
          <span className="text-white text-2xl font-bold">{avatar.name[0]}</span>
        </div>
      ) : (
        <img
          src={imagePath}
          alt={altText}
          role="img"
          className={cn('w-full h-full object-cover', isLoading && 'invisible')}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  )
}
