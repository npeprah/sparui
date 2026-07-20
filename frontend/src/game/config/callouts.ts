/**
 * Data-driven comic-callout config (ticket 15).
 *
 * Maps each game event to the comic callout it fires: the word(s), the visual
 * style, and the trigger (the game event that pops it). This is a plain data
 * structure a DESIGNER can edit without touching engine code - change a word,
 * retune a style, and the table's speech-bubble banners update. The renderer
 * (`TableScene.showCallout`) combines the chosen style with the ACTIVE palette,
 * so every callout also reskins with the selected theme.
 *
 * Not a player-facing editor (yet) - just the authored source of truth.
 */

/**
 * The game moments that can fire a callout. These are the triggers ticket 14
 * already wired into `TableGameController`; ticket 15 makes the words/styles
 * they show data-driven instead of hard-coded string literals.
 */
export type CalloutEvent =
  | 'bigPlay' // a card slammed onto the pile (your play beat)
  | 'wait' // tried to play out of turn
  | 'roundWin' // won the round (no special effect)
  | 'fireStreak' // won and lit / kept a fire streak
  | 'freeze' // a freeze was triggered this round
  | 'dry' // a face-down "dry" low card was declared
  | 'showDry' // a face-up "show dry" low card was declared
  | 'flagBusted' // a flag/challenge landed (opponent was cheating)
  | 'flagSafe' // a flag/challenge missed (play was legal)
  | 'gameWin' // the whole game was won
  | 'invalid' // a rejected action (bad flag / dry)

/** Which active-palette role fills the callout banner. */
export type CalloutFill = 'accent' | 'danger' | 'pop' | 'ink'

/** Relative emphasis of the callout text. */
export type CalloutSize = 'normal' | 'big' | 'huge'

/** The visual style of a callout, resolved against the active palette at render. */
export interface CalloutStyle {
  /** Palette role that fills the banner background. */
  fill: CalloutFill
  /** Text emphasis (drives the banner font size). */
  size: CalloutSize
  /** Add a quick wiggle to the pop-in for extra punch. */
  shake?: boolean
}

/** A single authored callout: the word(s), its style, and what triggers it. */
export interface CalloutSpec {
  /** The word(s) shown in the banner (a short phrase is fine). */
  word: string
  /** How the banner looks (combined with the active palette). */
  style: CalloutStyle
  /** The game event that fires this callout (mirrors the map key). */
  trigger: CalloutEvent
}

/**
 * The authored callout table. Edit the words and styles here freely; the game
 * looks callouts up by event via {@link resolveCallout}.
 */
export const CALLOUTS: Record<CalloutEvent, CalloutSpec> = {
  bigPlay: {
    word: 'POW!',
    style: { fill: 'accent', size: 'big', shake: true },
    trigger: 'bigPlay',
  },
  wait: { word: 'WAIT', style: { fill: 'ink', size: 'normal' }, trigger: 'wait' },
  roundWin: {
    word: 'YOU TAKE IT!',
    style: { fill: 'accent', size: 'huge', shake: true },
    trigger: 'roundWin',
  },
  fireStreak: {
    word: 'ON FIRE!!!',
    style: { fill: 'danger', size: 'huge', shake: true },
    trigger: 'fireStreak',
  },
  freeze: { word: 'FREEZE!', style: { fill: 'pop', size: 'big' }, trigger: 'freeze' },
  dry: { word: 'DRY!', style: { fill: 'pop', size: 'big' }, trigger: 'dry' },
  showDry: { word: 'SHOW DRY!', style: { fill: 'accent', size: 'big' }, trigger: 'showDry' },
  flagBusted: {
    word: 'CAUGHT YOU!',
    style: { fill: 'danger', size: 'huge', shake: true },
    trigger: 'flagBusted',
  },
  flagSafe: { word: 'SAFE!', style: { fill: 'accent', size: 'big' }, trigger: 'flagSafe' },
  gameWin: {
    word: 'GAME OVER!',
    style: { fill: 'accent', size: 'huge', shake: true },
    trigger: 'gameWin',
  },
  invalid: { word: 'NOPE!', style: { fill: 'danger', size: 'normal' }, trigger: 'invalid' },
}

/** The style used when a callout is shown without an explicit style. */
export const DEFAULT_CALLOUT_STYLE: CalloutStyle = { fill: 'pop', size: 'big' }

/** Resolve the authored callout spec for a game event. */
export function resolveCallout(event: CalloutEvent): CalloutSpec {
  return CALLOUTS[event]
}
