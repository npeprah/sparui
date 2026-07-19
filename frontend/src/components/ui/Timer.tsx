import { useEffect, useState } from 'react'

interface TimerProps {
  timeRemaining: number
  maxTime: number
  onTimeUp?: () => void
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
}

const sizeStyles = {
  sm: 'text-lg w-12 h-12',
  md: 'text-2xl w-16 h-16',
  lg: 'text-4xl w-24 h-24',
}

export function Timer({
  timeRemaining,
  maxTime,
  onTimeUp,
  size = 'md',
  showProgress = true,
}: TimerProps) {
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    if (timeRemaining <= 3 && timeRemaining > 0) {
      setIsWarning(true)
    } else {
      setIsWarning(false)
    }

    if (timeRemaining === 0 && onTimeUp) {
      onTimeUp()
    }
  }, [timeRemaining, onTimeUp])

  const percentage = (timeRemaining / maxTime) * 100
  const circumference = 2 * Math.PI * 45 // radius of 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (timeRemaining <= 3) return '#FF4500' // fireRed
    if (timeRemaining <= 5) return '#FFD700' // gold
    return '#00BFFF' // iceBlue
  }

  return (
    <div className={`relative ${sizeStyles[size]}`}>
      {showProgress && (
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#374151" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
      )}
      <div
        className={`absolute inset-0 flex items-center justify-center font-bold ${
          isWarning ? 'text-fireRed animate-pulse' : 'text-white'
        }`}
      >
        {timeRemaining}
      </div>
    </div>
  )
}
