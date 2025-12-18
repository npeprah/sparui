import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLobbyStore, usePlayerStore, useUIStore } from '../../store'
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

  const playerId = usePlayerStore((state) => state.playerId)
  const playerName = usePlayerStore((state) => state.playerName)
  const addNotification = useUIStore((state) => state.addNotification)

  // Check if game can start (2+ players and all ready)
  const canStartGame = currentPlayers.length >= 2 && currentPlayers.every((p) => p.isReady)

  // Setup WebSocket listeners
  useEffect(() => {
    const socket = socketService.connect()

    // Lobby created
    socketService.on('lobby:created', (data) => {
      console.log('Lobby created:', data)
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
        message: `Lobby created! Room code: ${data.roomCode}`,
      })
    })

    // Joined lobby
    socketService.on('lobby:joined', (data) => {
      console.log('Joined lobby:', data)
      setRoomCode(data.roomCode)
      setCurrentPlayers(data.players)
      setIsInLobby(true)
      setIsConnecting(false)

      // Determine if current player is host
      const hostPlayer = data.players.find((p) => p.isHost)
      if (hostPlayer) {
        setHostId(hostPlayer.id)
        setIsHost(hostPlayer.id === playerId)
      }

      addNotification({
        type: 'success',
        message: `Joined lobby ${data.roomCode}`,
      })
    })

    // Player joined
    socketService.on('lobby:player_joined', (data) => {
      console.log('Player joined:', data.player)
      addPlayer(data.player)
      addNotification({
        type: 'info',
        message: `${data.player.username} joined the lobby`,
      })
    })

    // Player left
    socketService.on('lobby:player_left', (data) => {
      console.log('Player left:', data.playerId)
      removePlayer(data.playerId)
      const leftPlayer = currentPlayers.find((p) => p.id === data.playerId)
      if (leftPlayer) {
        addNotification({
          type: 'info',
          message: `${leftPlayer.username} left the lobby`,
        })
      }
    })

    // Ready status changed
    socketService.on('lobby:ready_changed', (data) => {
      console.log('Ready changed:', data)
      updatePlayerReady(data.playerId, data.isReady)

      // Update local ready state if it's us
      if (data.playerId === playerId) {
        setIsReady(data.isReady)
      }
    })

    // Settings changed
    socketService.on('lobby:settings_changed', (data) => {
      console.log('Settings changed:', data.settings)
      updateSettings(data.settings)
      addNotification({
        type: 'info',
        message: 'Game settings updated',
      })
    })

    // Game starting
    socketService.on('lobby:game_starting', (data) => {
      console.log('Game starting:', data)
      addNotification({
        type: 'success',
        message: `Game starting in ${data.countdown} seconds...`,
      })

      setTimeout(() => {
        navigate('/game', { state: { gameId: data.gameId } })
      }, data.countdown * 1000)
    })

    // Room closed
    socketService.on('lobby:room_closed', (data) => {
      console.log('Room closed:', data.reason)
      addNotification({
        type: 'warning',
        message: data.reason || 'Lobby closed',
      })
      leaveLobby()
      navigate('/')
    })

    // Lobby error
    socketService.on('lobby:error', (data) => {
      console.error('Lobby error:', data.message)
      addNotification({
        type: 'error',
        message: data.message,
      })
      setIsConnecting(false)
      setIsLoading(false)
    })

    // Connection status
    socket.on('connect', () => {
      console.log('Socket connected')
      setIsConnecting(false)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnecting(true)
    })

    // Cleanup on unmount
    return () => {
      socketService.off('lobby:created')
      socketService.off('lobby:joined')
      socketService.off('lobby:player_joined')
      socketService.off('lobby:player_left')
      socketService.off('lobby:ready_changed')
      socketService.off('lobby:settings_changed')
      socketService.off('lobby:game_starting')
      socketService.off('lobby:room_closed')
      socketService.off('lobby:error')
    }
  }, [
    playerId,
    playerName,
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
    leaveLobby,
    addNotification,
    navigate,
    currentPlayers,
  ])

  // Handle ready toggle
  const handleReady = () => {
    if (!roomCode) return

    setIsLoading(true)
    socketService.emit('lobby:ready', {
      roomCode,
      playerId,
      isReady: !isReady,
    })

    // Optimistic update
    setIsReady(!isReady)
    setTimeout(() => setIsLoading(false), 500)
  }

  // Handle start game
  const handleStartGame = () => {
    if (!roomCode || !canStartGame) return

    setIsLoading(true)
    socketService.emit('lobby:start', {
      roomCode,
      hostId: playerId,
    })
  }

  // Handle leave lobby
  const handleLeave = () => {
    if (!roomCode) {
      navigate('/')
      return
    }

    socketService.emit('lobby:leave', {
      roomCode,
      playerId,
    })

    leaveLobby()
    navigate('/')
  }

  // Handle settings change
  const handleSettingsChange = (newSettings: Partial<LobbySettings>) => {
    if (!roomCode || !isHost) return

    socketService.emit('lobby:update_settings', {
      roomCode,
      hostId: playerId,
      settings: newSettings,
    })

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
      <motion.div className="max-w-6xl mx-auto" variants={container} initial="hidden" animate="visible">
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
