import Phaser from 'phaser'

/**
 * FPS Counter Configuration
 */
export interface FPSCounterConfig {
  x: number
  y: number
  maxHistorySize?: number
  showAverage?: boolean
}

/**
 * FPS Counter - Performance monitoring utility
 * Only visible in development mode (import.meta.env.DEV)
 */
export class FPSCounter {
  private scene: Phaser.Scene
  private text?: Phaser.GameObjects.Text
  private fpsHistory: number[] = []
  private maxHistorySize: number
  private showAverage: boolean

  constructor(scene: Phaser.Scene, config: FPSCounterConfig) {
    this.scene = scene
    this.maxHistorySize = config.maxHistorySize || 60
    this.showAverage = config.showAverage ?? true

    // Only create in development mode
    if (import.meta.env.DEV) {
      this.createFPSText(config.x, config.y)
    }
  }

  /**
   * Create FPS text display
   */
  private createFPSText(x: number, y: number): void {
    this.text = this.scene.add.text(x, y, 'FPS: 60', {
      fontSize: '16px',
      color: '#00ff00',
      fontFamily: 'monospace',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: { x: 8, y: 4 },
    })
    this.text.setOrigin(1, 0) // Top-right anchor
    this.text.setDepth(10000) // Always on top
    this.text.setScrollFactor(0) // Fixed position
  }

  /**
   * Update FPS display (call in scene update loop)
   */
  public update(): void {
    if (!this.text || !import.meta.env.DEV) return

    const currentFps = Math.round(this.scene.game.loop.actualFps)

    // Update history
    this.fpsHistory.push(currentFps)
    if (this.fpsHistory.length > this.maxHistorySize) {
      this.fpsHistory.shift()
    }

    // Calculate average
    const avgFps = this.showAverage ? this.calculateAverage() : null

    // Update text
    let displayText = `FPS: ${currentFps}`
    if (avgFps !== null) {
      displayText += ` (avg: ${avgFps})`
    }
    this.text.setText(displayText)

    // Update color based on performance
    this.text.setColor(this.getColorForFPS(currentFps))
  }

  /**
   * Calculate average FPS from history
   */
  private calculateAverage(): number {
    if (this.fpsHistory.length === 0) return 0

    const sum = this.fpsHistory.reduce((acc, val) => acc + val, 0)
    return Math.round(sum / this.fpsHistory.length)
  }

  /**
   * Get color based on FPS value
   * Green: >= 60 FPS (excellent)
   * Yellow: >= 40 FPS (acceptable)
   * Red: < 40 FPS (poor)
   */
  private getColorForFPS(fps: number): string {
    if (fps >= 60) return '#00ff00' // Green
    if (fps >= 40) return '#ffff00' // Yellow
    return '#ff0000' // Red
  }

  /**
   * Get current FPS
   */
  public getCurrentFPS(): number {
    return Math.round(this.scene.game.loop.actualFps)
  }

  /**
   * Get average FPS
   */
  public getAverageFPS(): number {
    return this.calculateAverage()
  }

  /**
   * Check if FPS meets desktop target (60 FPS)
   */
  public meetsDesktopTarget(): boolean {
    return this.getCurrentFPS() >= 60
  }

  /**
   * Check if FPS meets mobile target (40 FPS)
   */
  public meetsMobileTarget(): boolean {
    return this.getCurrentFPS() >= 40
  }

  /**
   * Show FPS counter
   */
  public show(): void {
    this.text?.setVisible(true)
  }

  /**
   * Hide FPS counter
   */
  public hide(): void {
    this.text?.setVisible(false)
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.text?.destroy()
    this.fpsHistory = []
  }
}

/**
 * Create FPS counter for a scene (dev mode only)
 */
export function createFPSCounter(scene: Phaser.Scene): FPSCounter | null {
  if (!import.meta.env.DEV) {
    return null
  }

  const { width } = scene.cameras.main
  const x = width - 10 // 10px from right edge
  const y = 10 // 10px from top

  return new FPSCounter(scene, { x, y, showAverage: true })
}
