/**
 * Table backdrop model (ticket 18).
 *
 * The 06 EK prototype gives each palette a distinct backdrop:
 *   - Warm Heritage (variant A): a warm radial glow (cream -> gold -> orange).
 *   - Comic (variant B): a flat yellow diagonal wash under a Ben-Day halftone.
 *   - Neon (variant C): a deep radial (violet -> near-black) under scanlines.
 *
 * The comic-panel CHROME (ink frame, halftone/scanline texture, speech-bubble
 * banner, POW bursts) is the chosen table structure and stays constant; only
 * these backdrop colours/gradient and the overlay texture reskin per palette.
 *
 * This module is the pure, unit-testable description of that backdrop; the Phaser
 * rendering in `TableScene.buildBackground` rasterises it into a canvas texture.
 */

import type { EKBorderTreatment } from '../constants/cardTheme'

/** Overlay texture drawn over the backdrop, per palette. */
export type BackdropTexture = 'halftone' | 'scanlines'

/** A single gradient colour stop: `offset` in 0..1, `color` as `#rrggbb`. */
export interface BackdropStop {
  offset: number
  color: string
}

/** Resolved backdrop description for one treatment. */
export interface BackdropSpec {
  /** `radial` centres the gradient on `focusX/focusY`; `linear` runs top-left -> bottom-right. */
  kind: 'radial' | 'linear'
  stops: BackdropStop[]
  /** Radial focus as a fraction of width/height (ignored for linear). */
  focusX: number
  focusY: number
  /** Which comic texture overlays this backdrop. */
  texture: BackdropTexture
}

const BACKDROPS: Record<EKBorderTreatment, BackdropSpec> = {
  // Warm Heritage: warm radial glow, halftone dots (from prototype variant A + B chrome).
  gold: {
    kind: 'radial',
    focusX: 0.5,
    focusY: 0.42,
    stops: [
      { offset: 0, color: '#ffe9c7' },
      { offset: 0.42, color: '#f6c98a' },
      { offset: 1, color: '#e0964a' },
    ],
    texture: 'halftone',
  },
  // Comic Panel: flat yellow diagonal wash, halftone dots.
  comic: {
    kind: 'linear',
    focusX: 0.5,
    focusY: 0.5,
    stops: [
      { offset: 0, color: '#ffd400' },
      { offset: 1, color: '#ffb700' },
    ],
    texture: 'halftone',
  },
  // Neon Arcade: deep violet radial, cyan/magenta scanline grid.
  neon: {
    kind: 'radial',
    focusX: 0.5,
    focusY: 0.3,
    stops: [
      { offset: 0, color: '#2a0a4a' },
      { offset: 0.55, color: '#12042a' },
      { offset: 1, color: '#05010f' },
    ],
    texture: 'scanlines',
  },
}

/** Resolve the backdrop spec for an EK treatment (defaults to the warm gold backdrop). */
export function getBackdropSpec(treatment: EKBorderTreatment): BackdropSpec {
  return BACKDROPS[treatment] ?? BACKDROPS.gold
}
