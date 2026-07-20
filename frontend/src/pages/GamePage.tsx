import { Link } from 'react-router-dom'
import PhaserGame from '../components/PhaserGame'

function GamePage() {
  return (
    // Ticket 19: full-bleed comic table. The whole viewport is the pop-art yellow
    // Variant B table (no dark React header/margins); the Phaser canvas fills it
    // edge-to-edge and any FIT letterbox blends into the same yellow.
    //
    // Ticket 19 (iteration 3): the old React `PhaseTransition` dimming modal
    // (hourglass + "Transitioning..." over a black scrim) has been removed. The
    // prototype has no such overlay - turns and rounds flow purely through the
    // Phaser card motion + comic banners, and the table is never dimmed.
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
    </div>
  )
}

export default GamePage
