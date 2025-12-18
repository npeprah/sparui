import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePlayerStore, useUIStore, useLobbyStore } from '../store'
import { socketService } from '../services/socketService'
import { Button, Modal } from '../components/ui'
import { pageVariants, staggerContainer, staggerItem, getVariants } from '../utils/animations'

function HomePage() {
  const navigate = useNavigate()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [isCreatingLobby, setIsCreatingLobby] = useState(false)
  const [isJoiningLobby, setIsJoiningLobby] = useState(false)

  const playerId = usePlayerStore((state) => state.playerId)
  const playerName = usePlayerStore((state) => state.playerName)
  const totalWins = usePlayerStore((state) => state.totalWins)
  const totalGames = usePlayerStore((state) => state.totalGames)
  const openSettings = useUIStore((state) => state.openSettings)
  const addNotification = useUIStore((state) => state.addNotification)

  const { setIsConnecting, reset: resetLobby } = useLobbyStore()

  // Generate player ID if not exists
  const getOrCreatePlayerId = () => {
    if (playerId) return playerId
    const newId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    usePlayerStore.getState().setPlayerId(newId)
    return newId
  }

  const handleCreatePrivateGame = () => {
    setIsCreatingLobby(true)
    resetLobby()
    setIsConnecting(true)

    socketService.connect()
    const id = getOrCreatePlayerId()

    socketService.emit('lobby:create', {
      hostId: id,
      maxPlayers: 4,
      pointsToWin: 10,
      surfaceTheme: 'poker',
    })

    addNotification({
      type: 'info',
      message: 'Creating lobby...',
    })

    navigate('/lobby')
    setIsCreatingLobby(false)
  }

  const handleJoinPrivateGame = () => {
    const trimmedCode = roomCodeInput.trim().toUpperCase()

    if (!trimmedCode || trimmedCode.length !== 6) {
      addNotification({
        type: 'error',
        message: 'Please enter a valid 6-character room code',
      })
      return
    }

    setIsJoiningLobby(true)
    resetLobby()
    setIsConnecting(true)

    socketService.connect()
    const id = getOrCreatePlayerId()

    socketService.emit('lobby:join', {
      roomCode: trimmedCode,
      playerId: id,
      username: playerName,
    })

    addNotification({
      type: 'info',
      message: `Joining lobby ${trimmedCode}...`,
    })

    setShowJoinModal(false)
    setRoomCodeInput('')
    navigate('/lobby')
    setIsJoiningLobby(false)
  }

  const handleQuickMatch = () => {
    addNotification({
      type: 'info',
      message: 'Quick Match coming soon! Use Private Game for now.',
    })
  }

  const handlePlayVsAI = () => {
    addNotification({
      type: 'info',
      message: 'AI mode coming soon!',
    })
  }

  // Get animation variants with reduced motion support
  const page = getVariants(pageVariants)
  const container = getVariants(staggerContainer)
  const item = getVariants(staggerItem)

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 text-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      variants={page}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Title with stagger animation */}
      <motion.div variants={container} initial="hidden" animate="visible">
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-fireRed via-gold to-iceBlue bg-clip-text text-transparent"
          variants={item}
        >
          SPAR
        </motion.h1>
        <motion.p className="text-lg sm:text-xl text-iceBlue mb-6 md:mb-8" variants={item}>
          Ghanaian Card Game
        </motion.p>
      </motion.div>

      {/* Buttons with stagger animation */}
      <motion.div
        className="flex flex-col gap-3 md:gap-4 w-full max-w-md"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={item}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleQuickMatch}
            fullWidth
            disabled={isCreatingLobby || isJoiningLobby}
          >
            Quick Match
          </Button>
        </motion.div>
        <motion.div variants={item}>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleCreatePrivateGame}
            fullWidth
            disabled={isCreatingLobby || isJoiningLobby}
          >
            {isCreatingLobby ? 'Creating...' : 'Create Private Game'}
          </Button>
        </motion.div>
        <motion.div variants={item}>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowJoinModal(true)}
            fullWidth
            disabled={isCreatingLobby || isJoiningLobby}
          >
            Join Private Game
          </Button>
        </motion.div>
        <motion.div variants={item}>
          <Button
            variant="primary"
            size="lg"
            onClick={handlePlayVsAI}
            fullWidth
            disabled={isCreatingLobby || isJoiningLobby}
            className="bg-iceBlue hover:bg-opacity-80 text-gray-900"
          >
            Play vs AI
          </Button>
        </motion.div>
        <motion.div variants={item}>
          <Button variant="ghost" size="lg" onClick={openSettings} fullWidth>
            Settings
          </Button>
        </motion.div>
      </motion.div>

      {/* Player stats with fade in */}
      <motion.div
        className="mt-6 md:mt-8 flex gap-4 md:gap-8 text-xs md:text-sm text-gray-400"
        variants={item}
        initial="hidden"
        animate="visible"
      >
        <div>
          <p className="font-bold text-white">{playerName}</p>
          <p>
            Wins: {totalWins} / {totalGames}
          </p>
        </div>
      </motion.div>

      {/* Join Room Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join Private Game" size="sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="room-code" className="block text-sm font-medium text-gray-300 mb-2">
              Enter Room Code
            </label>
            <input
              id="room-code"
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="XK9P2L"
              maxLength={6}
              className="w-full px-4 py-3 md:py-4 bg-gray-700 text-white rounded-lg border-2 border-transparent focus:border-iceBlue focus:outline-none text-center text-xl md:text-2xl font-mono tracking-wider min-h-[56px]"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">Enter the 6-character room code from your friend</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setShowJoinModal(false)
                setRoomCodeInput('')
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleJoinPrivateGame}
              fullWidth
              disabled={isJoiningLobby || roomCodeInput.trim().length !== 6}
            >
              {isJoiningLobby ? 'Joining...' : 'Join Lobby'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}

export default HomePage
