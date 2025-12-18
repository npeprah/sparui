import { motion } from 'framer-motion'
import type { LobbyPlayer } from '../../store/types'
import { playerJoinVariants, pulseVariants, getVariants } from '../../utils/animations'

interface PlayerSlotProps {
  player: LobbyPlayer | null
  slotNumber: number
  isCurrentPlayer?: boolean
}

export function PlayerSlot({ player, slotNumber, isCurrentPlayer = false }: PlayerSlotProps) {
  // Get animation variants with reduced motion support
  const joinVariants = getVariants(playerJoinVariants)
  const pulse = getVariants(pulseVariants)

  if (!player) {
    return (
      <div className="bg-gray-700 rounded-lg p-4 flex items-center gap-4 opacity-50 border-2 border-transparent">
        <div className="w-14 h-14 bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-gray-500 text-xl">{slotNumber}</span>
        </div>
        <div>
          <p className="text-gray-400 font-medium">Waiting for player...</p>
          <p className="text-xs text-gray-500">Empty slot</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={`bg-gray-700 rounded-lg p-4 flex items-center gap-4 transition-all border-2 ${
        player.isHost
          ? 'border-gold'
          : player.isReady
            ? 'border-green-500'
            : 'border-transparent'
      } ${isCurrentPlayer ? 'ring-2 ring-iceBlue' : ''}`}
      variants={joinVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      {/* Avatar */}
      <div className="relative">
        <motion.div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${
            player.isReady ? 'bg-green-600' : 'bg-fireRed'
          }`}
          animate={player.isReady ? 'pulse' : 'initial'}
          variants={pulse}
        >
          {player.avatar ? (
            <img
              src={player.avatar}
              alt={player.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span>{player.username.charAt(0).toUpperCase()}</span>
          )}
        </motion.div>
        {player.isHost && (
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-gold rounded-full flex items-center justify-center text-xs"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            👑
          </motion.div>
        )}
      </div>

      {/* Player Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-white">
            {player.username}
            {isCurrentPlayer && <span className="text-iceBlue text-sm ml-1">(You)</span>}
          </p>
          {player.isHost && <span className="text-xs text-gold">HOST</span>}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {player.isReady ? (
            <motion.span
              className="text-xs text-green-400 font-medium"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              ✓ Ready
            </motion.span>
          ) : (
            <span className="text-xs text-gray-400">Not Ready</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
