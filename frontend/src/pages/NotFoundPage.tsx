import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-8xl font-bold mb-4 text-fireRed">404</h1>
      <p className="text-2xl text-iceBlue mb-8">Page Not Found</p>
      <Link
        to="/"
        className="px-8 py-4 bg-gold hover:bg-opacity-80 text-gray-900 rounded-lg font-bold text-xl transition-all hover:scale-105"
      >
        Return Home
      </Link>
    </div>
  )
}

export default NotFoundPage
