import * as Phaser from 'phaser'

interface Position {
  x: number
  y: number
}

interface EmitterData {
  emitter: Phaser.GameObjects.Particles.ParticleEmitter
}

/**
 * Where a card-anchored effect should render. Structurally matches
 * `CardSprite.getOverlayAnchor()` so its result can be passed straight through.
 */
export interface CardOverlayAnchor {
  x: number
  y: number
  width: number
  height: number
  depth: number
}

/**
 * Manages particle effects for game celebrations and special effects
 */
export class ParticleEffects {
  private scene: Phaser.Scene
  private activeEmitters: EmitterData[] = []
  private readonly screenWidth = 1280
  private readonly screenHeight = 720

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * Play fire streak effect around winning cards
   */
  playFireStreakEffect(position: Position): void {
    const textures = this.getFireTextures()

    // In Phaser 3, add.particles creates an emitter directly
    const emitter = this.scene.add.particles(position.x, position.y, textures[0], {
      lifespan: 800,
      speed: { min: 100, max: 200 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      angle: { min: -110, max: -70 },
      frequency: 50,
      blendMode: Phaser.BlendModes.ADD,
      frame: textures, // Cycle through all textures
    })

    this.activeEmitters.push({ emitter })

    // Auto-stop after duration
    this.scene.time.delayedCall(
      2000,
      () => {
        this.stopEffect({ emitter })
      },
      [],
      this.scene
    )
  }

  /**
   * Play freeze effect when 6 of spades breaks a fire streak
   */
  playFreezeEffect(position: Position): void {
    const textures = this.getIceTextures()

    const emitter = this.scene.add.particles(position.x, position.y, textures[0], {
      lifespan: 1200,
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 1 },
      alpha: { start: 1, end: 0 },
      angle: { min: 0, max: 360 },
      frequency: 30,
      blendMode: Phaser.BlendModes.NORMAL,
      frame: textures,
    })

    this.activeEmitters.push({ emitter })

    // Auto-stop after duration
    this.scene.time.delayedCall(
      1500,
      () => {
        this.stopEffect({ emitter })
      },
      [],
      this.scene
    )
  }

  /**
   * Play explosion effect for round wins
   */
  playVictoryExplosion(position?: Position): void {
    const pos = position || {
      x: this.screenWidth / 2,
      y: this.screenHeight / 2,
    }

    const textures = this.getExplosionTextures()

    const emitter = this.scene.add.particles(pos.x, pos.y, textures[0], {
      lifespan: 1000,
      speed: { min: 200, max: 400 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      angle: { min: 0, max: 360 },
      quantity: 50,
      blendMode: Phaser.BlendModes.ADD,
      frame: textures,
      frequency: -1, // One-time burst
    })

    // Trigger explosion burst
    emitter.explode(50, pos.x, pos.y)

    this.activeEmitters.push({ emitter })

    // Auto-cleanup after effect
    this.scene.time.delayedCall(
      1000,
      () => {
        this.stopEffect({ emitter })
      },
      [],
      this.scene
    )
  }

  /**
   * Play confetti celebration for game victory
   */
  playConfettiCelebration(): void {
    const textures = this.getConfettiTextures()

    const emitter = this.scene.add.particles(this.screenWidth / 2, 0, textures[0], {
      lifespan: 4000,
      speed: { min: 50, max: 150 },
      scale: { start: 0.8, end: 0.4 },
      alpha: { start: 1, end: 0.5 },
      angle: { min: 60, max: 120 },
      gravityY: 100,
      rotate: { min: 0, max: 360 },
      frequency: 20,
      frame: textures,
    })

    this.activeEmitters.push({ emitter })

    // Auto-stop after duration
    this.scene.time.delayedCall(
      5000,
      () => {
        this.stopEffect({ emitter })
      },
      [],
      this.scene
    )
  }

  /**
   * Play combined victory effect (confetti + explosion)
   */
  playGameVictoryEffect(): void {
    this.playConfettiCelebration()
    this.playVictoryExplosion()
  }

  // ==========================================================================
  // Card-anchored state overlays (ticket 16): fire / freeze composited on the
  // reused illustrated card faces. These build on the SAME particle system - no
  // new framework. The persistent card emitters have their lifecycle owned by
  // the CardSprite they are attached to (which destroys them on detach/round
  // reset), so they are intentionally NOT tracked in `activeEmitters`; the
  // one-shot bursts are transient and self-clean.
  // ==========================================================================

  /** Loaded fire textures, best-first (see PreloadScene.loadParticleAssets). */
  private static readonly FIRE_TEXTURES: readonly string[] = [
    'flame_small',
    'flame_large',
    'fire_trail',
    'embers',
    'firebolt',
  ]

  /** Loaded ice textures, best-first (see PreloadScene.loadParticleAssets). */
  private static readonly ICE_TEXTURES: readonly string[] = [
    'snowflake_small',
    'snowflake_large',
    'frost',
    'ice_shard',
    'freeze_wave',
  ]

  /**
   * First candidate texture actually present in the scene's texture cache, or
   * null when none are loaded (e.g. a bare test scene). Guards against emitting
   * with an unloaded key.
   */
  private firstLoadedTexture(candidates: readonly string[]): string | null {
    const cache = this.scene.textures
    if (!cache || typeof cache.exists !== 'function') return null
    for (const key of candidates) {
      if (cache.exists(key)) return key
    }
    return null
  }

  /**
   * Create a PERSISTENT flame emitter to composite on a card face while a fire
   * streak is active. Flames rise from the card centre. Returns the emitter so
   * the caller can `CardSprite.attachOverlay('fire', emitter)` - the card then
   * owns its lifecycle. Returns undefined when no flame texture is loaded.
   */
  createCardFireEmitter(
    anchor: CardOverlayAnchor
  ): Phaser.GameObjects.Particles.ParticleEmitter | undefined {
    const texture = this.firstLoadedTexture(ParticleEffects.FIRE_TEXTURES)
    if (!texture) return undefined
    const emitter = this.scene.add.particles(anchor.x, anchor.y, texture, {
      lifespan: 700,
      speed: { min: 60, max: 150 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 0.9, end: 0 },
      angle: { min: -110, max: -70 },
      frequency: 55,
      quantity: 2,
      blendMode: Phaser.BlendModes.ADD,
    })
    emitter.setDepth(anchor.depth)
    return emitter
  }

  /**
   * Create a PERSISTENT frost emitter to composite on a card face when it froze
   * a fire streak. Crystals drift outward. Lifecycle is owned by the CardSprite
   * it is attached to. Returns undefined when no ice texture is loaded.
   */
  createCardFreezeEmitter(
    anchor: CardOverlayAnchor
  ): Phaser.GameObjects.Particles.ParticleEmitter | undefined {
    const texture = this.firstLoadedTexture(ParticleEffects.ICE_TEXTURES)
    if (!texture) return undefined
    const emitter = this.scene.add.particles(anchor.x, anchor.y, texture, {
      lifespan: 1100,
      speed: { min: 30, max: 80 },
      scale: { start: 0.2, end: 0.6 },
      alpha: { start: 0.9, end: 0 },
      angle: { min: 0, max: 360 },
      frequency: 70,
      quantity: 1,
      blendMode: Phaser.BlendModes.NORMAL,
    })
    emitter.setDepth(anchor.depth)
    return emitter
  }

  /** One-shot flame burst centred on a card - the fire-streak trigger accent. */
  playCardFlameBurst(anchor: CardOverlayAnchor): void {
    const texture = this.firstLoadedTexture(ParticleEffects.FIRE_TEXTURES)
    if (!texture) return
    const emitter = this.scene.add.particles(anchor.x, anchor.y, texture, {
      lifespan: 600,
      speed: { min: 120, max: 260 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      angle: { min: 0, max: 360 },
      blendMode: Phaser.BlendModes.ADD,
      frequency: -1,
      quantity: 24,
    })
    emitter.setDepth(anchor.depth)
    emitter.explode(24, anchor.x, anchor.y)
    this.trackTransient(emitter, 800)
  }

  /** One-shot frost burst centred on a card - the streak-broken freeze accent. */
  playCardFrostBurst(anchor: CardOverlayAnchor): void {
    const texture = this.firstLoadedTexture(ParticleEffects.ICE_TEXTURES)
    if (!texture) return
    const emitter = this.scene.add.particles(anchor.x, anchor.y, texture, {
      lifespan: 900,
      speed: { min: 80, max: 180 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      angle: { min: 0, max: 360 },
      blendMode: Phaser.BlendModes.NORMAL,
      frequency: -1,
      quantity: 20,
    })
    emitter.setDepth(anchor.depth)
    emitter.explode(20, anchor.x, anchor.y)
    this.trackTransient(emitter, 1000)
  }

  /**
   * Track a transient (self-stopping) emitter so it is stopped/destroyed after
   * `durationMs`, and swept up by {@link cleanup} if the scene ends first.
   */
  private trackTransient(
    emitter: Phaser.GameObjects.Particles.ParticleEmitter,
    durationMs: number
  ): void {
    const data = { emitter }
    this.activeEmitters.push(data)
    this.scene.time.delayedCall(durationMs, () => this.stopEffect(data), [], this.scene)
  }

  /**
   * Stop and cleanup a specific effect
   */
  private stopEffect(effectData: EmitterData): void {
    effectData.emitter.stop()
    effectData.emitter.destroy()

    const index = this.activeEmitters.indexOf(effectData)
    if (index > -1) {
      this.activeEmitters.splice(index, 1)
    }
  }

  /**
   * Cleanup all active particle effects
   */
  cleanup(): void {
    this.activeEmitters.forEach(({ emitter }) => {
      emitter.stop()
      emitter.destroy()
    })
    this.activeEmitters = []
  }

  // Texture getter methods
  private getFireTextures(): string[] {
    return Array.from({ length: 8 }, (_, i) => `flame_${String(i + 1).padStart(2, '0')}`)
  }

  private getIceTextures(): string[] {
    return Array.from({ length: 8 }, (_, i) => `ice_${String(i + 1).padStart(2, '0')}`)
  }

  private getExplosionTextures(): string[] {
    return Array.from({ length: 10 }, (_, i) => `explosion_${String(i + 1).padStart(2, '0')}`)
  }

  private getConfettiTextures(): string[] {
    return Array.from({ length: 8 }, (_, i) => `confetti_${String(i + 1).padStart(2, '0')}`)
  }
}
