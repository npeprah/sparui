import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui'
import { copySuccessVariants, copiedTextVariants, getVariants } from '../../utils/animations'

interface RoomCodeDisplayProps {
  roomCode: string
}

export function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy room code:', err)
    }
  }

  // Get animation variants with reduced motion support
  const pulseVariants = getVariants(copySuccessVariants)
  const textVariants = getVariants(copiedTextVariants)

  return (
    <div className="bg-gray-800 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4">
        <div className="text-center sm:text-left w-full sm:w-auto relative">
          <p className="text-xs md:text-sm text-gray-400 mb-1">Room Code</p>
          <motion.p
            className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-gold tracking-wider"
            animate={copied ? 'pulse' : 'initial'}
            variants={pulseVariants}
          >
            {roomCode}
          </motion.p>
          {/* Copied feedback text */}
          <AnimatePresence>
            {copied && (
              <motion.div
                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 sm:left-0 sm:translate-x-0 text-green-400 text-sm font-medium whitespace-nowrap"
                variants={textVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                Copied to clipboard!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Button
          variant={copied ? 'success' : 'secondary'}
          size="md"
          onClick={handleCopy}
          className="min-w-[120px] w-full sm:w-auto"
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-3 md:mt-4 text-center sm:text-left">
        Share this code with friends to invite them to your game
      </p>
    </div>
  )
}
