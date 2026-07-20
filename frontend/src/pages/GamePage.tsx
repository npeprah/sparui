import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PhaserGame from '../components/PhaserGame'
import { PhaseTransition } from '../game/components/PhaseTransition'
import { useGameStore } from '../store/gameStore'

function GamePage() {
  const gamePhase = useGameStore(state => state.gamePhase)
  const currentRound = useGameStore(state => state.currentRound)

  const [showTransition, setShowTransition] = useState(false)
  const [prevPhase, setPrevPhase] = useState<typeof gamePhase>(gamePhase)
  const [transitionFromPhase, setTransitionFromPhase] = useState<typeof gamePhase>(gamePhase)

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
    // Ticket 19: full-bleed comic table. The whole viewport is the pop-art yellow
    // Variant B table (no dark React header/margins); the Phaser canvas fills it
    // edge-to-edge and any FIT letterbox blends into the same yellow.
    <div className="fixed inset-0 overflow-hidden bg-[#ffd400]">
      <PhaserGame />

      {/* Minimal comic-styled Leave affordance (the prototype has no dark bar). */}
      <Link
        to="/lobby"
        aria-label="Leave game"
        className="absolute left-3 top-3 z-50 -rotate-3 rounded-sm border-2 border-[#14100c] bg-[#14100c] px-3 py-1 text-sm font-black uppercase tracking-widest text-[#ffd400] shadow-[3px_3px_0_#14100c] transition-transform hover:scale-105"
        style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
      >
        Leave
      </Link>

      {/* Phase Transition Overlay */}
      <PhaseTransition
        visible={showTransition}
        phase={gamePhase}
        fromPhase={transitionFromPhase}
        roundNumber={currentRound}
        onComplete={handleTransitionComplete}
      />
    </div>
  )
}

export default GamePage
