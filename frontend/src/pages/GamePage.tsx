import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PhaserGame from '../components/PhaserGame'
import { PhaseTransition } from '../game/components/PhaseTransition'
import { useGameStore } from '../store/gameStore'

function GamePage() {
  const gamePhase = useGameStore((state) => state.gamePhase)
  const currentRound = useGameStore((state) => state.currentRound)
  const players = useGameStore((state) => state.players)
  const leaderId = useGameStore((state) => state.leaderId)

  const [showTransition, setShowTransition] = useState(false)
  const [prevPhase, setPrevPhase] = useState<typeof gamePhase>(gamePhase)
  const [transitionFromPhase, setTransitionFromPhase] = useState<typeof gamePhase>(gamePhase)

  // Get leader name
  const leader = players.find((p) => p.id === leaderId)
  const leaderName = leader?.name || 'Player 1'

  // Detect phase changes and trigger transitions
  useEffect(() => {
    // Detect phase change
    if (gamePhase !== prevPhase) {
      setTransitionFromPhase(prevPhase)
      setShowTransition(true)
      setPrevPhase(gamePhase)
    }
  }, [gamePhase, prevPhase])

  // Handle transition complete
  const handleTransitionComplete = () => {
    setShowTransition(false)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/lobby" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
            ← Leave Game
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-gold">
              Round {currentRound || 1} • Leader: {leaderName}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <PhaserGame />
        </div>
      </div>

      {/* Phase Transition Overlay */}
      <PhaseTransition
        visible={showTransition}
        phase={gamePhase as any}
        fromPhase={transitionFromPhase as any}
        roundNumber={currentRound}
        onComplete={handleTransitionComplete}
      />
    </div>
  )
}

export default GamePage
