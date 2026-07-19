import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePlayerStore, useUIStore, useLobbyStore } from '../store'
import { socketService } from '../services/socketService'
import { Button, Modal } from '../components/ui'
import { PlayerProfile, PulseButton } from '../components/home'
import { SettingsModal } from '../components/settings'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { pageVariants, staggerContainer, staggerItem, getVariants } from '../utils/animations'

// Helper function to extract avatar ID from avatar string
function getAvatarIdFromString(avatar: string | undefined): number {
  if (!avatar) return 1
  // Extract number from avatar_01, avatar_02, etc.
  const match = avatar.match(/avatar_0(\d)/)
  return match ? parseInt(match[1], 10) : 1
}

function HomePage() {
  const navigate = useNavigate()
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [isCreatingLobby, setIsCreatingLobby] = useState(false)
  const [isJoiningLobby, setIsJoiningLobby] = useState(false)

  const playerId = usePlayerStore((state) => state.playerId)
  const playerName = usePlayerStore((state) => state.playerName)
  const avatar = usePlayerStore((state) => state.avatar)
  const token = usePlayerStore((state) => state.token)
  const totalWins = usePlayerStore((state) => state.totalWins)
  const totalGames = usePlayerStore((state) => state.totalGames)
  const openSettings = useUIStore((state) => state.openSettings)
  const addNotification = useUIStore((state) => state.addNotification)

  const { setIsConnecting, reset: resetLobby } = useLobbyStore()

  // Responsive breakpoints
  const { isMobile, isTablet } = useMediaQuery()

  // Generate player ID if not exists
  const getOrCreatePlayerId = () => {
    if (playerId) return playerId
    const newId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    usePlayerStore.getState().setPlayerId(newId)
    return newId
  }

  // Get or create auth token
  const getOrCreateToken = () => {
    if (token) return token
    // For now, generate a simple token (in production, this would come from backend auth)
    // Put random string FIRST so backend gets unique player IDs (uses first 8 chars)
    const randomStr = Math.random().toString(36).substring(2, 15)
    const newToken = `${randomStr}-${Date.now()}`
    usePlayerStore.getState().setToken(newToken)
    return newToken
  }

  const handleCreatePrivateGame = () => {
    setIsCreatingLobby(true)
    resetLobby()
    setIsConnecting(true)

    // Get or create auth token
    const authToken = getOrCreateToken()

    // Connect with authentication
    socketService.connect(authToken)

    // Listen for auth:success to get backend-assigned playerId
    const handleAuthSuccess = (data: any) => {
      console.log('Auth success, backend assigned playerId:', data.playerId)
      // Store the backend-assigned playerId (critical for matching in players arrays)
      usePlayerStore.getState().setPlayerId(data.playerId)
      socketService.off('auth:success', handleAuthSuccess)
    }

    socketService.on('auth:success', handleAuthSuccess)

    // Listen for room:created event, then navigate
    const handleRoomCreated = (data: any) => {
      console.log('Room created successfully:', data)

      // Get the backend-assigned playerId
      const backendPlayerId = usePlayerStore.getState().playerId

      // Update Zustand store with room data BEFORE navigating
      const lobbyStore = useLobbyStore.getState()
      lobbyStore.setRoomCode(data.roomCode)
      lobbyStore.setHostId(data.hostId)
      lobbyStore.setIsHost(data.hostId === backendPlayerId)
      lobbyStore.setIsInLobby(true)
      lobbyStore.setIsConnecting(false)

      // Add self as first player
      lobbyStore.addPlayer({
        id: backendPlayerId,
        username: playerName,
        isReady: false,
        isHost: true,
      })

      socketService.off('room:created', handleRoomCreated)
      setIsCreatingLobby(false)
      navigate('/lobby')
    }

    socketService.on('room:created', handleRoomCreated)

    // Match backend API spec - only send settings
    socketService.emit('lobby:create', {
      maxPlayers: 4,
      pointsToWin: 10,
      surfaceTheme: 'afro-heritage',
    })

    addNotification({
      type: 'info',
      message: 'Creating lobby...',
    })
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

    // Get or create auth token
    const authToken = getOrCreateToken()

    // Connect with authentication
    socketService.connect(authToken)

    // Listen for auth:success to get backend-assigned playerId
    const handleAuthSuccess = (data: any) => {
      console.log('Auth success (join), backend assigned playerId:', data.playerId)
      // Store the backend-assigned playerId (critical for matching in players arrays)
      usePlayerStore.getState().setPlayerId(data.playerId)
      socketService.off('auth:success', handleAuthSuccess)
    }

    socketService.on('auth:success', handleAuthSuccess)

    // Listen for room:player_joined event, then navigate
    const handlePlayerJoined = (data: any) => {
      console.log('Successfully joined room:', data)

      // Get the backend-assigned playerId
      const backendPlayerId = usePlayerStore.getState().playerId

      // Update Zustand store with room data BEFORE navigating
      const lobbyStore = useLobbyStore.getState()
      lobbyStore.setRoomCode(data.roomCode)
      lobbyStore.setCurrentPlayers(data.players)
      lobbyStore.setIsInLobby(true)
      lobbyStore.setIsConnecting(false)

      // Determine if current player is host
      const hostPlayer = data.players.find((p: any) => p.isHost)
      if (hostPlayer) {
        lobbyStore.setHostId(hostPlayer.id)
        lobbyStore.setIsHost(hostPlayer.id === backendPlayerId)
      }

      socketService.off('room:player_joined', handlePlayerJoined)
      socketService.off('lobby:error', handleJoinError)
      setIsJoiningLobby(false)
      setShowJoinModal(false)
      setRoomCodeInput('')
      navigate('/lobby')
    }

    // Listen for join errors
    const handleJoinError = (data: any) => {
      console.error('Failed to join room:', data.error)
      socketService.off('room:player_joined', handlePlayerJoined)
      socketService.off('lobby:error', handleJoinError)
      setIsJoiningLobby(false)
      setIsConnecting(false)
      addNotification({
        type: 'error',
        message: data.error || 'Failed to join room',
      })
    }

    socketService.on('room:player_joined', handlePlayerJoined)
    socketService.on('lobby:error', handleJoinError)

    // Match backend API spec - only send roomCode
    socketService.emit('lobby:join', {
      roomCode: trimmedCode,
    })

    addNotification({
      type: 'info',
      message: `Joining lobby ${trimmedCode}...`,
    })
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
      className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-deepPurple via-gray-900 to-gray-900"
      variants={page}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="w-full max-w-6xl mx-auto">
        {/* Title with stagger animation */}
        <motion.div variants={container} initial="hidden" animate="visible" className="text-center mb-8 md:mb-12">
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl font-black mb-3 md:mb-4 bg-gradient-to-r from-fireRed via-gold to-iceBlue bg-clip-text text-transparent drop-shadow-lg"
            variants={item}
          >
            SPAR
          </motion.h1>
          <motion.p className="text-xl sm:text-2xl text-iceBlue font-bold tracking-wide" variants={item}>
            Ghanaian Card Game
          </motion.p>
        </motion.div>

        {/* Main Content Grid */}
        <motion.div
          className={`grid gap-6 md:gap-8 ${
            isMobile
              ? 'grid-cols-1'
              : isTablet
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 lg:grid-cols-[1.2fr_1fr]'
          }`}
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {/* Left Column: Player Profile + Menu */}
          <motion.div variants={item} className="space-y-6">
            {/* Player Profile */}
            <PlayerProfile
              playerName={playerName}
              avatarId={getAvatarIdFromString(avatar)}
              totalGames={totalGames}
              totalWins={totalWins}
              onEditProfile={openSettings}
            />

            {/* Primary Action: Quick Match with Pulse Animation */}
            <PulseButton disabled={isCreatingLobby || isJoiningLobby}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleQuickMatch}
                fullWidth
                disabled={isCreatingLobby || isJoiningLobby}
                className="shadow-lg shadow-fireRed/50 hover:shadow-xl hover:shadow-fireRed/60 transition-shadow"
                aria-label="Start Quick Match - Find a random opponent"
              >
                <span className="text-2xl font-black tracking-wide">⚡ QUICK MATCH ⚡</span>
              </Button>
            </PulseButton>
          </motion.div>

          {/* Right Column: Game Mode Buttons */}
          <motion.div variants={item} className="flex flex-col gap-3 md:gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleCreatePrivateGame}
              fullWidth
              disabled={isCreatingLobby || isJoiningLobby}
              className="shadow-md shadow-deepPurple/30 hover:shadow-lg hover:shadow-deepPurple/50 transition-shadow"
              aria-label="Create a private game room"
            >
              {isCreatingLobby ? '⏳ Creating...' : '🎮 Create Private Game'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowJoinModal(true)}
              fullWidth
              disabled={isCreatingLobby || isJoiningLobby}
              className="shadow-md shadow-deepPurple/30 hover:shadow-lg hover:shadow-deepPurple/50 transition-shadow"
              aria-label="Join a friend's private game"
            >
              🔗 Join Private Game
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handlePlayVsAI}
              fullWidth
              disabled={isCreatingLobby || isJoiningLobby}
              className="bg-gradient-to-r from-iceBlue to-blue-400 hover:from-iceBlue/90 hover:to-blue-400/90 text-gray-900 shadow-md shadow-iceBlue/30 hover:shadow-lg hover:shadow-iceBlue/50 transition-shadow font-bold"
              aria-label="Play against computer AI"
            >
              🤖 Play vs AI
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={openSettings}
              fullWidth
              className="hover:bg-gray-700/50 transition-colors"
              aria-label="Open settings"
            >
              ⚙️ Settings
            </Button>
          </motion.div>
        </motion.div>
      </div>

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

      {/* Settings Modal */}
      <SettingsModal />
    </motion.div>
  )
}

export default HomePage
