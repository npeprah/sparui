import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GamePhase } from '../../store/types'

interface PhaseTransitionProps {
  visible: boolean
  phase: GamePhase | 'waiting' | 'round_end' | 'game_over'
  fromPhase?: GamePhase | 'waiting' | 'round_end' | 'game_over'
  message?: string
  winnerName?: string
  winningCard?: string
  roundNumber?: number
  finalScore?: number
  onComplete?: () => void
}

/**
 * PhaseTransition Component
 *
 * Displays 2-second overlay transitions between game phases with arcade-style visuals.
 *
 * Supported transitions:
 * - waiting → playing: "Game Starting!" with countdown (3, 2, 1)
 * - playing → round_end: "Round Complete!" with winner info
 * - round_end → playing: "Next Round!" with round number
 * - playing → game_over: "Game Over!" with final scores
 */
export function PhaseTransition({
  visible,
  phase,
  fromPhase,
  message,
  winnerName,
  winningCard,
  roundNumber,
  finalScore,
  onComplete,
}: PhaseTransitionProps) {
  const [countdown, setCountdown] = useState<number>(3)

  // Auto-complete after 2 seconds
  useEffect(() => {
    if (!visible) return

    const timer = setTimeout(() => {
      onComplete?.()
    }, 2000)

    return () => clearTimeout(timer)
  }, [visible, onComplete])

  // Countdown for waiting → playing transition
  useEffect(() => {
    if (!visible || fromPhase !== 'waiting' || phase !== 'playing') return

    setCountdown(3)

    const countdown3Timer = setTimeout(() => setCountdown(2), 666)
    const countdown2Timer = setTimeout(() => setCountdown(1), 1333)

    return () => {
      clearTimeout(countdown3Timer)
      clearTimeout(countdown2Timer)
    }
  }, [visible, fromPhase, phase])

  if (!visible) return null

  // Determine transition content based on phase and fromPhase
  const getTransitionContent = () => {
    // Waiting → Playing: Game Starting
    if (fromPhase === 'waiting' && phase === 'playing') {
      return {
        title: 'Game Starting!',
        subtitle: countdown.toString(),
        icon: '🎮',
        showCountdown: true,
      }
    }

    // Playing → Round End: Round Complete
    if (fromPhase === 'playing' && phase === 'round_end') {
      return {
        title: winnerName ? `${winnerName} wins the round!` : 'Round Complete!',
        subtitle: winningCard ? `Winning card: ${winningCard}` : null,
        icon: '🏆',
        showCountdown: false,
      }
    }

    // Round End → Playing: Next Round
    if (fromPhase === 'round_end' && phase === 'playing') {
      return {
        title: roundNumber ? `Round ${roundNumber}!` : 'Next Round!',
        subtitle: 'Clearing table...',
        icon: '🃏',
        showCountdown: false,
      }
    }

    // Playing → Game Over: Game Over
    if (fromPhase === 'playing' && phase === 'game_over') {
      return {
        title: 'Game Over!',
        subtitle: winnerName
          ? `${winnerName} wins!${finalScore ? ` (${finalScore} points)` : ''}`
          : 'Thanks for playing!',
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-24 h-24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
            />
          </svg>
        ),
        showCountdown: false,
      }
    }

    // Default/fallback
    return {
      title: message || 'Transitioning...',
      subtitle: null,
      icon: '⏳',
      showCountdown: false,
    }
  }

  const content = getTransitionContent()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-labelledby="phase-transition-title"
          className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            role="status"
            className="bg-deepPurple border-4 border-gold rounded-2xl px-12 py-8 shadow-2xl text-center"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Icon */}
            <motion.div
              className="text-gold text-6xl mb-4 flex justify-center"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatType: 'loop',
              }}
            >
              {typeof content.icon === 'string' ? content.icon : content.icon}
            </motion.div>

            {/* Title */}
            <h2
              id="phase-transition-title"
              className="text-5xl font-bold text-gold mb-4"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {content.title}
            </h2>

            {/* Countdown or Subtitle */}
            {content.showCountdown ? (
              <motion.div
                className="text-8xl font-bold text-fireRed"
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {countdown}
              </motion.div>
            ) : (
              content.subtitle && (
                <p className="text-2xl text-iceBlue" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {content.subtitle}
                </p>
              )
            )}

            {/* Animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-4 border-gold pointer-events-none"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                  '0 0 40px rgba(255, 215, 0, 0.8)',
                  '0 0 20px rgba(255, 215, 0, 0.5)',
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'loop',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
