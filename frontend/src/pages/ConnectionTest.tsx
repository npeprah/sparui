import { useState, useEffect } from 'react'
import { socketService } from '../services/socketService'
import { usePlayerStore } from '../store'

/**
 * Connection Test Page
 *
 * Simple page to test WebSocket connection and authentication.
 * This is for development/debugging purposes.
 *
 * Usage:
 * 1. Enter a test token (any string for now, backend accepts anything non-empty)
 * 2. Click "Connect & Authenticate"
 * 3. Watch the console and connection status
 */
export function ConnectionTest() {
  const [testToken, setTestToken] = useState('test-token-123')
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [messages, setMessages] = useState<Array<{ time: string; event: string; data: unknown }>>(
    []
  )

  const { setToken, setPlayerId } = usePlayerStore()

  useEffect(() => {
    // Setup listeners
    socketService.on('connected', data => {
      setConnectionStatus('connected')
      addMessage('connected', data)
    })

    socketService.on('auth:success', data => {
      setConnectionStatus('authenticated')
      addMessage('auth:success', data)
      setPlayerId(data.playerId)
    })

    socketService.on('auth:error', data => {
      setConnectionStatus('auth_error')
      addMessage('auth:error', data)
    })

    socketService.on('error', data => {
      setConnectionStatus('error')
      addMessage('error', data)
    })

    // Cleanup
    return () => {
      socketService.off('connected')
      socketService.off('auth:success')
      socketService.off('auth:error')
      socketService.off('error')
    }
  }, [setPlayerId])

  const addMessage = (event: string, data: unknown) => {
    const time = new Date().toLocaleTimeString()
    setMessages(prev => [...prev, { time, event, data }])
  }

  const handleConnect = () => {
    setToken(testToken)
    setMessages([])
    setConnectionStatus('connecting')
    socketService.connect(testToken)
  }

  const handleDisconnect = () => {
    socketService.disconnect()
    setConnectionStatus('disconnected')
    addMessage('disconnect', { message: 'Manually disconnected' })
  }

  const handleTestAuth = () => {
    socketService.authenticate(testToken)
    addMessage('auth', { message: 'Sent auth event' })
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
      case 'authenticated':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'error':
      case 'auth_error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">WebSocket Connection Test</h1>

        {/* Status Indicator */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()} animate-pulse`} />
            <div>
              <p className="text-sm text-gray-400">Connection Status</p>
              <p className="text-xl font-semibold capitalize">
                {connectionStatus.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Connection Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Controls</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Test Token</label>
            <input
              type="text"
              value={testToken}
              onChange={e => setTestToken(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Enter any test token"
            />
            <p className="text-xs text-gray-500 mt-1">
              For testing: backend accepts any non-empty token
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConnect}
              disabled={
                connectionStatus === 'connecting' ||
                connectionStatus === 'connected' ||
                connectionStatus === 'authenticated'
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              Connect & Authenticate
            </button>

            <button
              onClick={handleTestAuth}
              disabled={connectionStatus !== 'connected' && connectionStatus !== 'authenticated'}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              Test Auth Again
            </button>

            <button
              onClick={handleDisconnect}
              disabled={connectionStatus === 'disconnected'}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Event Log</h2>
            <button
              onClick={() => setMessages([])}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No messages yet. Connect to start receiving events.
              </p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="bg-gray-700 rounded p-3 text-sm font-mono">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-400">[{msg.time}]</span>
                    <span className="text-blue-400 font-semibold">{msg.event}</span>
                  </div>
                  <pre className="text-gray-300 text-xs overflow-x-auto">
                    {JSON.stringify(msg.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>
              Make sure the backend server is running on{' '}
              <code className="bg-gray-700 px-1 py-0.5 rounded">localhost:8080</code>
            </li>
            <li>Open browser DevTools (F12) and go to Network → WS tab</li>
            <li>Enter any test token (backend accepts any non-empty string for now)</li>
            <li>Click "Connect & Authenticate" button</li>
            <li>
              Watch for:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>WebSocket connection in DevTools (ws://localhost:8080/ws)</li>
                <li>"connected" event in the log below</li>
                <li>"auth:success" event with your playerId</li>
              </ul>
            </li>
            <li>Check browser console for detailed logs</li>
          </ol>
        </div>

        {/* Expected Backend Response */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Expected Backend Response</h3>
          <div className="bg-gray-900 rounded p-4 font-mono text-sm">
            <pre className="text-green-400">
              {`{
  "event": "auth:success",
  "data": {
    "playerId": "player-test-tok",
    "message": "Authenticated successfully"
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
