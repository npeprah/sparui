import { Avatar } from '../avatar'
import { cn } from '../../utils/cn'

interface AvatarSelectorProps {
  selectedAvatarId: number
  onSelect: (avatarId: number) => void
  className?: string
}

const avatarData = [
  { id: 1, name: 'Kofi', description: 'Confident Leader', accent: '#FF4444' },
  { id: 2, name: 'Ama', description: 'Cool Strategist', accent: '#4444FF' },
  { id: 3, name: 'Kwame', description: 'Playful Challenger', accent: '#FFD700' },
  { id: 4, name: 'Yaa', description: 'Fierce Competitor', accent: '#8B008B' },
  { id: 5, name: 'Adjoa', description: 'Wise Veteran', accent: '#FFD700' },
]

export function AvatarSelector({
  selectedAvatarId,
  onSelect,
  className = '',
}: AvatarSelectorProps) {
  return (
    <div data-testid="avatar-selector" className={cn('space-y-4', className)}>
      <h2 className="text-2xl font-bold text-gold text-center">
        Choose Your Avatar
      </h2>

      <div
        data-testid="avatar-grid"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {avatarData.map((avatar) => (
          <div
            key={avatar.id}
            data-testid={`avatar-item-${avatar.id}`}
            className={cn(
              'flex flex-col items-center space-y-2 p-4 rounded-lg',
              'bg-gray-800/50 border-2 transition-all duration-200',
              'hover:bg-gray-700/50 hover:scale-105 hover:shadow-lg',
              'cursor-pointer',
              selectedAvatarId === avatar.id
                ? 'border-gold shadow-gold/50'
                : 'border-gray-700 hover:border-gray-600'
            )}
            onClick={() => onSelect(avatar.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(avatar.id)
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Select ${avatar.name} - ${avatar.description}`}
          >
            <Avatar
              avatarId={avatar.id}
              size="medium"
              isSelected={selectedAvatarId === avatar.id}
            />

            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">
                {avatar.name}
              </h3>
              <p className="text-sm text-gray-400">
                {avatar.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}