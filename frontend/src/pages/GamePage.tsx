import { Link } from 'react-router-dom'
import PhaserGame from '../components/PhaserGame'

function GamePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/lobby" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
            ← Leave Game
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-gold">
              Round 1 • Leader: Player 1
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <PhaserGame />
        </div>
      </div>
    </div>
  )
}

export default GamePage
