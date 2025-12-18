import { useEffect, useState } from 'react'
import { socketService } from '../services/socketService'
import type { ServerToClientEvents, ClientToServerEvents } from '../services/socketService'
import type { Socket } from 'socket.io-client'

export function useSocket() {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = socketService.connect()
    setSocket(socketInstance)

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)

    // Set initial connection state
    setIsConnected(socketInstance.connected)

    return () => {
      socketInstance.off('connect', handleConnect)
      socketInstance.off('disconnect', handleDisconnect)
    }
  }, [])

  return {
    socket,
    isConnected,
    emit: socketService.emit.bind(socketService),
    on: socketService.on.bind(socketService),
    off: socketService.off.bind(socketService),
  }
}
