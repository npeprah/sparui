import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { gameConfig } from '../game/config'
import { AudioManager } from '../services/audioManager'

function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    console.log('[PhaserGame] useEffect running, gameRef.current:', !!gameRef.current)

    if (!gameRef.current) {
      console.log('[PhaserGame] Creating new Phaser.Game instance')
      gameRef.current = new Phaser.Game(gameConfig)
      console.log('[PhaserGame] Phaser.Game instance created')
    } else {
      console.log('[PhaserGame] Phaser.Game instance already exists, skipping creation')
    }

    return () => {
      console.log('[PhaserGame] Cleanup function running')
      if (gameRef.current) {
        console.log('[PhaserGame] Destroying Phaser.Game instance')
        gameRef.current.destroy(true)
        gameRef.current = null

        // Reset AudioManager singleton to allow fresh initialization
        console.log('[PhaserGame] Resetting AudioManager singleton')
        AudioManager.resetInstance()
      }
    }
  }, [])

  return (
    <div className="flex items-center justify-center">
      <div id="phaser-game" className="rounded-lg overflow-hidden shadow-2xl" />
    </div>
  )
}

export default PhaserGame
