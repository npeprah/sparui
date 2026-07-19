import { motion } from 'framer-motion'
import { Card, Button } from '../ui'
import { Avatar } from '../avatar'
import { staggerItem, getVariants } from '../../utils/animations'

interface PlayerProfileProps {
  playerName: string
  avatarId?: number
  totalGames: number
  totalWins: number
  onEditProfile: () => void
  className?: string
}

/**
 * PlayerProfile Component
 *
 * Displays player information with:
 * - Placeholder avatar (gradient circle with first letter)
 * - Username
 * - Stats: Total games, wins, win rate
 * - Edit Profile button
 */
export function PlayerProfile({ playerName, avatarId = 1, totalGames, totalWins, onEditProfile, className = '' }: PlayerProfileProps) {
  // Calculate win rate
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0

  const itemVariants = getVariants(staggerItem)

  return (
    <motion.div variants={itemVariants} className={className}>
      <Card padding="md" variant="elevated" className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gold/20">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar
              avatarId={avatarId}
              size="large"
              className="w-32 h-32 md:w-40 md:h-40 shadow-lg shadow-gold/50"
            />
          </div>

          {/* Player Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gold mb-4">{playerName || 'Guest'}</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
              {/* Total Games */}
              <div className="bg-gray-900/50 rounded-lg p-3 border border-iceBlue/20">
                <div className="text-2xl md:text-3xl font-bold text-iceBlue">{totalGames}</div>
                <div className="text-xs md:text-sm text-gray-400">Games Played</div>
              </div>

              {/* Total Wins */}
              <div className="bg-gray-900/50 rounded-lg p-3 border border-fireRed/20">
                <div className="text-2xl md:text-3xl font-bold text-fireRed">{totalWins}</div>
                <div className="text-xs md:text-sm text-gray-400">Wins</div>
              </div>

              {/* Win Rate */}
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gold/20">
                <div className="text-2xl md:text-3xl font-bold text-gold">{winRate}%</div>
                <div className="text-xs md:text-sm text-gray-400">Win Rate</div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <Button variant="ghost" size="sm" onClick={onEditProfile} className="w-full md:w-auto">
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
