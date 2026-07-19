/**
 * In-engine card texture factory (ticket 18).
 *
 * Rasterises every Spar card FACE and the card BACK directly into Phaser canvas
 * textures - keyed exactly as the retired painterly PNGs were
 * (`getCardAssetKey` / `CARD_BACK_KEY`) - so `CardSprite` (a
 * `Phaser.GameObjects.Sprite`) and all its animation / overlay / tint code keep
 * working unchanged; only the pixels behind the key change.
 *
 * The drawn look reproduces the owner-approved 06 EK prototype `.card`: cream
 * body, chunky rounded corners, weight-900 corner ranks (top-left + rotated
 * bottom-right), a large centred suit pip, red/ink suit colours, and the
 * patterned `.backart` card back. The face is palette-agnostic; the per-theme
 * EK border + table chrome around it reskin (see `cardTheme.ts` / `TableScene`).
 *
 * Pure mapping + geometry lives in `cardFace.ts`; this module is the thin Phaser
 * rendering shell around it.
 */

import type Phaser from 'phaser'
import type { Suit, Rank } from '../../store/types'
import { ALL_SUITS, getValidRanksForSuit, getCardAssetKey, CARD_BACK_KEY } from '../constants/cards'
import {
  CARD_TEXTURE_WIDTH,
  CARD_TEXTURE_HEIGHT,
  CARD_FACE_CREAM,
  CARD_FACE_GEOMETRY,
  CARD_BACK_GEOMETRY,
  CARD_BACK_COLORS,
  faceInkColor,
  suitGlyph,
  rankLabel,
} from './cardFace'

const W = CARD_TEXTURE_WIDTH
const H = CARD_TEXTURE_HEIGHT

/** Heavy display font stack matching the prototype's weight-900 corner ranks/pip. */
const FONT_STACK = '"Trebuchet MS", "Arial Black", "Segoe UI", system-ui, sans-serif'

function font(size: number): string {
  return `900 ${size}px ${FONT_STACK}`
}

/** Trace a rounded-rectangle path (native Canvas has no rounded-rect primitive everywhere). */
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/**
 * Generate all 35 face textures + the card back into the scene's texture
 * manager. Idempotent: skips any key already present (so a scene restart or
 * React StrictMode double-mount does not redraw). No-op if the renderer cannot
 * create canvas textures (e.g. a headless unit scene).
 */
export function createCardTextures(scene: Phaser.Scene): void {
  for (const suit of ALL_SUITS) {
    for (const rank of getValidRanksForSuit(suit)) {
      const key = getCardAssetKey(suit, rank)
      if (scene.textures.exists(key)) continue
      drawCardFace(scene, key, suit, rank)
    }
  }
  if (!scene.textures.exists(CARD_BACK_KEY)) {
    drawCardBack(scene, CARD_BACK_KEY)
  }
}

/** Draw one card face (cream body, corner ranks, centred pip) into a texture. */
function drawCardFace(scene: Phaser.Scene, key: string, suit: Suit, rank: Rank): void {
  const canvasTex = scene.textures.createCanvas(key, W, H)
  if (!canvasTex) return
  const ctx = canvasTex.getContext()
  if (!ctx) return

  const g = CARD_FACE_GEOMETRY
  const color = faceInkColor(suit)
  const glyph = suitGlyph(suit)
  const label = rankLabel(rank)

  ctx.clearRect(0, 0, W, H)

  // Cream body.
  roundedRectPath(ctx, 0, 0, W, H, g.cornerRadius)
  ctx.fillStyle = CARD_FACE_CREAM
  ctx.fill()

  ctx.fillStyle = color

  // Large centred suit pip.
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = font(g.pipFontSize)
  ctx.fillText(glyph, W / 2, H / 2)

  // Top-left corner rank + small suit under it.
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = font(g.rankFontSize)
  ctx.fillText(label, g.marginX, g.marginY)
  ctx.font = font(g.rankSuitFontSize)
  ctx.fillText(glyph, g.marginX, g.marginY + g.rankFontSize * 0.96)

  // Bottom-right corner rank, rotated 180deg (mirrors the top-left).
  ctx.save()
  ctx.translate(W - g.marginX, H - g.marginY)
  ctx.rotate(Math.PI)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = font(g.rankFontSize)
  ctx.fillText(label, 0, 0)
  ctx.font = font(g.rankSuitFontSize)
  ctx.fillText(glyph, 0, g.rankFontSize * 0.96)
  ctx.restore()

  canvasTex.refresh()
}

/** Draw the patterned card back (cream body + inset radial/hatch art panel). */
function drawCardBack(scene: Phaser.Scene, key: string): void {
  const canvasTex = scene.textures.createCanvas(key, W, H)
  if (!canvasTex) return
  const ctx = canvasTex.getContext()
  if (!ctx) return

  const g = CARD_BACK_GEOMETRY
  const c = CARD_BACK_COLORS
  const panelW = W - g.inset * 2
  const panelH = H - g.inset * 2
  const cx = W / 2
  const cy = H * 0.4 // radial focus at 50% 40%, matching the prototype

  ctx.clearRect(0, 0, W, H)

  // Cream body (peeks around the art panel).
  roundedRectPath(ctx, 0, 0, W, H, CARD_FACE_GEOMETRY.cornerRadius)
  ctx.fillStyle = CARD_FACE_CREAM
  ctx.fill()

  // Art panel: radial orange->crimson gradient + diagonal white hatch, clipped.
  ctx.save()
  roundedRectPath(ctx, g.inset, g.inset, panelW, panelH, g.panelRadius)
  ctx.clip()

  const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, H * 0.72)
  grad.addColorStop(0, c.gradientInner)
  grad.addColorStop(0.7, c.gradientOuter)
  grad.addColorStop(1, c.gradientOuter)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // 45deg white hatch (repeating-linear-gradient 8px on / 8px off, scaled).
  ctx.strokeStyle = c.stripe
  ctx.lineWidth = 44
  const period = 88
  for (let d = -H; d < W + H; d += period) {
    ctx.beginPath()
    ctx.moveTo(d, 0)
    ctx.lineTo(d + H, H)
    ctx.stroke()
  }
  ctx.restore()

  // Inner white keyline around the art panel.
  roundedRectPath(ctx, g.inset, g.inset, panelW, panelH, g.panelRadius)
  ctx.lineWidth = 16
  ctx.strokeStyle = c.keyline
  ctx.stroke()

  // Centred spade emblem.
  ctx.fillStyle = c.glyph
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = font(g.glyphFontSize)
  ctx.fillText('♠', cx, cy)

  canvasTex.refresh()
}
