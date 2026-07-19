import * as Phaser from 'phaser';

interface Position {
  x: number;
  y: number;
}

interface EmitterData {
  emitter: Phaser.GameObjects.Particles.ParticleEmitter;
}

/**
 * Manages particle effects for game celebrations and special effects
 */
export class ParticleEffects {
  private scene: Phaser.Scene;
  private activeEmitters: EmitterData[] = [];
  private readonly screenWidth = 1280;
  private readonly screenHeight = 720;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Play fire streak effect around winning cards
   */
  playFireStreakEffect(position: Position): void {
    const textures = this.getFireTextures();

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
    });

    this.activeEmitters.push({ emitter });

    // Auto-stop after duration
    this.scene.time.delayedCall(2000, () => {
      this.stopEffect({ emitter });
    }, [], this.scene);
  }

  /**
   * Play freeze effect when 6 of spades breaks a fire streak
   */
  playFreezeEffect(position: Position): void {
    const textures = this.getIceTextures();

    const emitter = this.scene.add.particles(position.x, position.y, textures[0], {
      lifespan: 1200,
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 1 },
      alpha: { start: 1, end: 0 },
      angle: { min: 0, max: 360 },
      frequency: 30,
      blendMode: Phaser.BlendModes.NORMAL,
      frame: textures,
    });

    this.activeEmitters.push({ emitter });

    // Auto-stop after duration
    this.scene.time.delayedCall(1500, () => {
      this.stopEffect({ emitter });
    }, [], this.scene);
  }

  /**
   * Play explosion effect for round wins
   */
  playVictoryExplosion(position?: Position): void {
    const pos = position || {
      x: this.screenWidth / 2,
      y: this.screenHeight / 2
    };

    const textures = this.getExplosionTextures();

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
    });

    // Trigger explosion burst
    emitter.explode(50, pos.x, pos.y);

    this.activeEmitters.push({ emitter });

    // Auto-cleanup after effect
    this.scene.time.delayedCall(1000, () => {
      this.stopEffect({ emitter });
    }, [], this.scene);
  }

  /**
   * Play confetti celebration for game victory
   */
  playConfettiCelebration(): void {
    const textures = this.getConfettiTextures();

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
    });

    this.activeEmitters.push({ emitter });

    // Auto-stop after duration
    this.scene.time.delayedCall(5000, () => {
      this.stopEffect({ emitter });
    }, [], this.scene);
  }

  /**
   * Play combined victory effect (confetti + explosion)
   */
  playGameVictoryEffect(): void {
    this.playConfettiCelebration();
    this.playVictoryExplosion();
  }

  /**
   * Stop and cleanup a specific effect
   */
  private stopEffect(effectData: EmitterData): void {
    effectData.emitter.stop();
    effectData.emitter.destroy();

    const index = this.activeEmitters.indexOf(effectData);
    if (index > -1) {
      this.activeEmitters.splice(index, 1);
    }
  }

  /**
   * Cleanup all active particle effects
   */
  cleanup(): void {
    this.activeEmitters.forEach(({ emitter }) => {
      emitter.stop();
      emitter.destroy();
    });
    this.activeEmitters = [];
  }

  // Texture getter methods
  private getFireTextures(): string[] {
    return Array.from({ length: 8 }, (_, i) =>
      `flame_${String(i + 1).padStart(2, '0')}`
    );
  }

  private getIceTextures(): string[] {
    return Array.from({ length: 8 }, (_, i) =>
      `ice_${String(i + 1).padStart(2, '0')}`
    );
  }

  private getExplosionTextures(): string[] {
    return Array.from({ length: 10 }, (_, i) =>
      `explosion_${String(i + 1).padStart(2, '0')}`
    );
  }

  private getConfettiTextures(): string[] {
    return Array.from({ length: 8 }, (_, i) =>
      `confetti_${String(i + 1).padStart(2, '0')}`
    );
  }
}