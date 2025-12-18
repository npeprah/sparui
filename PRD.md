# Spar - Product Requirements Document

## Version History
- v1.0 - December 17, 2025 - Initial PRD

---

## 1. Product Overview

### 1.1 Vision
Spar is a digital recreation of a traditional Ghanaian card game, reimagined with explosive arcade-style presentation inspired by NBA Jam, NFL Blitz, and Mortal Kombat. The game combines strategic card play with over-the-top visual effects to create an exciting, fast-paced multiplayer experience.

### 1.2 Target Platforms
- **Phase 1 (MVP)**: Web (Progressive Web App)
- **Phase 2**: iOS and Android (via Capacitor)

### 1.3 Core Experience
Players compete in real-time multiplayer card games where strategy meets spectacle. Win streaks trigger fire effects, game-changing plays freeze the table, and victories explode with arcade flair.

---

## 2. Game Rules & Mechanics

### 2.1 Players
- **Minimum**: 2 players
- **Maximum**: 4 players
- **Modes**:
  - Online multiplayer (real-time)
  - Private games with friends
  - Public matchmaking
  - Single-player vs AI

### 2.2 Deck Composition
The game uses a modified standard deck containing **35 cards**:

**Hearts** (9 cards): 6, 7, 8, 9, 10, Jack, Queen, King, Ace
**Clubs** (9 cards): 6, 7, 8, 9, 10, Jack, Queen, King, Ace
**Diamonds** (9 cards): 6, 7, 8, 9, 10, Jack, Queen, King, Ace
**Spades** (8 cards): 6, 7, 8, 9, 10, Jack, Queen, King (NO ACE)

**Card Hierarchy**: Ace (highest) → King → Queen → Jack → 10 → 9 → 8 → 7 → 6 (lowest)

### 2.3 Game Setup

#### Deal
- Each player receives **5 cards** randomly
- Cards are dealt face-down

#### Leader Selection
- **First game**: Random player is chosen as leader
- **Subsequent games**: Winner of previous round becomes leader

### 2.4 Gameplay Flow

#### Round Structure
A game consists of **5 rounds** (one card played per round).

#### Playing Cards

1. **The Leader Plays First**
   - Leader plays any card from their hand
   - This card sets the **"suit to follow"** for the round
   - **Leader's Time**: 15 seconds to play a card

2. **Following Players Respond**
   - **Turn Order**: Clockwise (player to the right of leader goes next)
   - **Play Timing**:
     - **First player after leader**: 8 seconds to play
     - **Second player**: 5 seconds to play
     - **Third player**: 5 seconds to play
   - **Fast-Paced Chaos**: Players can play out of order in the rush, creating opportunities for mistakes
   - **Suit Rule**: If you have a card of the led suit, you're expected to play it
   - **Freedom**: You are NOT forced to play a suit card (strategic choice)
   - **No Pauses**: Game flows continuously - watch carefully or you might follow the wrong leader!

3. **Challenge Mechanic ("Flagging")**
   - If a player has a suit card but plays a different suit
   - Other players can **flag** them for not following suit
   - **If flagged correctly**:
     - Flagged player receives **-3 points**
     - Current round ends immediately
     - New cards are dealt for next round
   - **If flagged incorrectly** (player didn't have the suit):
     - Challenger receives **-3 points**
     - Current round ends immediately
     - New cards are dealt for next round
   - This adds risk to both strategic non-suit plays AND challenging other players
   - The fast pace means mistakes happen - catching them is part of the skill!

#### Winning a Round
- **Highest card of the led suit wins**
- Winner of the round becomes the leader for the next round

**Example:**
```
Leader plays: 10♥
Player 2: 9♥
Player 3: King♥
Player 4: Ace♥

Winner: Player 4 (Ace♥ is highest)
Player 4 leads next round
```

#### No Suit Disqualification
- If a player doesn't have the led suit, they're disqualified from winning that round
- They can play any card (it won't affect the round outcome)
- **Special Case**: If NO player has the led suit, the leader remains leader for the next round

**Example:**
```
Leader plays: 6♥
All players have no hearts

Result: Leader wins by default and leads next round
```

### 2.5 Scoring System

#### Basic Scoring (Final Round Winner)
The winner is determined by whoever wins **the 5th and final round**.

- **Win with 6**: **3 points**
- **Win with 7**: **2 points**
- **Win with 8 or higher**: **1 point**

#### Advanced Mechanic: "Dry" and "Show Dry"

Players can declare a 6 or 7 card at the **start of the game** to potentially earn bonus points.

**Dry (Face-Down Declaration)**
- Place a 6 or 7 face-down at the start
- If you win the **final round** with this card:
  - **6 (Dry)**: **6 points**
  - **7 (Dry)**: **4 points**

**Show Dry (Face-Up Declaration)**
- Place a 6 or 7 face-up at the start (visible to all)
- Higher risk, higher reward
- If you win the **final round** with this card:
  - **6 (Show Dry)**: **12 points**
  - **7 (Show Dry)**: **8 points**

**Strategic Notes:**
- You can only declare ONE dry/show dry card per game
- Once declared, you have 4 other cards to strategically manage rounds
- Opponents know you have a low card set aside (if show dry)
- Must save the declared card for the final round to get bonus points

### 2.6 Win Streaks & Special Effects

#### Fire Streak 🔥
- **Trigger**: Win 3 consecutive rounds as leader
- **Effect**: On the 4th round, your played card appears **on fire**
- **Visual**: Flames, orange glow, particle effects, "He's on Fire!" text

#### Freeze Counter ❄️
- **Trigger**: Another player breaks your fire streak by winning a round
- **Effect**: Their card **freezes the table**
- **Visual**: Ice particles, blue frost spreading across table, freeze sound effect

### 2.7 Victory Conditions

#### Single Game
- Winner of the **5th round** wins the game
- Points awarded based on winning card value (see 2.5 Scoring)

#### Match Series
- First player to reach a predetermined point total (e.g., 10, 15, or 21 points)
- Track cumulative points across multiple games

---

## 3. Visual Design & Arcade Style

### 3.1 Design Philosophy
**"Over-the-top arcade mayhem meets strategic card play"**

Inspired by:
- **NBA Jam / NFL Blitz**: Exaggerated effects, announcer calls, "He's on fire!"
- **Mortal Kombat**: "Toasty!" style pop-ups, explosive finishers
- **Hearthstone / Marvel Snap**: Flashy card reveals, impact animations
- **FIFA Street**: Urban style, high energy, accessible fun

### 3.2 Color Palette

#### Primary Colors
- **Fire Red**: `#FF4500` (Win streaks, danger, energy)
- **Ice Blue**: `#00BFFF` (Freeze effects, calm, counter)
- **Gold**: `#FFD700` (Victory, highlights, leader indicators)
- **Deep Purple**: `#8B00FF` (Premium feel, UI accents)

#### Surface Themes
Each surface has a unique color scheme:

1. **Professional Poker Table** (Default)
   - Felt Green: `#0A5F38`
   - Wood Trim: `#4A2511`
   - Luxe Gold Accents: `#D4AF37`

2. **Street Court (Concrete)**
   - Gray Concrete: `#808080`
   - Graffiti Accents: Multi-color
   - Urban Yellow Lines: `#FFEB3B`

3. **Wooden Floor (Gym)**
   - Light Oak: `#C19A6B`
   - Polished Sheen
   - Court Line White: `#FFFFFF`

4. **Neon Cyberpunk**
   - Dark Base: `#0D0221`
   - Neon Pink: `#FF006E`
   - Neon Cyan: `#00F5FF`

5. **Beach Sand**
   - Sandy Yellow: `#F4A460`
   - Ocean Blue Hints: `#006994`
   - Tropical Vibes

#### Card Design Themes
Players can customize the visual style of the playing cards independently from the table surface. Each theme maintains the same card layout and readability while offering distinct aesthetics.

1. **Afro-Heritage** (Default) ⭐
   - Warm cream backgrounds (`#FFF5E6`, `#FFE8D6`, `#FFF9F0`)
   - Kente cloth-inspired geometric patterns
   - Brown/tan pattern overlays with gold accents
   - Cultural, traditional feel with African motifs
   - Fire Red (`#FF4500`) suit symbols
   - Gold (`#FFD700`) decorative borders

2. **Neon Arcade** ⚡
   - Bright white backgrounds (`#FFFFFF`)
   - Electric cyan (`#00FFFF`), magenta (`#FF00FF`), lime (`#CCFF00`)
   - Intense glow effects on all elements
   - Pure arcade cabinet energy
   - Rainbow gradient suit symbols

3. **Sunset Fire** 🌅
   - Warm peach/coral backgrounds (`#FFE5CC`, `#FFD4B3`)
   - Orange (`#FF6600`), red (`#FF4500`), gold (`#FFD700`) palette
   - Fire-inspired gradients
   - Warm vibrant energy with sunset gradients

4. **Royal Gold** 👑
   - Deep purple backgrounds (`#4B0082`, `#6A0DAD`)
   - Bright gold (`#FFD700`) and amber (`#FFBF00`) accents
   - African royalty aesthetic
   - Luxurious, regal, prestigious feel

5. **Ocean Breeze** 🌊
   - Turquoise backgrounds (`#40E0D0`, `#48D1CC`)
   - Teal (`#008080`), aqua (`#00FFFF`), seafoam (`#98FF98`)
   - Fresh, coastal vibes
   - Cool and energetic palette

6. **Festival Drums** 🎉
   - Multi-color gradient backgrounds
   - Pink (`#FF1493`), gold (`#FFD700`), green (`#32CD32`), purple (`#8B00FF`)
   - Rainbow animated suit symbols
   - Maximum celebration energy

**Theme Selection:**
- Available in Settings menu
- Preview all themes before selection
- Choice saved to player profile
- Applies to all games
- Does not affect other players' views (client-side only)

### 3.3 Animation Style

#### Card Animations
- **Card Deal**: Fast slide-in from deck with slight rotation
- **Card Play**: Smooth arc motion toward table center with bounce
- **Card Flip**: 3D flip animation (180° Y-axis rotation)
- **Card Glow**: Pulsing outline when hovering/selected

#### Special Effects

**Fire Effects** 🔥
- Particle system: Orange/red/yellow flames
- Heat distortion shader on surrounding area
- Screen shake (subtle)
- Fire trail when card moves
- "ON FIRE!" text explosion

**Freeze Effects** ❄️
- Ice crystal particles spreading from card
- Blue frost overlay on table
- Frozen vapor clouds
- "FROZEN!" icy text shatter

**Explosions** 💥
- Confetti burst on game win
- Star particles
- Screen flash (white to normal)
- Zoom in/out effect

**Win Streak Combo Display**
- Combo counter appears above player avatar
- Each consecutive win adds to counter with impact
- "2X COMBO!" → "3X STREAK!" → "🔥 ON FIRE! 🔥"

**Toasty Moments** (Random Easter Eggs)
- Small character pop-up in corner during intense plays
- "Toasty!" style audio sting
- Rare occurrence (5-10% chance on special plays)

#### UI Transitions
- Screen wipes (slide, fade)
- Menu buttons: Scale + glow on hover
- Modal dialogs: Zoom in from center with backdrop blur
- Page transitions: Smooth cross-fade

### 3.4 Typography

**Headers**: Bold, impactful font (similar to "Impact" or "Bebas Neue")
- Game title: 72px
- Section headers: 48px
- Button text: 24px

**Body Text**: Clean, readable sans-serif (e.g., "Inter" or "Roboto")
- UI labels: 16px
- Card values: 32px (on cards)
- Player names: 18px

**Special Text** (Effects):
- Fire text: Flame shader effect
- Freeze text: Icy crystalline effect
- Victory text: Gold gradient with glow

### 3.5 Sound Design Strategy

#### Music
- **Menu**: Upbeat Afrobeat-inspired electronic music (medium tempo)
- **Gameplay**: Energetic beat with dynamic intensity
  - Calm when planning
  - Intense during fire streaks
- **Victory**: Triumphant horn section with celebration beat

#### Sound Effects
- **Card Sounds**:
  - Deal: Shuffling/sliding
  - Play: Whoosh + table thud
  - Win round: Bright ding

- **Special Effects**:
  - Fire ignition: Whoosh + crackle
  - Freeze: Ice crack + crystalline chime
  - Explosion: Boom + confetti scatter

- **UI Sounds**:
  - Button click: Subtle tap
  - Menu transition: Smooth swoosh
  - Error: Gentle negative tone

- **Announcer Calls** (optional Phase 2):
  - "He's on Fire!"
  - "Ice Cold!"
  - "Domination!"
  - "Comeback!"

---

## 4. User Interface Mockups

### 4.1 Main Menu Screen

```
┌─────────────────────────────────────────────┐
│                                             │
│              🃏  S P A R  🃏                │
│         [Animated logo with flames]         │
│                                             │
│                                             │
│         ┌────────────────────┐              │
│         │   QUICK MATCH      │ ← Glowing    │
│         └────────────────────┘              │
│                                             │
│         ┌────────────────────┐              │
│         │   PRIVATE GAME     │              │
│         └────────────────────┘              │
│                                             │
│         ┌────────────────────┐              │
│         │   PLAY vs AI       │              │
│         └────────────────────┘              │
│                                             │
│         ┌────────────────────┐              │
│         │   SETTINGS         │              │
│         └────────────────────┘              │
│                                             │
│  [Profile Icon]              [Stats Icon]   │
│   PlayerName                  🏆 45 Wins    │
└─────────────────────────────────────────────┘
```

**Layout Details:**
- Animated background: Subtle card particles floating
- Logo: Glowing cards fanning out
- Buttons: Hover effect with scale + glow
- Profile widget (bottom left): Avatar + username
- Stats widget (bottom right): Trophy count

---

### 4.2 Game Lobby Screen

```
┌─────────────────────────────────────────────┐
│  [← Back]           LOBBY            [⚙️]   │
├─────────────────────────────────────────────┤
│                                             │
│  Room Code: XK9P2L      [📋 Copy]          │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Players (2/4)                      │   │
│  │                                     │   │
│  │  👤 You          [Ready] ✓         │   │
│  │  👤 Player2      [Waiting...]       │   │
│  │  ⬜ Empty Slot                      │   │
│  │  ⬜ Empty Slot                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Game Settings                      │   │
│  │                                     │   │
│  │  Points to Win:  [10] [15] [21]    │   │
│  │  Surface Theme:  [Poker Table ▼]   │   │
│  │  AI Difficulty:  [Easy] [Medium]   │   │
│  │                  [Hard]             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│         ┌────────────────────┐              │
│         │   START GAME       │ (if host)    │
│         └────────────────────┘              │
│                                             │
└─────────────────────────────────────────────┘
```

**Layout Details:**
- Room code prominent for sharing
- Player slots show avatars + ready status
- Host has game settings control
- Start button only enabled when minimum players ready

---

### 4.3 Main Game Screen (4-Player Layout)

```
┌─────────────────────────────────────────────────────────────┐
│  [⚙️]  SPAR           Round 3/5       [Score] You: 2  [?]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      👤 Player 3                            │
│                   ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐                      │
│                   └─┘ └─┘ └─┘ └─┘ └─┘  (cards)             │
│                   ⭐ Leader | 🔥 Streak: 2                  │
│                                                             │
│                                                             │
│  👤 Player 2                              👤 Player 4       │
│  ┌─┐ ┌─┐ ┌─┐                              ┌─┐ ┌─┐ ┌─┐      │
│  └─┘ └─┘ └─┘                              └─┘ └─┘ └─┘      │
│                                                             │
│              ╔══════════════════╗                           │
│              ║                  ║                           │
│              ║  [Table Center]  ║                           │
│              ║                  ║                           │
│              ║   [Played Cards  ║                           │
│              ║    appear here]  ║                           │
│              ║                  ║                           │
│              ╚══════════════════╝                           │
│           [Current Theme: Poker Table]                      │
│                                                             │
│                                                             │
│                      👤 YOU                                 │
│              ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                │
│              │ 7 │ │ 9 │ │ J │ │ K │ │ A │                │
│              │ ♥ │ │ ♦ │ │ ♣ │ │ ♥ │ │ ♠ │                │
│              └───┘ └───┘ └───┘ └───┘ └───┘                │
│              [Hover to see glow, click to play]            │
│                                                             │
│  [Dry: 6♣]  (if declared)                  [Chat 💬]       │
└─────────────────────────────────────────────────────────────┘
```

**Layout Details:**

**Top Bar:**
- Settings icon (left)
- Game title center
- Round counter
- Current scores
- Help icon (right)

**Player Positions:**
- **4-player**: Top, left, right, bottom (you)
- **3-player**: Top, left, right (you)
- **2-player**: Top (opponent), bottom (you)

**Player Info Display:**
- Avatar with username
- Card count indicator
- Leader star (⭐) if current leader
- Streak counter (🔥 Streak: X) when active
- **Timer countdown** displayed prominently when it's their turn:
  - Leader: 15s ⏱️ (green → yellow → red)
  - Next player: 8s ⏱️
  - Other players: 5s ⏱️
- Pulsing border when it's their turn to play

**Table Center:**
- Played cards appear in the center
- Visual effect based on current surface theme
- Animations: cards fly from player hand to center
- **No result screens** - winner of each round is shown briefly with a visual highlight (glow, crown icon)
- Cards immediately clear for next round (1-second highlight only)
- **Continuous fast-paced gameplay** - stay focused!

**Your Hand (Bottom):**
- 5 cards displayed face-up
- Larger, interactive cards
- Hover effect: Card lifts up + glows
- Click to play
- Declared dry/show dry card shown separately (left side)

**Side Panels:**
- Chat button (bottom right)
- Game log/history (optional, top right)

---

### 4.4 Card Design

```
┌─────────┐        ┌─────────┐        ┌─────────┐
│ A       │        │ K       │        │ 7       │
│         │        │         │        │         │
│    ♠    │        │    ♥    │        │    ♦    │
│         │        │         │        │         │
│       A │        │       K │        │       7 │
└─────────┘        └─────────┘        └─────────┘
  (Standard)         (Standard)        (Standard)

┌─────────┐        ┌─────────┐
│ 🔥 A 🔥  │        │ ❄️ K ❄️  │
│         │        │         │
│  ♠ 🔥 ♠  │        │  ♥ ❄️ ♥  │
│         │        │         │
│ 🔥 A 🔥  │        │ ❄️ K ❄️  │
└─────────┘        └─────────┘
  (On Fire)         (Frozen)
```

**Card Design Elements:**
- **Border**: Rounded corners, subtle gradient
- **Background**: Light texture (felt, wood grain based on theme)
- **Suit Symbols**: Large, centered, with gradient
- **Face Cards**: Stylized character art (Jack, Queen, King)
- **Fire State**: Orange glow, flame particles around card
- **Frozen State**: Blue tint, ice crystals on corners
- **Dry Declaration**: Special back design (face-down) or badge (face-up)

---

### 4.5 Dry/Show Dry Declaration Screen

```
┌─────────────────────────────────────────────┐
│            DECLARE DRY CARD?                │
├─────────────────────────────────────────────┤
│                                             │
│  You have low cards in your hand.           │
│  Declare a 6 or 7 for bonus points!        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │         🎴 Your Options              │   │
│  │                                      │   │
│  │  ┌───┐                  ┌───┐       │   │
│  │  │ 6 │                  │ 7 │       │   │
│  │  │ ♣ │                  │ ♦ │       │   │
│  │  └───┘                  └───┘       │   │
│  │                                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Declare as:                                │
│                                             │
│  ┌──────────────────┐  ┌──────────────────┐│
│  │   🤫 DRY         │  │   😎 SHOW DRY    ││
│  │   (Face-Down)   │  │   (Face-Up)      ││
│  │                  │  │                  ││
│  │   Win with 6:   │  │   Win with 6:    ││
│  │   6 points       │  │   12 points      ││
│  │                  │  │                  ││
│  │   Win with 7:   │  │   Win with 7:    ││
│  │   4 points       │  │   8 points       ││
│  └──────────────────┘  └──────────────────┘│
│                                             │
│           ┌────────────────────┐            │
│           │   SKIP - NO DRY    │            │
│           └────────────────────┘            │
│                                             │
└─────────────────────────────────────────────┘
```

**Interaction Flow:**
1. After cards are dealt, this modal appears (5-second window)
2. Player selects a 6 or 7 from their hand
3. Chooses "Dry" or "Show Dry"
4. Or skips to play normally
5. Declared card is set aside visually

---

### 4.6 Win Streak "On Fire" Overlay

```
┌─────────────────────────────────────────────┐
│                                             │
│              [Game continues...]            │
│                                             │
│     🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥              │
│                                             │
│       ██╗  ██╗███████╗███████╗              │
│       ██║  ██║██╔════╝██╔════╝              │
│       ███████║█████╗  ███████╗              │
│       ██╔══██║██╔══╝  ╚════██║              │
│       ██║  ██║███████╗███████║              │
│       ╚═╝  ╚═╝╚══════╝╚══════╝              │
│                                             │
│        ███████╗███╗   ██╗                   │
│        ██╔════╝████╗  ██║                   │
│        █████╗  ██╔██╗ ██║                   │
│        ██╔══╝  ██║╚██╗██║                   │
│        ██║     ██║ ╚████║                   │
│        ╚═╝     ╚═╝  ╚═══╝                   │
│                                             │
│      ███████╗██╗██████╗ ███████╗██╗         │
│      ██╔════╝██║██╔══██╗██╔════╝██║         │
│      █████╗  ██║██████╔╝█████╗  ██║         │
│      ██╔══╝  ██║██╔══██╗██╔══╝  ╚═╝         │
│      ██║     ██║██║  ██║███████╗██╗         │
│      ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝         │
│                                             │
│     🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥              │
│                                             │
│              [Fade after 1.5s]              │
│                                             │
└─────────────────────────────────────────────┘
```

**Animation:**
- Fills screen center (semi-transparent background)
- Fire particles animating around text
- Screen shake effect
- Loud fire ignition sound
- Fades out after 1.5 seconds

---

### 4.7 Game Over Victory Screen

```
┌─────────────────────────────────────────────┐
│                                             │
│              💥💥💥💥💥💥💥                      │
│                                             │
│        ██╗   ██╗██╗ ██████╗████████╗        │
│        ██║   ██║██║██╔════╝╚══██╔══╝        │
│        ██║   ██║██║██║        ██║           │
│        ╚██╗ ██╔╝██║██║        ██║           │
│         ╚████╔╝ ██║╚██████╗   ██║           │
│          ╚═══╝  ╚═╝ ╚═════╝   ╚═╝           │
│                                             │
│        ██████╗ ██████╗ ██╗   ██╗██╗         │
│        ██╔══██╗██╔══██╗╚██╗ ██╔╝██║         │
│        ██║  ██║██████╔╝ ╚████╔╝ ██║         │
│        ██║  ██║██╔══██╗  ╚██╔╝  ╚═╝         │
│        ██████╔╝██║  ██║   ██║   ██╗         │
│        ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝         │
│                                             │
│              💥💥💥💥💥💥💥                      │
│                                             │
│  Winner: Player 1                           │
│  Winning Card: 6♣ (Show Dry)                │
│  Points Earned: 12                          │
│                                             │
│  Final Scores:                              │
│  🥇 Player 1: 15                            │
│  🥈 Player 2: 8                             │
│  🥉 Player 3: 5                             │
│  4️⃣ Player 4: 2                             │
│                                             │
│  ┌──────────────┐  ┌──────────────┐         │
│  │  PLAY AGAIN  │  │  MAIN MENU   │         │
│  └──────────────┘  └──────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

**Animation:**
- Confetti explosion
- Winner's avatar zooms in
- Gold particle shower
- Victory music plays

---

### 4.8 Flagging Challenge Screen

```
┌─────────────────────────────────────────────┐
│         ⚠️ SUIT CHALLENGE! ⚠️                │
├─────────────────────────────────────────────┤
│                                             │
│  Player 2 played: [9♦]                      │
│  Required suit: ♥ Hearts                    │
│                                             │
│  Did Player 2 have a Hearts card?           │
│                                             │
│  ┌────────────────┐  ┌────────────────┐    │
│  │  🚩 FLAG       │  │  ✓ ALLOW       │    │
│  │  (Challenge)   │  │  (No penalty)  │    │
│  └────────────────┘  └────────────────┘    │
│                                             │
│  If flagged correctly: Player 2 gets -3     │
│  If flagged incorrectly: You get -3         │
│                                             │
│             [10 second timer ⏱️]            │
│                                             │
└─────────────────────────────────────────────┘
```

**Interaction:**
- Appears when a player suspects suit violation
- 10-second window to challenge
- **High risk/reward decision** - Wrong challenges cost you -3 points!
- Shows revealed hand after challenge resolves
- Round ends immediately after challenge resolution

---

### 4.9 Theme Selection Preview

**Settings Menu - Two Theme Categories:**

#### A. Table Surface Themes
```
┌─────────────────────────────────────────────┐
│          SELECT TABLE THEME                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ [Preview]   │  │ [Preview]   │          │
│  │   Poker     │  │   Street    │          │
│  │   Table     │  │   Court     │          │
│  │ [✓ Selected]│  │             │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ [Preview]   │  │ [Preview]   │          │
│  │   Wooden    │  │    Neon     │          │
│  │   Floor     │  │ Cyberpunk   │          │
│  │             │  │             │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  ┌─────────────┐                            │
│  │ [Preview]   │                            │
│  │   Beach     │                            │
│  │   Sand      │                            │
│  │             │                            │
│  └─────────────┘                            │
│                                             │
└─────────────────────────────────────────────┘
```

#### B. Card Design Themes (NEW)
```
┌─────────────────────────────────────────────┐
│          SELECT CARD THEME                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ [Preview]   │  │ [Preview]   │          │
│  │    Afro-    │  │    Neon     │          │
│  │  Heritage   │  │   Arcade    │          │
│  │ [✓ Default] │  │             │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ [Preview]   │  │ [Preview]   │          │
│  │   Sunset    │  │   Royal     │          │
│  │    Fire     │  │    Gold     │          │
│  │             │  │             │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ [Preview]   │  │ [Preview]   │          │
│  │   Ocean     │  │  Festival   │          │
│  │   Breeze    │  │   Drums     │          │
│  │             │  │             │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  [Sample Cards: 6♥ K♥ A♥ shown in theme]   │
│                                             │
│           ┌────────────────────┐            │
│           │   CONFIRM          │            │
│           └────────────────────┘            │
│                                             │
└─────────────────────────────────────────────┘
```

**Theme Previews:**
- **Table Themes**: Small animated preview of table surface
- **Card Themes**: Preview shows 3 sample cards (6, King, Ace of Hearts)
- Click to select
- Selected theme highlighted with checkmark
- Hover for larger preview
- Independent selection (mix any card theme with any table theme)
- Both choices saved to player profile
- Client-side only (doesn't affect other players' views)

---

## 5. Technical Specifications

### 5.1 Technology Stack

#### Frontend Framework
- **React 18.3+** with TypeScript 5.x
- **Vite 5.x** for fast development and optimized builds
- **Phaser 3.80+** for game rendering and animations

#### State Management
- **Zustand 4.x** for global state management (lightweight, React-friendly)
- Phaser's built-in Scene state for game-specific state

#### Real-time Communication (Frontend)
- **Socket.io Client 4.x** for WebSocket connections
- Connects to Go backend WebSocket server
- Handles multiplayer sync, room management, and events

#### UI & Styling
- **Tailwind CSS 3.x** for UI components and layouts
- **Framer Motion 11.x** for UI transitions and menu animations
- Phaser handles in-game visual effects

#### Build & Deployment (Frontend)
- **Vite** for bundling
- **Vercel** or **Netlify** for web hosting (CDN, auto-deployment)
- **Capacitor 6.x** for future iOS/Android builds

#### Development Tools
- **ESLint** + **Prettier** for code quality
- **Vitest** for unit testing
- **Playwright** for e2e testing
- **Storybook** (optional) for UI component development

---

#### Backend Stack (Go)

**Note**: Backend will be in the `/backend` directory of this monorepo.

**Core Framework**
- **Go 1.21+**
- **Gorilla WebSocket** or **nhooyr.io/websocket** for WebSocket server
- **Gin** or **Chi** for HTTP REST API endpoints (authentication, matchmaking)

**Game State Management**
- **In-memory game state** with mutex locks for concurrency
- **Redis** (optional) for distributed game state if scaling to multiple servers

**Database**
- **PostgreSQL** for persistent data:
  - Player accounts
  - Game history
  - Stats and leaderboards

**Authentication**
- **JWT tokens** for session management
- **bcrypt** for password hashing

**Message Format**
- **JSON** for WebSocket messages (easy to debug)
- Can upgrade to **Protocol Buffers** for performance if needed

**Deployment**
- **Docker** for containerization
- **Railway** / **Render** / **AWS ECS** for hosting
- **Nginx** for reverse proxy (SSL termination)

---

### 5.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (sparui)                      │
│                 React + TypeScript + Phaser              │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React Application Layer               │  │
│  │  - Routing (React Router)                         │  │
│  │  - UI Components (Menu, Lobby, Settings)          │  │
│  │  - State Management (Zustand)                     │  │
│  └────────────────┬──────────────────────────────────┘  │
│                   │                                      │
│  ┌────────────────▼──────────────────────────────────┐  │
│  │           Phaser Game Engine Layer                │  │
│  │  - Game Scenes (Menu, Game, Victory)              │  │
│  │  - Game Objects (Cards, Players, Effects)         │  │
│  │  - Animation System (Particles, Tweens)           │  │
│  │  - Asset Management (Preload, Cache)              │  │
│  └────────────────┬──────────────────────────────────┘  │
│                   │                                      │
│  ┌────────────────▼──────────────────────────────────┐  │
│  │      WebSocket Client (Socket.io Client)          │  │
│  │  - Connects to Go backend WebSocket server        │  │
│  │  - Event handlers (game state sync)               │  │
│  │  - Room operations                                │  │
│  └────────────────┬──────────────────────────────────┘  │
└────────────────────┼──────────────────────────────────┘
                     │
                     │ WebSocket (wss://)
                     │ JSON messages
                     │
┌────────────────────▼──────────────────────────────────┐
│              BACKEND (Go Server)                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │         WebSocket Hub (Go)                      │  │
│  │  - Gorilla WebSocket / nhooyr.io/websocket     │  │
│  │  - Connection pool management                   │  │
│  │  - Message routing                              │  │
│  └────────────┬────────────────────────────────────┘  │
│               │                                        │
│  ┌────────────▼────────────────────────────────────┐  │
│  │         Game Engine (Go)                        │  │
│  │  - Game state authority                         │  │
│  │  - Rule validation                              │  │
│  │  - Card deck management                         │  │
│  │  - Timer management                             │  │
│  │  - Scoring logic                                │  │
│  └────────────┬────────────────────────────────────┘  │
│               │                                        │
│  ┌────────────▼────────────────────────────────────┐  │
│  │         Room Manager (Go)                       │  │
│  │  - Lobby management                             │  │
│  │  - Matchmaking queue                            │  │
│  │  - Player connections                           │  │
│  └────────────┬────────────────────────────────────┘  │
│               │                                        │
│  ┌────────────▼────────────────────────────────────┐  │
│  │         HTTP API (Gin/Chi)                      │  │
│  │  - /auth/login                                  │  │
│  │  - /auth/register                               │  │
│  │  - /stats/:playerId                             │  │
│  │  - /leaderboard                                 │  │
│  └────────────┬────────────────────────────────────┘  │
│               │                                        │
│  ┌────────────▼────────────────────────────────────┐  │
│  │         Database Layer (PostgreSQL)             │  │
│  │  - sqlx or gorm for ORM                         │  │
│  │  - Player accounts                              │  │
│  │  - Game history                                 │  │
│  │  - Statistics                                   │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

### 5.3 Frontend Project Structure (sparui)

```
sparui/
├── public/
│   ├── assets/
│   │   ├── cards/           # Card images (generated with AI)
│   │   │   ├── hearts/
│   │   │   ├── clubs/
│   │   │   ├── diamonds/
│   │   │   └── spades/
│   │   ├── effects/         # Particle textures (fire, ice, explosions)
│   │   ├── surfaces/        # Table background images
│   │   ├── avatars/         # Player avatars (AI-generated)
│   │   └── sounds/          # Audio files
│   │       ├── music/
│   │       ├── sfx/
│   │       └── announcer/
│   └── index.html
│
├── src/
│   ├── main.tsx            # React app entry point
│   ├── App.tsx             # Root component with routing
│   │
│   ├── components/         # React UI components
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Timer.tsx
│   │   ├── lobby/
│   │   │   ├── LobbyScreen.tsx
│   │   │   ├── PlayerSlot.tsx
│   │   │   └── GameSettings.tsx
│   │   ├── menu/
│   │   │   ├── MainMenu.tsx
│   │   │   ├── ProfileCard.tsx
│   │   │   └── StatsWidget.tsx
│   │   └── game/
│   │       ├── GameContainer.tsx    # Phaser canvas wrapper
│   │       ├── GameOverlay.tsx      # HUD overlay (score, timer)
│   │       ├── ChatPanel.tsx
│   │       └── FlagChallengeModal.tsx
│   │
│   ├── game/               # Phaser game code
│   │   ├── config.ts       # Phaser game configuration
│   │   ├── PhaserGame.ts   # Main game instance
│   │   │
│   │   ├── scenes/         # Game scenes
│   │   │   ├── BootScene.ts         # Asset loading
│   │   │   ├── MenuScene.ts         # In-game menu
│   │   │   ├── GameScene.ts         # Main gameplay
│   │   │   ├── VictoryScene.ts      # Win screen
│   │   │   └── TransitionScene.ts   # Between-game transitions
│   │   │
│   │   ├── entities/       # Game objects
│   │   │   ├── Card.ts              # Card sprite + logic
│   │   │   ├── CardDeck.ts          # Deck management
│   │   │   ├── Player.ts            # Player representation
│   │   │   ├── TableSurface.ts      # Table background
│   │   │   └── DryCardSlot.ts       # Dry card display
│   │   │
│   │   ├── effects/        # Visual effects
│   │   │   ├── FireEffect.ts        # Fire particles
│   │   │   ├── FreezeEffect.ts      # Ice particles
│   │   │   ├── ExplosionEffect.ts   # Win explosions
│   │   │   ├── ScreenShake.ts       # Camera shake
│   │   │   └── Toasty.ts            # Easter egg pop-ups
│   │   │
│   │   ├── animations/     # Animation definitions
│   │   │   ├── cardAnimations.ts
│   │   │   ├── effectAnimations.ts
│   │   │   └── uiAnimations.ts
│   │   │
│   │   └── utils/
│   │       ├── CardUtils.ts         # Card logic helpers
│   │       ├── SoundManager.ts      # Audio control
│   │       └── ThemeManager.ts      # Surface theme switching
│   │
│   ├── multiplayer/        # WebSocket client (Socket.io)
│   │   ├── SocketClient.ts          # Socket.io wrapper
│   │   ├── events.ts                # Event type definitions
│   │   ├── handlers/
│   │   │   ├── gameHandlers.ts      # Game state events
│   │   │   ├── lobbyHandlers.ts     # Lobby events
│   │   │   └── playerHandlers.ts    # Player events
│   │   └── types.ts                 # WebSocket message types
│   │
│   ├── store/              # State management (Zustand)
│   │   ├── gameStore.ts             # Game state
│   │   ├── playerStore.ts           # Player data
│   │   ├── lobbyStore.ts            # Lobby state
│   │   └── uiStore.ts               # UI state (modals, etc.)
│   │
│   ├── types/              # TypeScript types
│   │   ├── game.ts                  # Game-related types
│   │   ├── player.ts
│   │   ├── card.ts
│   │   └── socket.ts
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useSocket.ts             # WebSocket hook
│   │   ├── useGameTimer.ts          # Timer logic
│   │   ├── useKeyboard.ts           # Keyboard shortcuts
│   │   └── useSoundEffects.ts       # Audio playback
│   │
│   ├── utils/              # Utility functions
│   │   ├── constants.ts             # Game constants
│   │   ├── cardHelpers.ts
│   │   └── formatters.ts
│   │
│   └── styles/             # Global styles
│       ├── globals.css
│       └── tailwind.css
│
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
│
├── .env.example            # Environment variables template
├── .env.local              # Local env (not committed)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

### 5.4 Monorepo Structure

**Note**: This project uses a monorepo structure with frontend and backend in the same repository.

```
sparui/ (Monorepo Root)
│
├── frontend/                    # React + Phaser frontend (current files)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── game/
│   │   ├── store/
│   │   ├── services/
│   │   └── hooks/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                     # Go backend (to be created)
│   ├── cmd/
│   │   └── server/
│   │       └── main.go          # Entry point
│   │
│   ├── internal/
│   │   ├── api/                 # HTTP REST handlers
│   │   │   ├── auth.go          # Login, register
│   │   │   ├── stats.go         # Player stats
│   │   │   └── leaderboard.go   # Leaderboards
│   │   │
│   │   ├── websocket/           # WebSocket server
│   │   │   ├── hub.go           # Connection hub
│   │   │   ├── client.go        # Client connection wrapper
│   │   │   ├── handler.go       # Message routing
│   │   │   └── events.go        # Event definitions
│   │   │
│   │   ├── game/                # Game engine
│   │   │   ├── engine.go        # Core game logic
│   │   │   ├── room.go          # Game room management
│   │   │   ├── player.go        # Player state
│   │   │   ├── deck.go          # Card deck
│   │   │   ├── rules.go         # Validation logic
│   │   │   └── timer.go         # Timer management
│   │   │
│   │   ├── matchmaking/         # Matchmaking system
│   │   │   ├── queue.go         # Player queue
│   │   │   └── matcher.go       # Match players
│   │   │
│   │   ├── models/              # Data models
│   │   │   ├── user.go
│   │   │   ├── game.go
│   │   │   └── stats.go
│   │   │
│   │   ├── db/                  # Database layer
│   │   │   ├── postgres.go      # PostgreSQL connection
│   │   │   ├── queries.go       # SQL queries
│   │   │   └── migrations/      # DB migrations
│   │   │
│   │   └── auth/                # Authentication
│   │       ├── jwt.go           # JWT token handling
│   │       └── middleware.go    # Auth middleware
│   │
│   ├── pkg/                     # Shared packages
│   │   └── utils/
│   │       └── random.go        # Random helpers
│   │
│   ├── configs/
│   │   └── config.yaml          # Configuration
│   │
│   ├── go.mod
│   ├── go.sum
│   └── README.md
│
├── docker-compose.yml           # Development environment
├── .gitignore
├── PRD.md
├── TASK_BREAKDOWN.md
├── PROJECT_STATE.md
└── README.md                    # Main project README
```

**Key Go Libraries**:
- `gorilla/websocket` or `nhooyr.io/websocket` - WebSocket server
- `gin-gonic/gin` or `go-chi/chi` - HTTP router
- `golang-jwt/jwt` - JWT authentication
- `jmoiron/sqlx` or `gorm.io/gorm` - Database ORM
- `lib/pq` - PostgreSQL driver
- `go-redis/redis` (optional) - Redis client for distributed state

---

### 5.5 State Management Strategy

#### Frontend State (Zustand)

**Game Store** (`gameStore.ts`)
```typescript
interface GameState {
  // Game session
  gameId: string | null;
  roomCode: string | null;
  gamePhase: 'lobby' | 'declaring' | 'playing' | 'game_over';

  // Players
  players: Player[];
  currentPlayerId: string;
  leaderId: string;

  // Round state
  currentRound: number;
  totalRounds: 5;
  playedCards: PlayedCard[];

  // Timers
  currentPlayerTimer: number;
  timerStarted: boolean;

  // Win streaks
  streaks: Record<string, number>;

  // Scoring
  scores: Record<string, number>;

  // Dry declarations
  dryCards: Record<string, DryCard | null>;

  // Actions
  setGamePhase: (phase) => void;
  playCard: (playerId, card) => void;
  nextRound: () => void;
  updateTimer: (time) => void;
  // ... more actions
}
```

**Player Store** (`playerStore.ts`)
```typescript
interface PlayerState {
  // Current player
  playerId: string;
  username: string;
  avatar: string;

  // Hand
  hand: Card[];

  // Stats
  totalWins: number;
  headToHeadWins: Record<string, number>;

  // Actions
  setHand: (cards) => void;
  removeCardFromHand: (card) => void;
  // ... more actions
}
```

---

### 5.6 WebSocket Protocol (Frontend ↔ Go Backend)

#### Connection Flow
```
Frontend (Socket.io)           Go Backend (Gorilla WebSocket)
  │                                  │
  │──── Connect (ws://server) ──────>│
  │                                  │
  │<──── Connection Established ─────│
  │                                  │
  │──── AUTH: {token, username} ────>│
  │                                  │ [Validate JWT token]
  │<──── AUTH_SUCCESS ───────────────│
  │                                  │
```

#### Message Format (JSON)

**Client → Server Events**
```json
// Play card example
{
  "event": "game:play_card",
  "data": {
    "playerId": "uuid-123",
    "card": {
      "suit": "hearts",
      "value": 10
    },
    "timestamp": 1234567890
  }
}

// Challenge player example
{
  "event": "game:flag_player",
  "data": {
    "challengerId": "uuid-123",
    "targetId": "uuid-456",
    "requiredSuit": "hearts"
  }
}
```

**Server → Client Events**
```json
// Game state update
{
  "event": "game:state_update",
  "data": {
    "currentRound": 3,
    "leaderId": "uuid-456",
    "playedCards": [
      {"playerId": "uuid-123", "card": {"suit": "hearts", "value": 10}}
    ],
    "scores": {
      "uuid-123": 2,
      "uuid-456": 5
    },
    "currentTimer": {
      "playerId": "uuid-789",
      "timeLeft": 8
    }
  }
}

// Card played event
{
  "event": "game:card_played",
  "data": {
    "playerId": "uuid-123",
    "card": {"suit": "hearts", "value": 10},
    "isFireStreak": false,
    "position": {"x": 400, "y": 300}
  }
}
```

#### Go Backend WebSocket Handler (Pseudocode)

```go
// internal/websocket/handler.go
type Message struct {
    Event string          `json:"event"`
    Data  json.RawMessage `json:"data"`
}

func (h *Hub) HandleMessage(client *Client, msg Message) {
    switch msg.Event {
    case "game:play_card":
        var data PlayCardData
        json.Unmarshal(msg.Data, &data)
        h.gameEngine.PlayCard(client.PlayerID, data.Card)

    case "game:flag_player":
        var data FlagData
        json.Unmarshal(msg.Data, &data)
        h.gameEngine.ChallengePlayer(data.ChallengerID, data.TargetID)

    case "lobby:create":
        room := h.roomManager.CreateRoom(client)
        client.Send("lobby:created", room)
    }
}
```

---

### 5.7 Game State Synchronization

#### Authority Model
- **Go backend is authoritative** for all game logic
- Frontend sends player actions, Go validates and broadcasts results
- Frontend displays optimistic updates, rolls back if Go rejects

#### Sync Strategy

**Optimistic Updates** (Fast feedback)
```
1. Frontend: Player clicks card → Show animation immediately
2. Frontend: Send 'game:play_card' to Go backend
3. Go: Validate (check timer, card ownership, suit rules)
4. Go: Broadcast 'game:card_played' to all clients
5. Frontend: Confirm or rollback based on Go response
```

**State Reconciliation** (Prevent desyncs)
```
// Every 2 seconds
Go Backend → All Clients: 'game:state_update' with full state

// Frontend compares:
- If local state matches: Continue
- If mismatch: Replace local state with server state
```

**Timer Synchronization**
```
// Go backend calculates timers, broadcasts countdown
Go: 'game:timer_update' { playerId, timeLeft: 15 }

// Frontend displays countdown locally
// Frontend warns when < 5 seconds (yellow → red)
```

---

### 5.8 Performance & Optimization

#### Network Optimization
- **Binary protocol** (optional): Can upgrade from JSON to MessagePack/Protobuf
- **Message throttling**: Batch updates every 50ms in Go
- **WebSocket compression**: Enable per-message deflate
- **Heartbeat**: 30-second ping/pong from Go server

#### Frontend Bundle Size
- **Code splitting**: Lazy load game scenes
- **Tree shaking**: Remove unused dependencies
- **Asset compression**: WebP for images
- **Audio compression**: MP3 for sounds

**Target Metrics:**
- Initial bundle: < 500KB (gzipped)
- Full app with assets: < 10MB
- Time to Interactive: < 3 seconds
- 60 FPS gameplay on mid-range devices

---

### 5.9 Deployment Strategy

#### Frontend Deployment (sparui)
- **Hosting**: Vercel or Netlify
- **CDN**: Auto-configured by platform
- **CI/CD**: GitHub Actions → Auto-deploy on push to `main`

#### Backend Deployment (Go)
- **Containerization**: Docker
- **Hosting**: Railway / Render / AWS ECS / DigitalOcean
- **Database**: Managed PostgreSQL (Supabase / Railway / AWS RDS)
- **SSL**: Let's Encrypt via Nginx reverse proxy

#### Environment Variables

**Frontend (.env)**
```bash
VITE_API_URL=https://api.spargame.com
VITE_WS_URL=wss://api.spargame.com
```

**Backend (Go)**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/spar
JWT_SECRET=your-secret-key
PORT=8080
REDIS_URL=redis://localhost:6379 (optional)
```

---

## 6. Implementation Roadmap

### Phase 1: MVP - Core Gameplay (Weeks 1-6)

#### Week 1: Project Setup & Infrastructure
**Frontend**
- Initialize Vite + React + TypeScript project
- Set up Tailwind CSS and ESLint/Prettier
- Configure Phaser 3 integration
- Set up Zustand stores (basic structure)
- Create basic routing (Main Menu, Lobby, Game)
- Set up environment variables

**Backend (Parallel - Go)**
- Initialize Go project with modules
- Set up Gin/Chi HTTP server
- Configure PostgreSQL connection
- Implement WebSocket hub (Gorilla WebSocket)
- Create basic message routing
- Set up JWT authentication

**Deliverables:**
- ✅ Project runs locally
- ✅ WebSocket connection established
- ✅ Basic authentication working

---

#### Week 2: Asset Creation & UI Foundation
**Assets**
- Generate 35 card images with AI (Midjourney/DALL-E)
  - 9 cards × 3 suits + 8 spades = 35 cards
- Create particle textures (fire, ice, explosion)
- Generate 5 player avatars
- Find/create poker table surface image
- Source placeholder sound effects

**UI Components**
- Build reusable UI components (Button, Modal, Input, Timer)
- Create Main Menu screen
- Create Lobby screen with player slots
- Style with Tailwind CSS
- Add Framer Motion transitions

**Deliverables:**
- ✅ All card assets ready
- ✅ Main menu and lobby functional

---

#### Week 3: Phaser Game Scene Foundation
**Game Scene Setup**
- Create BootScene (asset preloading)
- Create GameScene (main gameplay)
- Implement Card entity class
- Implement Player positioning (2-4 player layouts)
- Create TableSurface with poker theme
- Add basic card deal animation

**Backend**
- Implement Room Manager (create, join, leave)
- Create game state data structures
- Implement card deck shuffling and dealing
- Add player connection management

**Deliverables:**
- ✅ Cards render on screen
- ✅ Players can join rooms
- ✅ Cards are dealt to players

---

#### Week 4: Core Game Logic
**Frontend**
- Implement card click handlers
- Add card play animations (fly to center)
- Display played cards in table center
- Show player hands
- Implement round winner determination (client-side validation)
- Add basic timer UI

**Backend (Go)**
- Implement core game rules validation
- Suit following logic
- Round winner calculation
- Scoring system (basic + dry mechanics)
- Timer management (15s, 8s, 5s)
- Broadcast game state updates

**Deliverables:**
- ✅ Players can play cards
- ✅ Game validates moves
- ✅ Rounds complete correctly

---

#### Week 5: Advanced Mechanics
**Frontend**
- Implement Dry/Show Dry declaration modal
- Add flagging/challenge system UI
- Implement win streak tracking
- Add fire effect particles (Phaser emitters)
- Add freeze effect particles
- Implement screen shake on special effects
- Add victory screen

**Backend (Go)**
- Implement dry card declaration logic
- Add challenge validation
- Win streak tracking
- Fire/freeze triggers
- Game over and scoring

**Deliverables:**
- ✅ Dry mechanics work
- ✅ Challenges work correctly
- ✅ Fire/freeze effects trigger

---

#### Week 6: Polish & Matchmaking
**Frontend**
- Add sound effects (card deal, play, fire, freeze)
- Implement background music
- Add chat functionality (basic)
- Optimize animations (60 FPS)
- Add loading states and error handling
- Implement reconnection logic

**Backend (Go)**
- Implement matchmaking queue
- Add quick match functionality
- Implement player stats tracking
- Add leaderboard queries
- Performance optimization
- Error handling and validation

**Testing**
- Unit tests for game logic
- Integration tests for WebSocket
- Manual end-to-end testing
- Fix critical bugs

**Deliverables:**
- ✅ MVP is fully playable
- ✅ Matchmaking works
- ✅ Ready for beta testing

---

### Phase 2: Enhanced Features (Weeks 7-10)

#### Week 7: AI Opponent
- Implement AI decision-making algorithm
  - Card selection logic (follow suit, play high/low)
  - Dry card strategy
  - Challenge probability
- Add difficulty levels (Easy, Medium, Hard)
- Test AI gameplay balance

#### Week 8: Visual Themes & Customization
- Add 4 additional surface themes:
  - Street Court (concrete)
  - Wooden Floor (gym)
  - Neon Cyberpunk
  - Beach Sand
- Implement theme selector
- Add custom card back designs (AI-generated)
- Add more avatar options

#### Week 9: Advanced Animations
- Implement "Toasty" easter egg moments
- Add combo text animations
- Improve particle effects (more realistic fire/ice)
- Add screen effects (blur, vignette during special moments)
- Implement card flip animations (3D)

#### Week 10: Player Profiles
- Create player profile screen
- Add detailed stats (win rate, favorite cards, etc.)
- Implement avatar customization
- Add profile badges/achievements
- Friend request system (basic)

---

### Phase 3: Social & Mobile (Weeks 11-14)

#### Week 11: Social Features
- Implement friends list
- Add friend invites to private games
- Create global leaderboard UI
- Add head-to-head stats
- Implement in-game emotes/reactions

#### Week 12: Tournament System
- Design tournament bracket UI
- Implement tournament matchmaking
- Add prize/reward system (points-based)
- Create tournament history

#### Week 13: Mobile Preparation
- Set up Capacitor for iOS/Android
- Optimize UI for mobile screens
- Add touch-friendly controls
- Test on physical devices
- Implement push notifications

#### Week 14: Mobile Launch
- Build iOS app
- Build Android app
- Submit to App Store
- Submit to Play Store
- Create app store assets (screenshots, descriptions)

---

### Phase 4: Monetization & Growth (Weeks 15+)

#### Monetization Features
- Premium themes ($1.99 each)
- Premium card backs ($0.99 each)
- Season pass ($4.99/month)
  - Exclusive themes
  - Bonus XP
  - Special avatars
- Remove ads option ($2.99 one-time)

#### Community Features
- Spectator mode (watch live games)
- Twitch integration (stream with overlay)
- Replays and highlights
- Clans/Teams

#### Performance & Scale
- Implement Redis for distributed state
- Add horizontal scaling for game servers
- Optimize database queries
- Add CDN for assets

---

## 7. Asset Creation Pipeline

### Card Design Process
1. **Concept**: Define visual style (African-inspired, vibrant, modern)
2. **AI Generation**: Use Midjourney/DALL-E with prompts:
   - "African-inspired playing card, [suit] [value], vibrant colors, high contrast, game art, digital illustration"
3. **Editing**: Touch up in Photoshop/Figma
4. **Export**: 512x768px PNG with transparency
5. **Optimization**: Compress with TinyPNG

### Avatar Creation
1. **Concept**: Diverse, friendly, cartoon-style characters
2. **AI Generation**: Midjourney/DALL-E
3. **Consistency**: Use same style prompt for all avatars
4. **Export**: 256x256px PNG

### Sound Effects
- **Sources**: Freesound.org, Zapsplat, Uppbeat
- **Custom**: Generate with AI (ElevenLabs for voice, Suno for music)
- **Format**: MP3 for web, M4A for mobile

---

## 8. Testing Strategy

### Unit Testing (Vitest)
**Coverage Goals:** 80%+
- Card logic (comparison, suit matching)
- Game rules validation
- Scoring calculations
- Timer logic

### Integration Testing
- WebSocket connection and message handling
- Game state synchronization
- Authentication flow
- Database operations (Go backend)

### E2E Testing (Playwright)
**Test Scenarios:**
- Complete 2-player game
- Complete 4-player game
- Dry card declaration and win
- Challenge system (correct and incorrect)
- Matchmaking flow
- Reconnection after disconnect

### Manual Testing
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device testing (iOS, Android)
- Network condition testing (slow 3G)
- Load testing (50+ concurrent games)

---

## 9. Success Metrics

### Launch Goals (First 3 Months)
- **Users**: 1,000 registered players
- **Engagement**: 20% DAU/MAU ratio
- **Retention**: 30% D7 retention
- **Games Played**: 10,000+ total games
- **Performance**: <3s load time, 60 FPS gameplay

### Growth Targets (6 Months)
- **Users**: 10,000 registered players
- **Revenue**: $1,000/month (premium features)
- **Social**: 500 concurrent players during peak
- **Rating**: 4.5+ stars on app stores

---

## Summary

This PRD now includes:
✅ **Complete game rules** with all mechanics (dry, streaks, timing, challenges)
✅ **Visual design system** with color palettes and 5 surface themes
✅ **Detailed UI mockups** for all major screens
✅ **Animation specifications** (fire, freeze, explosions, Toasty)
✅ **Technical architecture** clearly separating React/Phaser frontend and Go backend
✅ **Monorepo structure** with frontend/ and backend/ directories
✅ **WebSocket protocol** with JSON message formats
✅ **Week-by-week implementation plan** (14+ weeks to full launch)
✅ **Asset creation pipeline**
✅ **Testing strategy**
✅ **Success metrics**

**Ready to Start Building!** 🚀

The next step is to initialize the project and start Week 1 implementation.
