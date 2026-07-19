// Mock Phaser for tests
export default {
  Math: {
    DegToRad: (degrees: number) => degrees * (Math.PI / 180),
    RadToDeg: (radians: number) => radians * (180 / Math.PI),
  },
  GameObjects: {
    Sprite: class {
      x = 0
      y = 0
      scaleX = 1
      scaleY = 1
      rotation = 0
      alpha = 1
      displayWidth = 100
      displayHeight = 150
      depth = 1
      input = {}

      setAlpha(alpha: number) {
        this.alpha = alpha
        return this
      }

      setTint() {
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
    },
    Graphics: class {
      alpha = 1
      scaleX = 1
      scaleY = 1

      lineStyle() {
        return this
      }

      strokeRoundedRect() {
        return this
      }

      setDepth() {
        return this
      }

      clear() {
        return this
      }

      destroy() {
        return this
      }
    },
  },
  Scene: class {
    add = {
      graphics: () => new (this as any).GameObjects.Graphics(),
    }
    tweens = {
      add: () => ({}),
    }
  },
}
