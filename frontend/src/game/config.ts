import Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene'
import { GameScene } from './scenes/GameScene'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: 1280,
  height: 720,
  backgroundColor: '#0a5f38', // Table green
  scene: [PreloadScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  audio: {
    disableWebAudio: false,
    noAudio: false,
  },
  loader: {
    baseURL: '/',
    path: '',
  },
}
