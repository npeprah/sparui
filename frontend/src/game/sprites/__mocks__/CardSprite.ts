// Mock CardSprite for testing
export class CardSprite {
  suit: string
  rank: string
  cardId: string
  owner: string | null = null
  x = 100
  y = 200
  scaleX = 1
  scaleY = 1
  rotation = 0
  alpha = 1
  skewY = 0
  displayWidth = 100
  displayHeight = 150
  depth = 1
  input = {}
  scene: any

  private _cardState: 'default' | 'fire' | 'frozen' | 'disabled' = 'default'
  originalY = 200
  private originalScale = 1
  private suitPulseTween: any
  private stateTween: any
  private hoverTween: any
  private glowEffect: any

  constructor(scene: any, x: number, y: number, suit: string, rank: string) {
    this.scene = scene
    this.x = x
    this.y = y
    this.originalY = y
    this.suit = suit
    this.rank = rank
    this.cardId = `${suit}_${rank}_${Date.now()}`
  }

  setAlpha(alpha: number) {
    this.alpha = alpha
    return this
  }

  setTint(_color?: number) {
    return this
  }

  clearTint() {
    return this
  }

  disableInteractive() {
    return this
  }

  setInteractive() {
    return this
  }

  setScale(scale: number) {
    this.scaleX = scale
    this.scaleY = scale
    return this
  }

  emit(_event: string, ..._args: any[]) {
    return this
  }

  on(_event: string, _handler: any) {
    return this
  }

  get cardState() {
    return this._cardState
  }

  setFireState(enabled: boolean) {
    if (enabled && this._cardState !== 'fire') {
      this._cardState = 'fire'
      this.clearStateEffects()
      // Mock animation setup
      this.glowEffect = { destroy: vi.fn() }
      this.stateTween = { stop: vi.fn() }
    } else if (!enabled && this._cardState === 'fire') {
      this._cardState = 'default'
      this.clearStateEffects()
    }
    return this
  }

  setFrozenState(enabled: boolean) {
    if (enabled && this._cardState !== 'frozen') {
      this._cardState = 'frozen'
      this.clearStateEffects()
      this.glowEffect = { destroy: vi.fn() }
      this.stateTween = { stop: vi.fn() }
      this.setTint(0xccddff)
    } else if (!enabled && this._cardState === 'frozen') {
      this._cardState = 'default'
      this.clearStateEffects()
      this.clearTint()
    }
    return this
  }

  setDisabledState(disabled: boolean) {
    if (disabled && this._cardState !== 'disabled') {
      this._cardState = 'disabled'
      this.clearStateEffects()
    } else if (!disabled && this._cardState === 'disabled') {
      this._cardState = 'default'
    }
    return this
  }

  clearStateEffects() {
    if (this.stateTween?.stop) {
      this.stateTween.stop()
      this.stateTween = undefined
    }
    if (this.glowEffect?.destroy) {
      this.glowEffect.destroy()
      this.glowEffect = undefined
    }
  }

  startSuitPulse() {
    if (this.suitPulseTween?.stop) {
      this.suitPulseTween.stop()
    }
    this.suitPulseTween = { stop: vi.fn() }
    return this
  }

  stopSuitPulse() {
    if (this.suitPulseTween?.stop) {
      this.suitPulseTween.stop()
      this.suitPulseTween = undefined
    }
    this.setScale(this.originalScale)
    return this
  }

  animateDeal(targetX: number, targetY: number, _cardIndex: number = 0) {
    this.x = targetX
    this.y = targetY
    this.originalY = targetY
    this.originalScale = this.scaleX
    this.startSuitPulse()
    return this
  }

  animatePlay(tableCenterX: number, tableCenterY: number) {
    this.stopSuitPulse()
    this.x = tableCenterX
    this.y = tableCenterY
    return this
  }

  destroy() {
    this.clearStateEffects()
    if (this.hoverTween?.stop) {
      this.hoverTween.stop()
    }
    if (this.suitPulseTween?.stop) {
      this.suitPulseTween.stop()
    }
    if (this.stateTween?.stop) {
      this.stateTween.stop()
    }
    if (this.glowEffect?.destroy) {
      this.glowEffect.destroy()
    }
  }
}

// Import vi for mocking
import { vi } from 'vitest'
