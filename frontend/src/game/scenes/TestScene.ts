import Phaser from 'phaser'

export class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TestScene' })
  }

  preload() {
    // Assets will be loaded here in future
  }

  create() {
    // Add background
    this.add.rectangle(640, 360, 1280, 720, 0x0a5f38)

    // Add title text
    const title = this.add.text(640, 200, 'Spar', {
      fontSize: '72px',
      color: '#FFD700',
      fontStyle: 'bold',
    })
    title.setOrigin(0.5)

    // Add subtitle
    const subtitle = this.add.text(640, 280, 'Phaser 3 Integration Test', {
      fontSize: '32px',
      color: '#00BFFF',
    })
    subtitle.setOrigin(0.5)

    // Create particle texture first
    const graphics = this.add.graphics()
    graphics.fillStyle(0xff4500, 1)
    graphics.fillCircle(4, 4, 4)
    graphics.generateTexture('particle', 8, 8)
    graphics.destroy()

    // Add a test card placeholder
    const card = this.add.rectangle(640, 450, 120, 168, 0xffffff)
    card.setStrokeStyle(2, 0x000000)

    const cardText = this.add.text(640, 450, '🂡', {
      fontSize: '64px',
    })
    cardText.setOrigin(0.5)

    // Add animated particles for testing
    const particles = this.add.particles(0, 0, 'particle', {
      speed: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      quantity: 2,
      frequency: 50,
    })

    particles.startFollow(card)
  }

  update() {
    // Game loop updates will go here
  }
}
