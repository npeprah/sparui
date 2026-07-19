import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLobbyStore, usePlayerStore, useUIStore, useGameStore } from '../../store'
import { socketService } from '../../services/socketService'
import { RoomCodeDisplay } from './RoomCodeDisplay'
import { PlayerList } from './PlayerList'
import { GameSettings } from './GameSettings'
import { LobbyActions } from './LobbyActions'
import { Button } from '../ui'
import type { LobbySettings } from '../../store/types'
import { pageVariants, staggerContainer, staggerItem, getVariants } from '../../utils/animations'

export function LobbyScreen() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  // Zustand stores
  const {
    roomCode,
    currentPlayers,
    settings,
    isHost,
    isReady,
    isConnecting,
    setRoomCode,
    setHostId,
    addPlayer,
    removePlayer,
    updatePlayerReady,
    updateSettings,
    setIsHost,
    setIsReady,
    setIsInLobby,
    setIsConnecting,
    setCurrentPlayers,
    leaveLobby,
  } = useLobbyStore()

  const playerId = usePlayerStore(state => state.playerId)
  const playerName = usePlayerStore(state => state.playerName)
  const token = usePlayerStore(state => state.token)
  const addNotification = useUIStore(state => state.addNotification)

  // Check if game can start (2+ players and all ready)
  const canStartGame = currentPlayers.length >= 2 && currentPlayers.every(p => p.isReady)

  const { setAllReady } = useLobbyStore()

  // Setup WebSocket listeners
  useEffect(() => {
    // Connect to WebSocket with token for auto-authentication
    socketService.connect(token || undefined)

    // Backend event: room:created
    socketService.on('room:created', data => {
      console.log('Room created:', data)
      setRoomCode(data.roomCode)
      setHostId(data.hostId)
      setIsHost(data.hostId === playerId)
      setIsInLobby(true)
      setIsConnecting(false)

      // Add self as first player
      addPlayer({
        id: playerId,
        username: playerName,
        isReady: false,
        isHost: true,
      })

      addNotification({
        type: 'success',
        message: `Room created! Code: ${data.roomCode}`,
      })
    })

    // Backend event: room:player_joined
    socketService.on('room:player_joined', data => {
      console.log('Player joined room:', data)
      console.log('[DEBUG] Current playerId from store:', playerId)
      console.log('[DEBUG] Players array:', data.players)

      // Update full player list from backend
      setCurrentPlayers(data.players)

      // Always sync isHost with the players array
      const currentPlayer = data.players.find(p => p.id === playerId)
      console.log('[DEBUG] Found current player:', currentPlayer)
      if (currentPlayer) {
        console.log('[DEBUG] Setting isHost to:', currentPlayer.isHost)
        setIsHost(currentPlayer.isHost)
      } else {
        console.warn('[DEBUG] WARNING: Could not find current player in players array!')
      }

      // Set room code if not already set (for when we join)
      if (!roomCode) {
        setRoomCode(data.roomCode)
        setIsInLobby(true)
        setIsConnecting(false)

        // Set host ID from the host player
        const hostPlayer = data.players.find(p => p.isHost)
        if (hostPlayer) {
          setHostId(hostPlayer.id)
        }
      }

      // Show notification only if it's not us joining
      if (data.player.id !== playerId) {
        addNotification({
          type: 'info',
          message: `${data.player.username} joined`,
        })
      } else {
        addNotification({
          type: 'success',
          message: `Joined room ${data.roomCode}`,
        })
      }
    })

    // Backend event: room:player_left
    socketService.on('room:player_left', data => {
      console.log('Player left room:', data)

      // Update player list from backend
      setCurrentPlayers(data.players)

      // Handle host migration
      if (data.newHostId) {
        setHostId(data.newHostId)
        setIsHost(data.newHostId === playerId)

        if (data.newHostId === playerId) {
          addNotification({
            type: 'info',
            message: 'You are now the host',
          })
        }
      }

      addNotification({
        type: 'info',
        message: 'A player left the room',
      })
    })

    // Backend event: room:player_ready
    socketService.on('room:player_ready', data => {
      console.log('Player ready status changed:', data)
      console.log('[DEBUG] Current playerId from store:', playerId)

      // Use full player list from backend to ensure sync
      if (data.players) {
        console.log('[DEBUG] Received players array:', data.players)
        setCurrentPlayers(data.players)

        // Re-check if current player is host (in case players array changed)
        const currentPlayer = data.players.find(p => p.id === playerId)
        console.log('[DEBUG] Found current player in ready event:', currentPlayer)
        if (currentPlayer) {
          console.log('[DEBUG] Setting isHost to:', currentPlayer.isHost)
          setIsHost(currentPlayer.isHost)
        } else {
          console.warn('[DEBUG] WARNING: Could not find current player in ready event!')
        }
      } else {
        // Fallback to manual update if players array not provided
        updatePlayerReady(data.playerId, data.isReady)
      }

      // Update local ready state if it's us
      if (data.playerId === playerId) {
        setIsReady(data.isReady)
      }

      // Update allReady flag from backend
      setAllReady(data.allReady)
    })

    // Backend event: room:settings_updated
    socketService.on('room:settings_updated', data => {
      console.log('Room settings updated:', data)
      updateSettings(data.settings)
      addNotification({
        type: 'info',
        message: 'Game settings updated',
      })
    })

    // Backend event: game:started
    socketService.on('game:started', data => {
      console.log('[LobbyScreen] ===== GAME:STARTED EVENT =====')
      console.log('[LobbyScreen] Full event data:', JSON.stringify(data, null, 2))
      console.log('[LobbyScreen] Game state received:', data.gameState)

      // Initialize game store with backend game state
      if (data.gameState) {
        console.log('[LobbyScreen] Initializing game store with backend state...')
        console.log('[LobbyScreen] Backend players:', data.gameState.players)
        console.log('[LobbyScreen] Current player ID from playerStore:', playerId)

        useGameStore.getState().initializeFromBackend(data.gameState)

        const gameStoreAfterInit = useGameStore.getState()
        console.log('[LobbyScreen] Game store initialized successfully')
        console.log('[LobbyScreen] Players in game store:', gameStoreAfterInit.players)
        console.log('[LobbyScreen] Number of players:', gameStoreAfterInit.players.length)

        // Log each player's hand
        gameStoreAfterInit.players.forEach((player, index) => {
          console.log(`[LobbyScreen] Player ${index} (${player.id}):`, {
            name: player.name,
            handSize: player.hand?.length || 0,
            hand: player.hand,
          })
        })

        // CRITICAL FIX: Initialize playerStore.hand with current player's cards
        const currentPlayer = gameStoreAfterInit.players.find(p => p.id === playerId)
        if (currentPlayer && currentPlayer.hand) {
          console.log(
            '[LobbyScreen] Initializing playerStore hand with',
            currentPlayer.hand.length,
            'cards'
          )
          console.log(
            '[LobbyScreen] Hand cards:',
            currentPlayer.hand.map(c => `${c.suit} ${c.rank} (${c.id})`)
          )
          usePlayerStore.getState().setHand(currentPlayer.hand)
          console.log('[LobbyScreen] playerStore hand initialized successfully')
        } else {
          console.error('[LobbyScreen] ERROR: Could not find current player or hand!', {
            currentPlayer,
            playerId,
            availablePlayers: gameStoreAfterInit.players.map(p => p.id),
          })
        }

        // Set initial turn state
        if (data.gameState.currentTurn) {
          const isMyTurn = data.gameState.currentTurn === playerId
          usePlayerStore.getState().setIsMyTurn(isMyTurn)
          console.log(
            '[LobbyScreen] Initial turn state set - isMyTurn:',
            isMyTurn,
            'currentTurn:',
            data.gameState.currentTurn
          )
        }
      } else {
        console.warn('[LobbyScreen] No gameState provided in game:started event')
      }

      addNotification({
        type: 'success',
        message: 'Game starting now!',
      })

      // Navigate to game screen
      setTimeout(() => {
        console.log('[LobbyScreen] Navigating to /game...')
        navigate('/game', { state: { roomCode: data.roomCode, players: data.players } })
      }, 500)
    })

    // Error handling
    socketService.on('error', data => {
      console.error('WebSocket error:', data)
      addNotification({
        type: 'error',
        message: data.error || 'An error occurred',
      })
      setIsConnecting(false)
      setIsLoading(false)

      // If max reconnect, redirect to home
      if (data.code === 'MAX_RECONNECT') {
        setTimeout(() => {
          leaveLobby()
          navigate('/')
        }, 2000)
      }
    })

    // Auth success
    socketService.on('auth:success', data => {
      console.log('Authenticated:', data.playerId)
      setIsConnecting(false)
      addNotification({
        type: 'success',
        message: 'Connected to server',
      })
    })

    // Auth error
    socketService.on('auth:error', data => {
      console.error('Auth error:', data.error)
      addNotification({
        type: 'error',
        message: `Authentication failed: ${data.error}`,
      })
      setIsConnecting(false)
    })

    // Connection events
    socketService.on('connected', () => {
      console.log('WebSocket connected')
      setIsConnecting(false)
    })

    socketService.on('error', data => {
      console.error('WebSocket error:', data.error)
      if (data.code === 'MAX_RECONNECT') {
        addNotification({
          type: 'error',
          message: 'Connection lost. Please refresh the page.',
        })
      }
      setIsConnecting(true)
    })

    // Cleanup on unmount
    return () => {
      // Cleanup backend event listeners
      socketService.off('room:created')
      socketService.off('room:player_joined')
      socketService.off('room:player_left')
      socketService.off('room:player_ready')
      socketService.off('room:settings_updated')
      socketService.off('game:started')
      socketService.off('error')
      socketService.off('auth:success')
      socketService.off('auth:error')
      socketService.off('connected')
    }
  }, [
    token,
    playerId,
    playerName,
    roomCode,
    addPlayer,
    removePlayer,
    updatePlayerReady,
    updateSettings,
    setRoomCode,
    setHostId,
    setIsHost,
    setIsReady,
    setIsInLobby,
    setIsConnecting,
    setCurrentPlayers,
    setAllReady,
    leaveLobby,
    addNotification,
    navigate,
  ])

  // Handle ready toggle (Task 2.4)
  const handleReady = () => {
    if (!roomCode) return

    const newReadyState = !isReady

    setIsLoading(true)

    // Match backend API spec - only send isReady boolean
    socketService.emit('lobby:ready', {
      isReady: newReadyState,
    })

    // Optimistic update
    setIsReady(newReadyState)
    updatePlayerReady(playerId, newReadyState)

    setTimeout(() => setIsLoading(false), 500)
  }

  // Handle start game (Task 2.6)
  const handleStartGame = () => {
    if (!isHost) {
      addNotification({
        type: 'warning',
        message: 'Only the host can start the game',
      })
      return
    }

    if (!canStartGame) {
      addNotification({
        type: 'warning',
        message: 'All players must be ready to start',
      })
      return
    }

    if (currentPlayers.length < 2) {
      addNotification({
        type: 'warning',
        message: 'Need at least 2 players to start',
      })
      return
    }

    setIsLoading(true)

    // Match backend API spec - empty object
    socketService.emit('lobby:start_game', {})
  }

  // Handle leave lobby
  const handleLeave = () => {
    if (!roomCode) {
      navigate('/')
      return
    }

    // Match backend API spec - empty object
    socketService.emit('lobby:leave', {})

    leaveLobby()
    navigate('/')
  }

  // Handle settings change (Task 2.5)
  const handleSettingsChange = (newSettings: Partial<LobbySettings>) => {
    if (!isHost) {
      console.warn('Only host can update settings')
      return
    }

    // Match backend API spec - only send the settings object
    socketService.emit('lobby:update_settings', newSettings)

    // Optimistic update
    updateSettings(newSettings)
  }

  // If no room code, show error or redirect
  if (!roomCode && !isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-fireRed mb-4">No Active Lobby</h1>
          <p className="text-gray-400 mb-8">Create or join a lobby to continue</p>
          <Button variant="primary" size="lg" onClick={() => navigate('/')}>
            Go to Main Menu
          </Button>
        </div>
      </div>
    )
  }

  // Get animation variants with reduced motion support
  const page = getVariants(pageVariants)
  const container = getVariants(staggerContainer)
  const item = getVariants(staggerItem)

  return (
    <motion.div
      className="min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      variants={page}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.div
        className="max-w-6xl mx-auto"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="flex items-center justify-between mb-6 md:mb-8" variants={item}>
          <Button variant="ghost" size="sm" onClick={handleLeave}>
            ← Back
          </Button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-fireRed via-gold to-iceBlue bg-clip-text text-transparent">
            GAME LOBBY
          </h1>
          <div className="w-16 sm:w-20" /> {/* Spacer for alignment */}
        </motion.div>

        {/* Connection Status */}
        {isConnecting && (
          <motion.div
            className="bg-yellow-900 border border-yellow-600 text-yellow-200 px-4 py-3 rounded-lg mb-4 md:mb-6 text-center text-sm md:text-base"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            Reconnecting to server...
          </motion.div>
        )}

        {/* Room Code */}
        {roomCode && (
          <motion.div variants={item}>
            <RoomCodeDisplay roomCode={roomCode} />
          </motion.div>
        )}

        {/* Two Column Layout */}
        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6" variants={item}>
          {/* Left Column - Players */}
          <div className="lg:col-span-2">
            <PlayerList
              players={currentPlayers}
              maxPlayers={settings.maxPlayers}
              currentPlayerId={playerId}
            />
          </div>

          {/* Right Column - Settings */}
          <div>
            <GameSettings
              settings={settings}
              isHost={isHost}
              onSettingsChange={handleSettingsChange}
            />
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div className="mt-4 md:mt-6" variants={item}>
          <LobbyActions
            isHost={isHost}
            isReady={isReady}
            canStartGame={canStartGame}
            isLoading={isLoading}
            onReady={handleReady}
            onStartGame={handleStartGame}
            onLeave={handleLeave}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
