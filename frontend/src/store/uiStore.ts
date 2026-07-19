import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

interface UIState {
  // Modals
  isSettingsOpen: boolean
  isLeaderboardOpen: boolean
  isHowToPlayOpen: boolean

  // Notifications
  notifications: Notification[]

  // Loading states
  isConnecting: boolean
  isLoading: boolean

  // Sound settings
  soundEnabled: boolean
  musicEnabled: boolean
  volume: number
  masterVolume: number
  sfxVolume: number

  // Actions
  openSettings: () => void
  closeSettings: () => void
  openLeaderboard: () => void
  closeLeaderboard: () => void
  openHowToPlay: () => void
  closeHowToPlay: () => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  setIsConnecting: (connecting: boolean) => void
  setIsLoading: (loading: boolean) => void
  toggleSound: () => void
  toggleMusic: () => void
  setVolume: (volume: number) => void
  setMasterVolume: (volume: number) => void
  setSfxVolume: (volume: number) => void
}

export const useUIStore = create<UIState>(set => ({
  // Initial state
  isSettingsOpen: false,
  isLeaderboardOpen: false,
  isHowToPlayOpen: false,
  notifications: [],
  isConnecting: false,
  isLoading: false,
  soundEnabled: true,
  musicEnabled: true,
  volume: 0.7,
  masterVolume: 1.0,
  sfxVolume: 1.0,

  // Actions
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  openLeaderboard: () => set({ isLeaderboardOpen: true }),
  closeLeaderboard: () => set({ isLeaderboardOpen: false }),

  openHowToPlay: () => set({ isHowToPlayOpen: true }),
  closeHowToPlay: () => set({ isHowToPlayOpen: false }),

  addNotification: notification =>
    set(state => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: `${Date.now()}-${Math.random()}`,
          duration: notification.duration || 3000,
        },
      ],
    })),

  removeNotification: id =>
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),

  setIsConnecting: connecting => set({ isConnecting: connecting }),

  setIsLoading: loading => set({ isLoading: loading }),

  toggleSound: () => set(state => ({ soundEnabled: !state.soundEnabled })),

  toggleMusic: () => set(state => ({ musicEnabled: !state.musicEnabled })),

  setVolume: volume => set({ volume: Math.max(0, Math.min(1, volume)) }),

  setMasterVolume: volume => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),

  setSfxVolume: volume => set({ sfxVolume: Math.max(0, Math.min(1, volume)) }),
}))
