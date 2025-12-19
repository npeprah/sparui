import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { gameConfig } from '../game/config'

function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    // Create Phaser game instance
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(gameConfig)
    }

    // HMR disposal - destroy game instance before hot reload
    // This prevents asset corruption when Vite hot-reloads the component
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        if (gameRef.current) {
          console.log('[HMR] Destroying Phaser game instance before hot reload')
          gameRef.current.destroy(true, false)
          gameRef.current = null
        }
      })

      // Force full page reload on HMR for Phaser-related files
      // This is the safest approach as Phaser state can be complex
      import.meta.hot.accept(() => {
        console.log('[HMR] Phaser component updated - forcing full reload')
        window.location.reload()
      })
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true, false)
        gameRef.current = null
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
