import Phaser from 'phaser'
import { PreloadScene } from './scenes/PreloadScene'
import { TableScene } from './scenes/TableScene'

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: 1280,
  height: 720,
  // Ticket 19 (full-bleed Variant B): the page mounts the canvas edge-to-edge in
  // the viewport with no dark React chrome. Any FIT letterbox band reads as the
  // comic-yellow table itself (matches the prototype's pop-art background), so
  // there is never a dark bar around the table.
  backgroundColor: '#ffd400', // Comic-panel pop-art yellow (Variant B)
  scene: [PreloadScene, TableScene],
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
