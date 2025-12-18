import { useEffect } from 'react'
import { useUIStore, type NotificationType } from '../../store/uiStore'

interface NotificationItemProps {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

const typeStyles: Record<NotificationType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-green-600',
    border: 'border-green-500',
    icon: '✓',
  },
  error: {
    bg: 'bg-red-600',
    border: 'border-red-500',
    icon: '✕',
  },
  warning: {
    bg: 'bg-yellow-600',
    border: 'border-yellow-500',
    icon: '⚠',
  },
  info: {
    bg: 'bg-iceBlue',
    border: 'border-blue-400',
    icon: 'ℹ',
  },
}

function NotificationItem({ id, type, message, duration = 3000 }: NotificationItemProps) {
  const removeNotification = useUIStore((state) => state.removeNotification)

  useEffect(() => {
    const timer = setTimeout(() => {
      removeNotification(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, removeNotification])

  const styles = typeStyles[type]

  return (
    <div
      className={`${styles.bg} ${styles.border} border-l-4 rounded-lg p-4 shadow-lg min-w-[300px] max-w-md animate-slide-in`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">{styles.icon}</div>
        <div className="flex-1">
          <p className="text-white font-medium">{message}</p>
        </div>
        <button
          onClick={() => removeNotification(id)}
          className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function NotificationContainer() {
  const notifications = useUIStore((state) => state.notifications)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} {...notification} />
      ))}
    </div>
  )
}
