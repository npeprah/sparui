import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './uiStore'
import { useThemeStore } from './themeStore'

describe('UIStore - Settings and Surface Integration', () => {
  beforeEach(() => {
    // Reset stores to initial state
    useUIStore.setState({
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
    })

    useThemeStore.setState({
      selectedTheme: 'warm_heritage',
    })
  })

  describe('Settings Modal', () => {
    it('should start with settings closed', () => {
      const state = useUIStore.getState()
      expect(state.isSettingsOpen).toBe(false)
    })

    it('should open settings when openSettings is called', () => {
      const { openSettings } = useUIStore.getState()
      openSettings()

      const state = useUIStore.getState()
      expect(state.isSettingsOpen).toBe(true)
    })

    it('should close settings when closeSettings is called', () => {
      const { openSettings, closeSettings } = useUIStore.getState()
      openSettings()
      closeSettings()

      const state = useUIStore.getState()
      expect(state.isSettingsOpen).toBe(false)
    })

    it('should not affect other modals when opening settings', () => {
      const { openSettings, openLeaderboard } = useUIStore.getState()
      openLeaderboard()
      openSettings()

      const state = useUIStore.getState()
      expect(state.isSettingsOpen).toBe(true)
      expect(state.isLeaderboardOpen).toBe(true)
    })
  })

  describe('Sound Settings', () => {
    it('should have default sound settings', () => {
      const state = useUIStore.getState()
      expect(state.soundEnabled).toBe(true)
      expect(state.musicEnabled).toBe(true)
      expect(state.volume).toBe(0.7)
      expect(state.masterVolume).toBe(1.0)
      expect(state.sfxVolume).toBe(1.0)
    })

    it('should toggle sound', () => {
      const { toggleSound } = useUIStore.getState()
      toggleSound()

      let state = useUIStore.getState()
      expect(state.soundEnabled).toBe(false)

      toggleSound()
      state = useUIStore.getState()
      expect(state.soundEnabled).toBe(true)
    })

    it('should toggle music', () => {
      const { toggleMusic } = useUIStore.getState()
      toggleMusic()

      let state = useUIStore.getState()
      expect(state.musicEnabled).toBe(false)

      toggleMusic()
      state = useUIStore.getState()
      expect(state.musicEnabled).toBe(true)
    })

    it('should set volume within valid range', () => {
      const { setVolume } = useUIStore.getState()

      setVolume(0.5)
      expect(useUIStore.getState().volume).toBe(0.5)

      setVolume(1.5) // Above max
      expect(useUIStore.getState().volume).toBe(1)

      setVolume(-0.5) // Below min
      expect(useUIStore.getState().volume).toBe(0)
    })

    it('should set master volume within valid range', () => {
      const { setMasterVolume } = useUIStore.getState()

      setMasterVolume(0.8)
      expect(useUIStore.getState().masterVolume).toBe(0.8)

      setMasterVolume(2) // Above max
      expect(useUIStore.getState().masterVolume).toBe(1)

      setMasterVolume(-1) // Below min
      expect(useUIStore.getState().masterVolume).toBe(0)
    })

    it('should set SFX volume within valid range', () => {
      const { setSfxVolume } = useUIStore.getState()

      setSfxVolume(0.6)
      expect(useUIStore.getState().sfxVolume).toBe(0.6)

      setSfxVolume(1.2) // Above max
      expect(useUIStore.getState().sfxVolume).toBe(1)

      setSfxVolume(-0.2) // Below min
      expect(useUIStore.getState().sfxVolume).toBe(0)
    })
  })

  describe('Theme Integration', () => {
    it('should have access to current theme from themeStore', () => {
      const theme = useThemeStore.getState().selectedTheme
      expect(theme).toBe('warm_heritage')
    })

    it('should be able to change theme through themeStore', () => {
      const { setTheme } = useThemeStore.getState()
      setTheme('neon')

      const theme = useThemeStore.getState().selectedTheme
      expect(theme).toBe('neon')
    })

    it('should get available themes from themeStore', () => {
      const themes = useThemeStore.getState().availableThemes
      expect(themes).toEqual(['warm_heritage', 'comic', 'neon'])
    })

    it('should get theme info from themeStore', () => {
      const { getThemeInfo } = useThemeStore.getState()
      const info = getThemeInfo('comic')

      expect(info.id).toBe('comic')
      expect(info.name).toBe('Comic')
      expect(info.description).toBeTruthy()
      expect(info.swatch.base).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should reset theme to default', () => {
      const { setTheme, resetTheme } = useThemeStore.getState()

      setTheme('neon')
      expect(useThemeStore.getState().selectedTheme).toBe('neon')

      resetTheme()
      expect(useThemeStore.getState().selectedTheme).toBe('warm_heritage')
    })

    it('should persist theme selection', () => {
      // themeStore uses zustand persist middleware
      // This test verifies the configuration is correct
      const storeConfig = useThemeStore as any

      // Check that persist is configured
      expect(storeConfig.persist).toBeDefined()
    })
  })

  describe('Notifications', () => {
    it('should start with no notifications', () => {
      const state = useUIStore.getState()
      expect(state.notifications).toEqual([])
    })

    it('should add notification with unique ID', () => {
      const { addNotification } = useUIStore.getState()

      addNotification({
        type: 'success',
        message: 'Surface changed successfully',
      })

      const state = useUIStore.getState()
      expect(state.notifications).toHaveLength(1)
      expect(state.notifications[0].id).toBeDefined()
      expect(state.notifications[0].type).toBe('success')
      expect(state.notifications[0].message).toBe('Surface changed successfully')
      expect(state.notifications[0].duration).toBe(3000)
    })

    it('should add notification with custom duration', () => {
      const { addNotification } = useUIStore.getState()

      addNotification({
        type: 'info',
        message: 'Loading new surface...',
        duration: 5000,
      })

      const state = useUIStore.getState()
      expect(state.notifications[0].duration).toBe(5000)
    })

    it('should remove notification by ID', () => {
      const { addNotification, removeNotification } = useUIStore.getState()

      addNotification({ type: 'info', message: 'Test 1' })
      addNotification({ type: 'info', message: 'Test 2' })

      let state = useUIStore.getState()
      const firstId = state.notifications[0].id

      removeNotification(firstId)

      state = useUIStore.getState()
      expect(state.notifications).toHaveLength(1)
      expect(state.notifications[0].message).toBe('Test 2')
    })

    it('should clear all notifications', () => {
      const { addNotification, clearNotifications } = useUIStore.getState()

      addNotification({ type: 'info', message: 'Test 1' })
      addNotification({ type: 'warning', message: 'Test 2' })
      addNotification({ type: 'error', message: 'Test 3' })

      clearNotifications()

      const state = useUIStore.getState()
      expect(state.notifications).toEqual([])
    })
  })

  describe('Loading States', () => {
    it('should start with not connecting and not loading', () => {
      const state = useUIStore.getState()
      expect(state.isConnecting).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it('should set connecting state', () => {
      const { setIsConnecting } = useUIStore.getState()

      setIsConnecting(true)
      expect(useUIStore.getState().isConnecting).toBe(true)

      setIsConnecting(false)
      expect(useUIStore.getState().isConnecting).toBe(false)
    })

    it('should set loading state', () => {
      const { setIsLoading } = useUIStore.getState()

      setIsLoading(true)
      expect(useUIStore.getState().isLoading).toBe(true)

      setIsLoading(false)
      expect(useUIStore.getState().isLoading).toBe(false)
    })
  })
})
