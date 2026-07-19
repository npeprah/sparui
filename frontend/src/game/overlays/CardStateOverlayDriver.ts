// ---------------------------------------------------------------------------
// CardStateOverlayDriver - fire / freeze / dry overlay wiring (ticket 16)
//
// The TableScene is a pure renderer of store state; this driver is the thin
// imperative glue that maps the authoritative OVERLAY STATE (gameStore:
// fireStreakPlayerId / frozenCard / dryDeclarations, plus the live played pile)
// onto the CardSprite overlay HOOKS (ticket 12) and the ParticleEffects system.
//
// It owns NO decisions: every "which card / which facing" question is delegated
// to the pure, unit-tested helpers in overlayDecisions.ts. This class only:
//   - reads a store slice + the scene's live pile sprites,
//   - toggles setFireState / setFreezeState on the right pile CardSprite and
//     attaches a persistent ParticleEffects emitter at its overlay anchor,
//   - lays out set-aside dry / show-dry CardSprites (face-down vs face-up) and
//     stamps a small dry marker overlay on them.
//
// No new face art is introduced: the effects are composited on the REUSED
// illustrated card faces via the particle system + CardSprite hooks.
// ---------------------------------------------------------------------------

import Phaser from 'phaser'
import { CardSprite } from '../sprites/CardSprite'
import { ParticleEffects } from '../systems/ParticleEffects'
import { CARD_SCALES } from '../constants/cards'
import {
  type DryDeclarationInfo,
  type DryZoneConfig,
  type OverlayStateSlice,
  drySetAsidePosition,
  reconcileSingleTarget,
  resolveDryRenderSpecs,
  resolveFireTarget,
  resolveFreezeTarget,
} from './overlayDecisions'

/** Depth for set-aside dry cards: above the pile, below the local hand fan. */
const DRY_SPRITE_DEPTH = 350

export class CardStateOverlayDriver {
  private readonly scene: Phaser.Scene
  private readonly particles: ParticleEffects
  private readonly dryZone: DryZoneConfig

  /** Live set-aside dry cards, keyed by the declaring player id. */
  private readonly drySprites = new Map<string, CardSprite>()

  constructor(scene: Phaser.Scene, particles: ParticleEffects, dryZone: DryZoneConfig) {
    this.scene = scene
    this.particles = particles
    this.dryZone = dryZone
  }

  // =========================================================================
  // pile overlays (fire / freeze) - composited on the played cards
  // =========================================================================

  /**
   * Reconcile the fire and freeze overlays against the current pile sprites.
   * Idempotent - safe to call on every relevant store change; a card already in
   * the desired state is left untouched (no re-burst, no re-sound).
   */
  syncPileOverlays(pileSprites: Map<string, CardSprite>, slice: OverlayStateSlice): void {
    this.syncFire(pileSprites, resolveFireTarget(slice)?.playerId ?? null)
    this.syncFreeze(pileSprites, resolveFreezeTarget(slice)?.playerId ?? null)
  }

  private syncFire(pileSprites: Map<string, CardSprite>, targetId: string | null): void {
    const ids = [...pileSprites.keys()]
    const active = ids.filter(id => pileSprites.get(id)?.isOverlayActive('fire'))
    const { toActivate, toDeactivate } = reconcileSingleTarget(ids, active, targetId)

    for (const id of toDeactivate) {
      pileSprites.get(id)?.setFireState(false)
    }
    for (const id of toActivate) {
      const sprite = pileSprites.get(id)
      if (!sprite) continue
      // Built-in ember glow + fire border treatment (ticket 12 hook)...
      sprite.setFireState(true)
      // ...augmented with a live flame emitter anchored to the card face.
      const anchor = sprite.getOverlayAnchor()
      const emitter = this.particles.createCardFireEmitter(anchor)
      if (emitter) sprite.attachOverlay('fire', emitter)
      // ...and a one-shot burst at the moment the streak triggers.
      this.particles.playCardFlameBurst(anchor)
    }
  }

  private syncFreeze(pileSprites: Map<string, CardSprite>, targetId: string | null): void {
    const ids = [...pileSprites.keys()]
    const active = ids.filter(id => pileSprites.get(id)?.isOverlayActive('freeze'))
    const { toActivate, toDeactivate } = reconcileSingleTarget(ids, active, targetId)

    for (const id of toDeactivate) {
      pileSprites.get(id)?.setFreezeState(false)
    }
    for (const id of toActivate) {
      const sprite = pileSprites.get(id)
      if (!sprite) continue
      // Built-in frost glow + blue tint (ticket 12 hook)...
      sprite.setFreezeState(true)
      // ...augmented with a live frost emitter anchored to the card face.
      const anchor = sprite.getOverlayAnchor()
      const emitter = this.particles.createCardFreezeEmitter(anchor)
      if (emitter) sprite.attachOverlay('freeze', emitter)
      // ...and a one-shot frost burst at the moment the streak is broken.
      this.particles.playCardFrostBurst(anchor)
    }
  }

  // =========================================================================
  // dry / show-dry set-aside cards
  // =========================================================================

  /**
   * Reconcile the set-aside dry cards. New declarations spawn a CardSprite laid
   * face-down (hidden dry) or face-up (show-dry); cleared declarations (e.g. on
   * a play-again re-init) are removed. Hidden-dry identity is withheld - the
   * sprite is built from a placeholder and only ever shown as a card-back.
   */
  syncDryOverlays(dryDeclarations: Record<string, DryDeclarationInfo>): void {
    const specs = resolveDryRenderSpecs(dryDeclarations)
    const live = new Set(specs.map(s => s.playerId))

    // Remove set-aside cards whose declaration is gone.
    for (const [playerId, sprite] of this.drySprites) {
      if (!live.has(playerId)) {
        sprite.destroy()
        this.drySprites.delete(playerId)
      }
    }

    // Spawn newly-declared set-aside cards.
    specs.forEach((spec, index) => {
      if (this.drySprites.has(spec.playerId)) return
      const pos = drySetAsidePosition(index, this.dryZone)
      const sprite = new CardSprite(this.scene, pos.x, pos.y, spec.suit, spec.rank, spec.playerId)
      sprite.setScale(CARD_SCALES.PLAYED)
      sprite.setDepth(DRY_SPRITE_DEPTH + index)
      sprite.setPlayable(false)
      // Set-aside cards are inert - not part of the playable hand.
      sprite.disableInteractive()
      // Hidden dry -> face-down (identity withheld); show-dry -> face-up.
      sprite.setFaceDown(spec.faceDown, false)
      sprite.setDryState(true)
      this.attachDryMarker(sprite, spec.revealsIdentity)
      this.drySprites.set(spec.playerId, sprite)
    })
  }

  /**
   * Stamp a small "DRY" / "SHOW DRY" marker on a set-aside card via the dry
   * overlay slot, so it tracks the card and is torn down with it.
   */
  private attachDryMarker(sprite: CardSprite, revealsIdentity: boolean): void {
    if (typeof this.scene.add?.text !== 'function') return
    const anchor = sprite.getOverlayAnchor()
    const marker = this.scene.add.text(anchor.x, anchor.y, revealsIdentity ? 'SHOW DRY' : 'DRY', {
      fontFamily: 'Impact, "Arial Black", sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#101010',
      padding: { x: 6, y: 2 },
    })
    marker.setOrigin(0.5)
    marker.setDepth(anchor.depth)
    sprite.attachOverlay('dry', marker)
  }

  // =========================================================================
  // teardown
  // =========================================================================

  destroy(): void {
    for (const [, sprite] of this.drySprites) sprite.destroy()
    this.drySprites.clear()
  }
}
