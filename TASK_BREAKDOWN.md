# Spar Game - Complete Task Breakdown

**Last Updated:** December 17, 2025
**Total Tasks:** 67 tasks across 6 weeks

---

## Task Format Legend

**Priority Levels:**
- **P0:** Critical - Blocks MVP, must resolve immediately
- **P1:** High - Required for MVP, complete this sprint/week
- **P2:** Medium - Important but not MVP-blocking
- **P3:** Low - Nice-to-have, defer if needed

**Size Estimates:**
- **S:** Small (< 2 hours)
- **M:** Medium (2-4 hours)
- **L:** Large (4-8 hours)
- **XL:** Extra Large (> 8 hours, should be broken down)

**Status:**
- ⬜ TODO
- 🔄 IN_PROGRESS
- 🔍 IN_REVIEW
- ✅ DONE
- 🚫 BLOCKED
- ⏸️ DEFERRED

---

# WEEK 1: PROJECT SETUP & INFRASTRUCTURE

## Frontend Tasks (sparui repository)

### [TASK-001] Initialize Vite + React + TypeScript Project
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ✅ DONE
**Dependencies:** None
**Blocked By:** None

**Description:**
Create the base React application using Vite as the build tool with TypeScript configuration.

**Acceptance Criteria:**
- [x] Project created with `npm create vite@latest` using React + TypeScript template
- [x] Project runs with `npm run dev` on localhost
- [x] TypeScript compilation works without errors
- [x] Hot module replacement (HMR) works
- [x] Basic folder structure created (src/, public/)

**Notes:**
- Use latest stable versions: React 18.3+, TypeScript 5.x, Vite 5.x
- Configure tsconfig.json for strict mode
- Set up path aliases (@/ for src/)

---

### [TASK-002] Install and Configure Tailwind CSS
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** S (< 2 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-001]
**Blocked By:** None

**Description:**
Set up Tailwind CSS 3.x for styling with custom configuration for the arcade theme.

**Acceptance Criteria:**
- [x] Tailwind CSS installed via npm
- [x] tailwind.config.js configured with custom colors from PRD (Fire Red, Ice Blue, Gold, Deep Purple)
- [x] PostCSS configured
- [x] Tailwind directives added to main CSS file
- [x] Test component renders with Tailwind classes

**Notes:**
- Add custom theme colors:
  - fireRed: '#FF4500'
  - iceBlue: '#00BFFF'
  - gold: '#FFD700'
  - deepPurple: '#8B00FF'

---

### [TASK-003] Configure ESLint and Prettier
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** S (< 2 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-001]
**Blocked By:** None

**Description:**
Set up code quality tools for consistent code style and error prevention.

**Acceptance Criteria:**
- [x] ESLint configured with React and TypeScript rules
- [x] Prettier configured with consistent formatting rules
- [x] ESLint and Prettier integration working (no conflicts)
- [x] npm scripts added for linting (`npm run lint`, `npm run format`)
- [x] VS Code settings file created for auto-format on save

**Notes:**
- Use @typescript-eslint/parser
- Add recommended React hooks rules
- Configure 2-space indentation, single quotes

---

### [TASK-004] Set Up React Router
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-001]
**Blocked By:** None

**Description:**
Configure React Router for navigation between main screens (Menu, Lobby, Game).

**Acceptance Criteria:**
- [x] React Router v6 installed
- [x] Basic routes defined: /, /lobby, /game
- [x] Route components created (placeholder screens)
- [x] Navigation between routes works
- [x] 404 page configured

**Notes:**
- Use BrowserRouter
- Create Layout component for shared UI (future)
- Set up lazy loading for game route (optimization)

---

### [TASK-005] Install and Configure Phaser 3
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-001]
**Blocked By:** None

**Description:**
Integrate Phaser 3.80+ game engine into the React application.

**Acceptance Criteria:**
- [x] Phaser 3.80+ installed via npm
- [x] Phaser game config file created (src/game/config.ts)
- [x] React component wrapper for Phaser canvas created
- [x] Test scene renders in the React app
- [x] Phaser canvas responsive to window resize

**Notes:**
- Use Phaser.AUTO for renderer
- Configure game dimensions: 1920x1080 (scale to fit)
- Set transparent background to layer with React UI
- Reference PRD Section 5.3 for structure

---

### [TASK-006] Set Up Zustand State Management
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-001]
**Blocked By:** None

**Description:**
Configure Zustand for global state management with initial store structure.

**Acceptance Criteria:**
- [x] Zustand 4.x installed
- [x] Store files created: gameStore.ts, playerStore.ts, uiStore.ts (lobbyStore merged into gameStore)
- [x] Basic state interfaces defined (TypeScript)
- [x] Example actions and selectors work
- [x] Persist middleware configured for playerStore

**Notes:**
- Reference PRD Section 5.5 for store structure
- Use immer middleware for immutable updates
- Keep stores focused and modular

---

### [TASK-007] Install Socket.io Client
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** S (< 2 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-001]
**Blocked By:** None

**Description:**
Install Socket.io client library for WebSocket communication with Go backend.

**Acceptance Criteria:**
- [x] Socket.io-client 4.x installed
- [x] SocketClient wrapper class created (src/services/socketService.ts)
- [x] Basic connection/disconnection methods implemented
- [x] TypeScript types defined for socket events
- [x] Environment variable for WebSocket URL configured

**Notes:**
- Add VITE_WS_URL to .env.example
- Handle connection errors gracefully
- Add reconnection logic with exponential backoff

---

### [TASK-008] Set Up Environment Variables
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** S (< 2 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-001]
**Blocked By:** None

**Description:**
Configure environment variables for API and WebSocket URLs.

**Acceptance Criteria:**
- [x] .env.example file created with template variables
- [x] .env.local file created (gitignored)
- [x] Variables defined: VITE_BACKEND_URL and additional game config vars
- [x] Variables accessible in code via import.meta.env
- [x] TypeScript definitions created (vite-env.d.ts)

**Notes:**
- Default local values:
  - VITE_API_URL=http://localhost:8080
  - VITE_WS_URL=ws://localhost:8080

---

### [TASK-009] Create Basic UI Component Library
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** L (4-8 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-002]
**Blocked By:** None

**Description:**
Build reusable UI components (Button, Modal, Input, Timer) with Tailwind styling.

**Acceptance Criteria:**
- [x] Button component with variants (primary, secondary, danger, success, ghost)
- [x] Modal component with backdrop and animation (including ConfirmModal)
- [x] Card component with Header/Title/Content/Footer
- [x] Timer component with countdown display and progress ring
- [x] All components use TypeScript with proper types
- [x] Components styled with Tailwind (arcade theme)
- [x] NotificationContainer for toast notifications

**Notes:**
- Reference PRD Section 4 for UI specs
- Add hover/active states with arcade flair
- Use Framer Motion for animations (optional for Week 1)

---

### [TASK-010] Create Main Menu Screen (Placeholder)
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-004], [TASK-009]
**Blocked By:** None

**Description:**
Build basic Main Menu screen with navigation buttons (no final styling yet).

**Acceptance Criteria:**
- [x] Main Menu component created (HomePage)
- [x] Navigation buttons: Quick Match, Private Game, Play vs AI, Settings
- [x] Buttons route to correct pages and integrate with state
- [x] Basic layout matches PRD Section 4.1 structure
- [x] Responsive design (mobile + desktop)
- [x] Player stats display (name, wins, games)

**Notes:**
- Focus on functionality over visuals in Week 1
- Final visual polish in Week 2 with assets
- Use Button component from TASK-009

---

### [TASK-011] Test WebSocket Connection to Backend
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** 🚫 BLOCKED
**Dependencies:** [TASK-007], Backend TASK-017
**Blocked By:** Backend WebSocket server must be running (backend repository not started yet)

**Description:**
Verify Socket.io client can connect to Go backend WebSocket server.

**Acceptance Criteria:**
- [ ] Connection established when backend is running
- [ ] Connection events logged (connect, disconnect, error)
- [ ] Test message sent from client to server
- [ ] Test message received from server to client
- [ ] Reconnection works after disconnect

**Notes:**
- This is an integration test between frontend and backend
- Coordinate with backend engineer on server readiness
- Log all events for debugging

---

---

## Backend Tasks (backend/ directory in monorepo)

### [TASK-012] Initialize Go Project with Modules
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ✅ DONE
**Dependencies:** None
**Blocked By:** None

**Description:**
Create Go project structure with module initialization and basic folder setup.

**Acceptance Criteria:**
- [x] Go module initialized with `go mod init`
- [x] Folder structure created: service/game-server/ with cmd/, controller/, entity/, repository/, gateway/, mapper/, config/, docker/
- [x] server.go file created with Chi HTTP server
- [x] Server runs on port 8080
- [x] README.md created with setup instructions
- [x] Makefile created with build/run commands

**Notes:**
- Use Go 1.21+
- Reference PRD Section 5.4 for structure
- Set module name: github.com/npeprah/sparui/backend
- Create backend/ directory at root level

---

### [TASK-013] Set Up HTTP Server with Gin/Chi
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-012]
**Blocked By:** None

**Description:**
Configure HTTP server using Gin or Chi framework with basic health check endpoint.

**Acceptance Criteria:**
- [x] Chi installed and configured with v5
- [x] HTTP server starts on configurable port (PORT env var or 8080 default)
- [x] GET /health endpoint returns 200 OK with JSON response
- [x] CORS middleware configured for frontend origins (localhost:5173, 5174)
- [x] Server graceful shutdown implemented with 30s timeout
- [x] Standard middleware added (RequestID, RealIP, Logger, Recoverer, Timeout)
- [x] Structured logging with slog
- [x] REST API routes configured (/api/v1/auth, /api/v1/game)
- [x] WebSocket endpoint configured (/ws)

**Notes:**
- Recommended: Chi for simplicity, Gin for features
- Add request logging middleware
- Configure CORS to allow http://localhost:5173 (Vite default)

---

### [TASK-014] Configure PostgreSQL Connection
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-012]
**Blocked By:** None

**Description:**
Set up PostgreSQL database connection with connection pooling.

**Acceptance Criteria:**
- [x] PostgreSQL driver installed (lib/pq v1.10.9)
- [x] Database connection configured via environment variables (DB_HOST, DB_PORT, DB_USER, etc.)
- [x] Connection pool established (max 20 conns, max 5 idle)
- [x] Database health check implemented (HealthCheck method with 2s timeout)
- [x] Test connection succeeds with retry logic (3 attempts)
- [x] Docker Compose configuration for local development
- [x] Common db package created for shared database functionality

**Notes:**
- Use DATABASE_URL environment variable
- Recommended: sqlx for SQL queries
- Add connection retry logic (3 attempts)
- Max pool size: 20 connections

---

### [TASK-015] Create Basic Database Schema
**Agent:** Backend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-014]
**Blocked By:** None

**Description:**
Design and implement initial database tables for users and basic game data.

**Acceptance Criteria:**
- [x] Migration file created (docker/init.sql - runs automatically via Docker)
- [x] Users table created (id UUID, username, email, password_hash, avatar, timestamps)
- [x] User stats table created (game statistics, win rates, streaks, etc.)
- [x] Game rooms table created (for multiplayer lobby management)
- [x] Game history table created (completed games, winners, duration)
- [x] Player game results table (many-to-many: games and players)
- [x] Table constraints defined (primary keys, foreign keys, unique, not null)
- [x] Indexes created for performance (email, username, room_code, etc.)
- [x] Triggers created (auto-update updated_at timestamps)
- [x] Migration runs successfully on container start
- [x] Test data seeded (4 test users)

**Notes:**
- Use golang-migrate or similar tool
- Keep schema simple for Week 1
- Game history tables can be added later

---

### [TASK-016] Implement JWT Authentication
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** L (4-8 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-013], [TASK-015]
**Blocked By:** None

**Description:**
Create authentication system with JWT token generation and validation.

**Acceptance Criteria:**
- [x] JWT library installed (golang-jwt/jwt/v5 v5.3.0)
- [x] POST /api/v1/auth/register endpoint (create user with validation)
- [x] POST /api/v1/auth/login endpoint (return JWT token)
- [x] Password hashing with bcrypt
- [x] JWT middleware for protected routes
- [x] Token expiration configured (24 hours)
- [x] Input validation (username 3-50 chars, email regex, password 8-100 chars)
- [x] Email and username uniqueness checks
- [x] Protected GET /api/v1/auth/me endpoint
- [x] Database integration with user repository
- [x] All endpoints tested successfully

**Notes:**
- JWT secret loaded from JWT_SECRET environment variable
- Returns user profile with token on register/login
- Proper error handling with no information leakage
- Auth service initialized on server startup

---

### [TASK-017] Implement WebSocket Hub
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** L (4-8 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-013]
**Blocked By:** None

**Description:**
Create WebSocket server using Gorilla WebSocket with connection management hub.

**Acceptance Criteria:**
- [x] Gorilla WebSocket library installed (v1.5.3)
- [x] WebSocket endpoint created (GET /ws)
- [x] Hub manages active connections (register/unregister channels)
- [x] Broadcast message to all clients works
- [x] Send message to specific client works (via client.Send channel)
- [x] Connection cleanup on disconnect
- [x] CORS origin checking for WebSocket upgrades
- [x] Ping/pong heartbeat implemented (30 second ticker)
- [x] Concurrent read/write pumps with goroutines

**Notes:**
- Reference PRD Section 5.6 for protocol
- Use goroutines for concurrent handling
- Add ping/pong heartbeat (30 seconds)

---

### [TASK-018] Create WebSocket Message Router
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-017]
**Blocked By:** None

**Description:**
Implement message routing system to handle different event types from clients.

**Acceptance Criteria:**
- [x] Message type definitions created (Message struct with event + data)
- [x] Router handles JSON message parsing (json.Unmarshal)
- [x] Event handlers registered for game events (auth, play_card, declare_dry, flag_player, lobby actions)
- [x] Unknown events handled gracefully (logged with slog.Warn)
- [x] Switch statement routing in handleMessage method
- [x] Structured logging for all message events

**Notes:**
- Use switch statement or map for routing
- Define message format: {"event": "...", "data": {...}}
- Add comprehensive logging

---

### [TASK-019] Test Backend Server Locally
**Agent:** Backend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ✅ DONE
**Dependencies:** [TASK-013], [TASK-016], [TASK-017]
**Blocked By:** None
**Completed:** December 17, 2025

**Description:**
Verify all backend endpoints and WebSocket connection work correctly.

**Acceptance Criteria:**
- [x] Server starts without errors
- [x] Health check returns 200
- [x] User registration works (test with curl/Postman)
- [x] User login returns JWT token
- [x] WebSocket connection established (test with wscat)
- [x] WebSocket message echo works

**Notes:**
- Document all endpoints in README
- Test error cases (invalid login, etc.)
- Verify CORS headers present

**Test Results:**
- All HTTP endpoints tested and working (health, register, login, /auth/me)
- Input validation working correctly (email format, password length, username length)
- Error handling verified (duplicate users, invalid credentials, missing auth)
- JWT authentication working (token generation, validation, protected routes)
- WebSocket connection successful with Origin header validation
- WebSocket message routing verified (auth, lobby, game events logged)
- CORS headers present and configured for localhost:5173, localhost:5174
- Database integration verified (users and user_stats tables properly populated)
- Comprehensive API documentation added to backend/README.md

---

---

## Design Tasks

### [TASK-020] Research and Plan Asset Creation Pipeline
**Agent:** Designer
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** None
**Blocked By:** None

**Description:**
Define the asset creation workflow and tooling for Week 2 card generation.

**Acceptance Criteria:**
- [ ] AI tools evaluated (Midjourney, DALL-E, Stable Diffusion)
- [ ] Card design style defined (African-inspired, vibrant, arcade)
- [ ] Sample prompt templates created for card generation
- [ ] Image editing workflow established (Figma/Photoshop)
- [ ] Export specifications documented (512x768px PNG)

**Notes:**
- Reference PRD Section 7 for pipeline details
- Test 2-3 sample cards to validate approach
- Consider batch generation for efficiency

---

### [TASK-021] Create Design System Document
**Agent:** Designer
**Priority:** P2 (medium)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** None
**Blocked By:** None

**Description:**
Document the visual design system including colors, typography, and component styles.

**Acceptance Criteria:**
- [ ] Color palette documented with hex codes (from PRD Section 3.2)
- [ ] Typography hierarchy defined (font families, sizes)
- [ ] UI component styles specified (buttons, modals, inputs)
- [ ] Animation principles documented
- [ ] Figma file created with design tokens

**Notes:**
- Reference PRD Section 3 for specifications
- Share with frontend engineer for implementation
- Keep document updated as design evolves

---

---

# WEEK 2: ASSET CREATION & UI FOUNDATION

## Design Tasks

### [TASK-022] Generate 35 Card Images with AI
**Agent:** Designer
**Priority:** P0 (critical)
**Size:** XL (full week - 40+ hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-020]
**Blocked By:** None

**Description:**
Create all 35 card images (9 Hearts, 9 Clubs, 9 Diamonds, 8 Spades) using AI generation.

**Acceptance Criteria:**
- [ ] All 35 cards generated with consistent style
- [ ] Cards exported as 512x768px PNG with transparency
- [ ] Cards organized by suit in folders
- [ ] Cards optimized with compression (< 100KB each)
- [ ] Special card states created (fire border, ice border variants)
- [ ] Delivered to frontend engineer

**Notes:**
- This is the highest priority Week 2 task - blocks game development
- Use prompt template for consistency
- Get feedback on first batch before completing all
- See PRD Section 4.4 for card design specs

---

### [TASK-023] Create Particle Effect Textures
**Agent:** Designer
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** None
**Blocked By:** None

**Description:**
Design particle textures for fire, ice, and explosion effects.

**Acceptance Criteria:**
- [ ] Fire particle texture (orange/red/yellow gradient)
- [ ] Ice particle texture (blue crystalline)
- [ ] Explosion particle texture (star/sparkle)
- [ ] Confetti textures (multiple colors)
- [ ] All textures 256x256px PNG with alpha channel
- [ ] Delivered organized in /effects folder

**Notes:**
- Keep textures simple - Phaser will composite many
- Consider performance (file size)
- Test with Phaser particle emitters

---

### [TASK-024] Generate Player Avatar Set
**Agent:** Designer
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** None
**Blocked By:** None

**Description:**
Create 5 diverse player avatars with consistent cartoon style.

**Acceptance Criteria:**
- [ ] 5 unique avatars generated with AI
- [ ] Diverse representation (gender, ethnicity)
- [ ] Consistent art style across all avatars
- [ ] 256x256px PNG with transparent background
- [ ] Optimized file sizes (< 50KB each)
- [ ] Delivered in /avatars folder

**Notes:**
- Reference PRD Section 7 for style
- Keep style friendly and approachable
- More avatars can be added in Phase 2

---

### [TASK-025] Create Poker Table Surface Background
**Agent:** Designer
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** None
**Blocked By:** None

**Description:**
Design the default poker table surface theme (green felt with wood trim).

**Acceptance Criteria:**
- [ ] Poker table surface designed (1920x1080px or larger)
- [ ] Felt green color matches PRD (#0A5F38)
- [ ] Wood trim details added
- [ ] Gold accent elements included
- [ ] Exported as optimized PNG or WebP
- [ ] Delivered in /surfaces folder

**Notes:**
- Reference PRD Section 3.2 for color specs
- Keep texture subtle to not distract from cards
- Other themes (street, wooden, neon, beach) deferred to Week 8

---

### [TASK-026] Source Placeholder Sound Effects
**Agent:** Designer
**Priority:** P2 (medium)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** None
**Blocked By:** None

**Description:**
Find and organize placeholder sound effects for game actions.

**Acceptance Criteria:**
- [ ] Card shuffle sound
- [ ] Card play sound (whoosh + thud)
- [ ] Button click sound
- [ ] Win round sound (ding)
- [ ] Fire ignition sound
- [ ] Ice freeze sound
- [ ] All sounds in MP3 format
- [ ] Organized in /sounds/sfx folder

**Notes:**
- Use free sound libraries (Freesound.org, Zapsplat)
- Placeholders for now - custom sounds in Phase 2
- Keep file sizes small (< 100KB per sound)

---

## Frontend Tasks

### [TASK-027] Build Main Menu Screen (Final Version)
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-010], [TASK-024]
**Blocked By:** None

**Description:**
Complete Main Menu screen with final styling, animations, and avatar integration.

**Acceptance Criteria:**
- [ ] Layout matches PRD Section 4.1 mockup
- [ ] Logo/title with flame animation
- [ ] Navigation buttons fully styled with hover effects
- [ ] Player profile widget (avatar + username)
- [ ] Stats widget (trophy count)
- [ ] Animated background (subtle card particles)
- [ ] Framer Motion transitions added

**Notes:**
- Use avatars from TASK-024
- Add particle background with Phaser or CSS
- Ensure mobile responsive layout

---

### [TASK-028] Build Lobby Screen
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-009], [TASK-024]
**Blocked By:** None

**Description:**
Create Game Lobby screen for multiplayer room setup.

**Acceptance Criteria:**
- [ ] Layout matches PRD Section 4.2 mockup
- [ ] Room code display with copy button
- [ ] Player slots (2-4) with ready status indicators
- [ ] Game settings panel (points to win, surface theme, AI difficulty)
- [ ] Start Game button (host only)
- [ ] Back button navigation
- [ ] Settings button opens modal

**Notes:**
- Use avatars from TASK-024
- Add real-time updates via WebSocket (placeholder for now)
- Settings functionality can be stubbed initially

---

### [TASK-029] Create Responsive Layout System
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-027], [TASK-028]
**Blocked By:** None

**Description:**
Ensure all UI screens are responsive for desktop and mobile devices.

**Acceptance Criteria:**
- [ ] Breakpoints defined (mobile, tablet, desktop)
- [ ] Main Menu responsive on all screen sizes
- [ ] Lobby screen responsive
- [ ] Touch-friendly button sizes on mobile (min 44x44px)
- [ ] Text scales appropriately
- [ ] Test on actual mobile device or emulator

**Notes:**
- Use Tailwind responsive utilities (sm:, md:, lg:)
- Consider portrait and landscape orientations
- Game scene (Week 3) will handle its own scaling

---

### [TASK-030] Integrate Card Assets into Phaser
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-005], [TASK-022]
**Blocked By:** Card assets must be delivered

**Description:**
Load and test all 35 card images in Phaser BootScene.

**Acceptance Criteria:**
- [ ] All card assets placed in public/assets/cards/ folder
- [ ] BootScene configured to preload all card images
- [ ] Cards organized by suit in code
- [ ] Test scene displays all cards in a grid
- [ ] Cards render correctly without errors
- [ ] Card texture keys defined as constants

**Notes:**
- Use Phaser's TextureAtlas for optimization (optional)
- Create helper function to get card texture key
- Reference PRD Section 5.3 for asset structure

---

### [TASK-031] Add Framer Motion Animations
**Agent:** Frontend
**Priority:** P2 (medium)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-027], [TASK-028]
**Blocked By:** None

**Description:**
Enhance UI transitions with Framer Motion animations.

**Acceptance Criteria:**
- [ ] Framer Motion installed
- [ ] Page transitions animated (fade, slide)
- [ ] Button hover animations (scale, glow)
- [ ] Modal animations (zoom in from center)
- [ ] Smooth, arcade-style feel
- [ ] Performance maintained (60 FPS)

**Notes:**
- Keep animations short (200-300ms)
- Use spring physics for natural feel
- Add subtle screen shake for button clicks

---

---

# WEEK 3: PHASER GAME SCENE FOUNDATION

## Frontend Tasks

### [TASK-032] Create BootScene for Asset Loading
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-005], [TASK-030]
**Blocked By:** None

**Description:**
Implement Phaser BootScene to preload all game assets with loading screen.

**Acceptance Criteria:**
- [ ] BootScene class created
- [ ] All card images preloaded
- [ ] Particle textures preloaded
- [ ] Table surface preloaded
- [ ] Loading progress bar displayed
- [ ] Automatically transitions to GameScene when complete

**Notes:**
- Add loading percentage text
- Handle load errors gracefully
- Cache assets for quick access

---

### [TASK-033] Create GameScene Foundation
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-032]
**Blocked By:** None

**Description:**
Build the main GameScene with camera setup and coordinate system.

**Acceptance Criteria:**
- [ ] GameScene class created extending Phaser.Scene
- [ ] Scene initialized with proper dimensions (1920x1080 base)
- [ ] Camera configured with appropriate zoom
- [ ] Coordinate system established for card positions
- [ ] Scene background color or image set
- [ ] Debug grid overlay (toggleable)

**Notes:**
- Reference PRD Section 4.3 for layout
- Use world coordinates, not screen pixels
- Set up camera bounds

---

### [TASK-034] Implement Card Entity Class
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-033]
**Blocked By:** None

**Description:**
Create Card game object class with properties and basic behaviors.

**Acceptance Criteria:**
- [ ] Card class extends Phaser.GameObjects.Sprite
- [ ] Card properties: suit, value, owner, state (in_hand, played, etc.)
- [ ] Card can flip (face up/down)
- [ ] Card has interactive hitbox
- [ ] Card has hover effect (lift up, glow)
- [ ] Card can be positioned and moved
- [ ] TypeScript interfaces for Card data

**Notes:**
- Keep Card class focused on visuals
- Separate game logic from rendering
- Add depth sorting for overlapping cards

---

### [TASK-035] Implement Player Positioning System
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-033]
**Blocked By:** None

**Description:**
Create layout system for positioning 2-4 players around the table.

**Acceptance Criteria:**
- [ ] Player positions calculated for 2, 3, and 4 player modes
- [ ] Current player always at bottom
- [ ] Other players positioned clockwise (top, left, right)
- [ ] Positions defined as world coordinates
- [ ] Player zones defined (hand area, play area)
- [ ] Layout adjusts based on player count

**Notes:**
- Reference PRD Section 4.3 for layouts
- Use percentage-based positioning for flexibility
- Add helper function: getPlayerPosition(playerIndex, totalPlayers)

---

### [TASK-036] Create TableSurface Component
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-033], [TASK-025]
**Blocked By:** None

**Description:**
Render the poker table surface background in GameScene.

**Acceptance Criteria:**
- [ ] TableSurface class created
- [ ] Poker table image loaded and displayed
- [ ] Table scales to fit camera view
- [ ] Table centered in scene
- [ ] Depth set to render behind cards
- [ ] Theme switching prepared (single theme for now)

**Notes:**
- Use tileSprite if texture needs to repeat
- Keep performance in mind (single large sprite OK)
- Prepare for theme switching in Week 8

---

### [TASK-037] Implement Card Deal Animation
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-034], [TASK-035]
**Blocked By:** None

**Description:**
Create animation for dealing cards from deck to player hands.

**Acceptance Criteria:**
- [ ] Deck position defined (center top)
- [ ] Cards animate from deck to each player
- [ ] Cards fan out in player hand
- [ ] Animation timing: 100ms per card
- [ ] Cards flip face up for current player
- [ ] Sound effect plays on deal (if available)

**Notes:**
- Use Phaser tweens for smooth animation
- Deal clockwise starting with leader
- Current player's cards should be visible, others face-down

---

### [TASK-038] Add Player Info Display
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-035], [TASK-024]
**Blocked By:** None

**Description:**
Display player avatars, usernames, and card counts around the table.

**Acceptance Criteria:**
- [ ] Player avatar displayed above each player position
- [ ] Username displayed below avatar
- [ ] Card count indicator shown (e.g., "5 cards")
- [ ] Leader indicator (star icon) when applicable
- [ ] Styling matches arcade theme
- [ ] Updates dynamically as game progresses

**Notes:**
- Use Phaser Text or DOM elements overlay
- Add pulsing border when it's player's turn
- Keep text readable with drop shadow or outline

---

## Backend Tasks

### [TASK-039] Implement Room Manager
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-018]
**Blocked By:** None

**Description:**
Create room/lobby management system for multiplayer games.

**Acceptance Criteria:**
- [ ] Room data structure defined (ID, host, players, settings)
- [ ] Create room endpoint/event handler
- [ ] Join room endpoint/event handler
- [ ] Leave room endpoint/event handler
- [ ] Room capacity validation (2-4 players)
- [ ] Room state broadcast to all players in room

**Notes:**
- Generate unique 6-character room codes
- Track room host for permissions
- Handle host migration if host leaves

---

### [TASK-040] Create Game State Data Structures
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** None
**Blocked By:** None

**Description:**
Define Go structs for game state, player state, and card data.

**Acceptance Criteria:**
- [ ] Card struct (suit, value) defined
- [ ] Player struct (ID, username, hand, score, etc.) defined
- [ ] GameState struct (players, round, played cards, scores, etc.) defined
- [ ] JSON serialization tags added
- [ ] Helper methods for common operations

**Notes:**
- Keep structs serializable for WebSocket messages
- Add validation methods
- Use enums for suits and card values

---

### [TASK-041] Implement Card Deck Management
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-040]
**Blocked By:** None

**Description:**
Create deck of 35 cards with shuffling and dealing logic.

**Acceptance Criteria:**
- [ ] Deck initialization: 9 Hearts, 9 Clubs, 9 Diamonds, 8 Spades
- [ ] Card hierarchy defined (Ace highest, 6 lowest)
- [ ] Shuffle algorithm implemented (Fisher-Yates)
- [ ] Deal cards to players (5 cards each)
- [ ] Deal validation (enough cards for player count)
- [ ] Unit tests for deck operations

**Notes:**
- Reference PRD Section 2.2 for deck composition
- NO Ace of Spades in deck
- Use crypto/rand for secure shuffle

---

### [TASK-042] Add Player Connection Management
**Agent:** Backend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-039]
**Blocked By:** None

**Description:**
Handle player connections, disconnections, and reconnections.

**Acceptance Criteria:**
- [ ] Track active connections per player
- [ ] Remove player from room on disconnect
- [ ] Broadcast player leave event to room
- [ ] Handle reconnection within timeout (60 seconds)
- [ ] Clean up abandoned rooms (no players)
- [ ] Log connection events

**Notes:**
- Use player ID (from JWT) to track connections
- Allow reconnection to rejoin game
- Pause game if player disconnects mid-game (optional)

---

---

# WEEK 4: CORE GAME LOGIC

## Frontend Tasks

### [TASK-043] Implement Card Click Handlers
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-034]
**Blocked By:** None

**Description:**
Add interactivity to cards - hover, select, and play actions.

**Acceptance Criteria:**
- [ ] Cards respond to mouse hover (lift up, glow)
- [ ] Cards respond to click (select/play)
- [ ] Only current player's turn allows interaction
- [ ] Selected card highlighted
- [ ] Confirm play action (click again or dedicated button)
- [ ] Touch events work on mobile

**Notes:**
- Use Phaser's interactive input system
- Add visual feedback for all states
- Prevent playing cards out of turn

---

### [TASK-044] Create Card Play Animation
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-034], [TASK-043]
**Blocked By:** None

**Description:**
Animate cards moving from player hand to table center when played.

**Acceptance Criteria:**
- [ ] Card flies from hand to table center with arc motion
- [ ] Card bounces slightly on landing
- [ ] Animation duration: 400ms
- [ ] Sound effect plays (whoosh + thud)
- [ ] Card remains visible in center
- [ ] Multiple cards stack in center (offset positions)

**Notes:**
- Use Phaser tween with easing (Quad.Out for arc)
- Add rotation during flight for flair
- Position cards in a fan pattern in center

---

### [TASK-045] Display Played Cards in Table Center
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-044]
**Blocked By:** None

**Description:**
Render played cards prominently in the center of the table.

**Acceptance Criteria:**
- [ ] Played cards arranged in a row or fan pattern
- [ ] Cards labeled with player who played them (optional)
- [ ] Cards visible for all players
- [ ] Cards clear after round winner determined
- [ ] Smooth transition when clearing cards

**Notes:**
- Reference PRD Section 4.3 for layout
- Keep cards visible for 1 second after round ends
- Add glow effect to winning card

---

### [TASK-046] Implement Player Hand Management
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-034], [TASK-037]
**Blocked By:** None

**Description:**
Manage the current player's hand - add, remove, rearrange cards.

**Acceptance Criteria:**
- [ ] Cards arranged in a fan/arc at bottom of screen
- [ ] Cards remove from hand when played
- [ ] Remaining cards adjust positions smoothly
- [ ] Suit grouping option (optional)
- [ ] Card count updates
- [ ] Hand updates on receiving new cards

**Notes:**
- Use tweens for smooth repositioning
- Add drag-to-reorder functionality (optional)
- Calculate fan curve for aesthetic appeal

---

### [TASK-047] Implement Timer UI Component
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-009]
**Blocked By:** None

**Description:**
Create countdown timer display for player turns.

**Acceptance Criteria:**
- [ ] Timer displays above active player
- [ ] Timer counts down: 15s (leader), 8s, or 5s
- [ ] Timer changes color: green → yellow → red
- [ ] Timer pulses when < 3 seconds remain
- [ ] Timer resets for each player's turn
- [ ] Sound effect when timer expires (optional)

**Notes:**
- Sync timer with backend game state
- Add urgent warning at 3 seconds
- Handle timer expiration (auto-play random card)

---

### [TASK-048] Implement Round Winner Determination (Client-Side)
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-045]
**Blocked By:** None

**Description:**
Calculate and display round winner based on played cards (client validation only).

**Acceptance Criteria:**
- [ ] Identify highest card of led suit
- [ ] Highlight winning card with glow effect
- [ ] Display winner briefly (1 second)
- [ ] Winner indicator shown (crown icon, text)
- [ ] Clear played cards after display
- [ ] Prepare for next round

**Notes:**
- Backend is authoritative - this is optimistic display
- Reference PRD Section 2.4 for winner rules
- Handle edge case: no player has led suit

---

### [TASK-049] Connect Frontend to Backend Game State
**Agent:** Frontend
**Priority:** P0 (critical)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-044], [TASK-048], Backend TASK-051
**Blocked By:** Backend game state broadcast must be implemented

**Description:**
Synchronize frontend game state with backend via WebSocket events.

**Acceptance Criteria:**
- [ ] Listen for 'game:state_update' events
- [ ] Update Zustand store with received state
- [ ] Trigger Phaser scene updates on state change
- [ ] Handle 'game:card_played' events
- [ ] Handle 'game:round_winner' events
- [ ] Reconcile local and server state

**Notes:**
- This is a critical integration point
- Add error handling for state mismatches
- Log all state updates for debugging

---

## Backend Tasks

### [TASK-050] Implement Core Game Rules Validation
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-040], [TASK-041]
**Blocked By:** None

**Description:**
Create game rule engine to validate player actions.

**Acceptance Criteria:**
- [ ] Validate card ownership (player has card they're playing)
- [ ] Validate turn order (correct player's turn)
- [ ] Validate timer (action within time limit)
- [ ] Suit following validation (player has led suit)
- [ ] Round completion logic
- [ ] Unit tests for all validation rules

**Notes:**
- Reference PRD Section 2.4 for game rules
- Return clear error messages on invalid actions
- Log all validations for debugging

---

### [TASK-051] Implement Suit Following Logic
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-050]
**Blocked By:** None

**Description:**
Validate suit following rules and detect violations.

**Acceptance Criteria:**
- [ ] Determine led suit from first card played
- [ ] Check if player has cards of led suit
- [ ] Allow playing any card if no led suit
- [ ] Flag when player has suit but plays different card
- [ ] Prepare data for challenge system
- [ ] Unit tests for suit logic

**Notes:**
- Players are NOT forced to follow suit (strategic choice)
- Track potential violations for challenge mechanic
- Reference PRD Section 2.4

---

### [TASK-052] Implement Round Winner Calculation
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-050]
**Blocked By:** None

**Description:**
Calculate round winner based on played cards.

**Acceptance Criteria:**
- [ ] Identify cards matching led suit
- [ ] Find highest card of led suit
- [ ] Determine winner player ID
- [ ] Handle edge case: no player has led suit (leader wins default)
- [ ] Broadcast round winner to all clients
- [ ] Unit tests for winner calculation

**Notes:**
- Reference PRD Section 2.4 for rules
- Card hierarchy: Ace > King > Queen > Jack > 10 > 9 > 8 > 7 > 6
- Leader remains leader if no one has led suit

---

### [TASK-053] Implement Basic Scoring System
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-052]
**Blocked By:** None

**Description:**
Calculate and track player scores based on final round winner.

**Acceptance Criteria:**
- [ ] Track scores for all players
- [ ] Calculate points for final round winner (based on card value)
- [ ] Win with 6: 3 points, 7: 2 points, 8+: 1 point
- [ ] Broadcast score updates to clients
- [ ] Determine overall game winner
- [ ] Unit tests for scoring logic

**Notes:**
- Reference PRD Section 2.5 for scoring rules
- Dry/Show Dry bonus points implemented in Week 5
- Only final round (round 5) awards points

---

### [TASK-054] Implement Timer Management System
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-050]
**Blocked By:** None

**Description:**
Create timer system for player turns with automatic timeout handling.

**Acceptance Criteria:**
- [ ] Start timer when player's turn begins
- [ ] Timer durations: Leader 15s, next player 8s, others 5s
- [ ] Broadcast timer countdown to all clients (every second)
- [ ] Auto-play random valid card on timeout
- [ ] Cancel timer when player plays card
- [ ] Unit tests for timer logic

**Notes:**
- Use goroutines and time.After for timer
- Handle timer cancellation properly
- Log timeout events

---

### [TASK-055] Broadcast Game State Updates
**Agent:** Backend
**Priority:** P0 (critical)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-050], [TASK-052]
**Blocked By:** None

**Description:**
Implement periodic full game state broadcasts to prevent desyncs.

**Acceptance Criteria:**
- [ ] Broadcast full game state every 2 seconds
- [ ] Include all relevant data: players, scores, round, played cards, timers
- [ ] Send targeted updates on specific events (card played, round end)
- [ ] Optimize payload size (only send changed data where possible)
- [ ] Handle broadcast errors gracefully

**Notes:**
- Reference PRD Section 5.7 for sync strategy
- Full state prevents desyncs but increases traffic
- Consider delta updates as optimization later

---

---

# WEEK 5: ADVANCED MECHANICS

## Frontend Tasks

### [TASK-056] Implement Dry/Show Dry Declaration Modal
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-009], [TASK-046]
**Blocked By:** None

**Description:**
Create modal for declaring dry or show dry cards at game start.

**Acceptance Criteria:**
- [ ] Modal appears after cards dealt (5-second window)
- [ ] Display 6 or 7 cards from player's hand
- [ ] Buttons: Dry, Show Dry, Skip
- [ ] Show point values for each option
- [ ] Selected card removed from hand and displayed separately
- [ ] Send declaration to backend
- [ ] Modal matches PRD Section 4.5 design

**Notes:**
- Use Modal component from TASK-009
- Add countdown timer (5 seconds)
- Handle timeout (skip if no selection)

---

### [TASK-057] Add Dry Card Display
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-056]
**Blocked By:** None

**Description:**
Show declared dry/show dry card in a dedicated area for each player.

**Acceptance Criteria:**
- [ ] Dry card displayed face-down (left side of hand)
- [ ] Show Dry card displayed face-up (left side of hand)
- [ ] Label: "Dry" or "Show Dry"
- [ ] Card remains visible throughout game
- [ ] Opponents' show dry cards visible to all
- [ ] Opponents' dry cards hidden (back side)

**Notes:**
- Reference PRD Section 2.5 for dry mechanics
- Use special card back design for dry cards
- Add glow effect for show dry

---

### [TASK-058] Implement Flagging/Challenge UI
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-009]
**Blocked By:** None

**Description:**
Create flagging modal for challenging players on suit violations.

**Acceptance Criteria:**
- [ ] Modal appears when potential violation detected
- [ ] Show accused player and played card
- [ ] Show required suit
- [ ] Buttons: Flag (challenge) or Allow (no challenge)
- [ ] Display risk: -3 points if wrong
- [ ] 10-second timer for decision
- [ ] Modal matches PRD Section 4.8 design

**Notes:**
- Trigger when player plays non-led suit
- All players can challenge (first to flag wins)
- Auto-allow if timer expires

---

### [TASK-059] Implement Win Streak Tracking
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-048]
**Blocked By:** None

**Description:**
Track consecutive round wins and display streak counter.

**Acceptance Criteria:**
- [ ] Streak counter appears above player on 2+ wins
- [ ] Counter updates after each round
- [ ] Display: "2X COMBO!", "3X STREAK!"
- [ ] Reset streak when different player wins
- [ ] Trigger fire effect on 3-win streak
- [ ] Animate counter appearance

**Notes:**
- Reference PRD Section 2.6 for streak rules
- Streak only counts consecutive wins as leader
- Use arcade-style impact text

---

### [TASK-060] Create Fire Effect Particles
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-023], [TASK-059]
**Blocked By:** Fire particle textures must be delivered

**Description:**
Implement fire particle effects using Phaser emitters.

**Acceptance Criteria:**
- [ ] Fire particle emitter created with orange/red/yellow particles
- [ ] Fire effect triggers on 3-win streak
- [ ] Fire surrounds played card
- [ ] Heat distortion shader applied (optional)
- [ ] Screen shake effect (subtle)
- [ ] "ON FIRE!" text overlay with flames
- [ ] Sound effect plays

**Notes:**
- Use Phaser particle emitter system
- Reference PRD Section 3.3 for effect specs
- Keep performance smooth (60 FPS)

---

### [TASK-061] Create Freeze Effect Particles
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-023], [TASK-059]
**Blocked By:** Ice particle textures must be delivered

**Description:**
Implement freeze particle effects when breaking a fire streak.

**Acceptance Criteria:**
- [ ] Ice particle emitter created with blue crystalline particles
- [ ] Freeze effect triggers when fire streak broken
- [ ] Ice spreads across table from card
- [ ] Blue frost overlay on table surface
- [ ] "FROZEN!" text with ice shatter effect
- [ ] Sound effect plays

**Notes:**
- Use Phaser particle emitter system
- Reference PRD Section 3.3 for effect specs
- Particles should feel cold and sharp

---

### [TASK-062] Implement Screen Shake Effect
**Agent:** Frontend
**Priority:** P2 (medium)
**Size:** S (< 2 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-033]
**Blocked By:** None

**Description:**
Add camera shake effect for fire and explosion moments.

**Acceptance Criteria:**
- [ ] Screen shake function created
- [ ] Intensity and duration configurable
- [ ] Shake on fire effect (subtle)
- [ ] Shake on victory (moderate)
- [ ] No motion sickness (keep subtle)
- [ ] Option to disable in settings (future)

**Notes:**
- Use Phaser's camera.shake()
- Keep duration short (200-300ms)
- Amplitude: 5-10 pixels

---

### [TASK-063] Create Victory Screen
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-009], [TASK-053]
**Blocked By:** None

**Description:**
Build game over screen displaying winner and final scores.

**Acceptance Criteria:**
- [ ] "VICTORY!" text with explosion effect
- [ ] Winner name and avatar displayed
- [ ] Winning card shown
- [ ] Points earned displayed
- [ ] Final scores for all players (ranked)
- [ ] Buttons: Play Again, Main Menu
- [ ] Confetti particle effect
- [ ] Victory sound plays

**Notes:**
- Reference PRD Section 4.7 for design
- Add screen flash effect
- Zoom in on winner avatar

---

## Backend Tasks

### [TASK-064] Implement Dry Card Declaration Logic
**Agent:** Backend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-050]
**Blocked By:** None

**Description:**
Handle dry and show dry card declarations from players.

**Acceptance Criteria:**
- [ ] Accept dry declaration event (card, type: dry/show dry)
- [ ] Validate card is 6 or 7
- [ ] Validate card is in player's hand
- [ ] Store declaration in game state
- [ ] Remove declared card from playable hand
- [ ] Broadcast declarations to all players
- [ ] Unit tests for declaration logic

**Notes:**
- Reference PRD Section 2.5 for dry rules
- Only one dry declaration per player per game
- Show dry visible to all, dry hidden

---

### [TASK-065] Implement Challenge Validation Logic
**Agent:** Backend
**Priority:** P1 (high)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-051]
**Blocked By:** None

**Description:**
Handle flagging/challenge system with suit validation.

**Acceptance Criteria:**
- [ ] Accept challenge event (challenger ID, target ID)
- [ ] Check if target player had led suit in hand
- [ ] Award -3 points correctly (to violator or challenger)
- [ ] End round immediately on challenge
- [ ] Reveal target player's hand to all
- [ ] Deal new cards for next round
- [ ] Broadcast challenge result
- [ ] Unit tests for challenge logic

**Notes:**
- Reference PRD Section 2.4 for challenge rules
- High stakes: wrong challenges penalize challenger
- Log all challenges for analytics

---

### [TASK-066] Implement Win Streak Tracking (Backend)
**Agent:** Backend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-052]
**Blocked By:** None

**Description:**
Track consecutive wins for each player and trigger fire/freeze events.

**Acceptance Criteria:**
- [ ] Track streak count per player
- [ ] Increment on consecutive round win
- [ ] Reset streak when different player wins
- [ ] Broadcast fire event on 3-win streak
- [ ] Broadcast freeze event when fire streak broken
- [ ] Include streak data in game state updates

**Notes:**
- Reference PRD Section 2.6 for streak rules
- Only consecutive wins as leader count
- Freeze breaks any active fire streak

---

### [TASK-067] Implement Game Over and Final Scoring
**Agent:** Backend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-053], [TASK-064]
**Blocked By:** None

**Description:**
Handle game completion with final scoring including dry bonuses.

**Acceptance Criteria:**
- [ ] Detect when 5 rounds complete
- [ ] Calculate final round winner points
- [ ] Apply dry/show dry bonuses if applicable
- [ ] Determine overall game winner
- [ ] Save game results to database
- [ ] Broadcast game over event with final scores
- [ ] Clean up game state

**Notes:**
- Reference PRD Section 2.5 for scoring
- Dry bonuses: 6 (dry) = 6pts, 6 (show) = 12pts, 7 (dry) = 4pts, 7 (show) = 8pts
- Update player stats in database

---

---

# WEEK 6: POLISH & MATCHMAKING

## Frontend Tasks

### [TASK-068] Add Sound Effects to Game Actions
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-026], [TASK-044], [TASK-060], [TASK-061]
**Blocked By:** Sound assets must be delivered

**Description:**
Integrate sound effects for all major game actions.

**Acceptance Criteria:**
- [ ] Card deal sound plays on deal
- [ ] Card play sound (whoosh + thud) plays when card played
- [ ] Button click sounds on UI interactions
- [ ] Win round sound (ding) on round completion
- [ ] Fire ignition sound on fire effect
- [ ] Freeze sound on ice effect
- [ ] Victory music on game over
- [ ] Volume controls available in settings

**Notes:**
- Use Phaser sound manager
- Preload all sounds in BootScene
- Add mute button for quick silence

---

### [TASK-069] Implement Background Music System
**Agent:** Frontend
**Priority:** P2 (medium)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-026]
**Blocked By:** Music tracks must be sourced

**Description:**
Add background music with dynamic intensity based on game state.

**Acceptance Criteria:**
- [ ] Menu music plays on main menu
- [ ] Gameplay music plays during game
- [ ] Music intensity increases during fire streaks (optional)
- [ ] Victory music plays on win
- [ ] Smooth crossfade between tracks
- [ ] Music loops seamlessly
- [ ] Music volume separate from SFX

**Notes:**
- Use Phaser sound manager
- Add music toggle in settings
- Keep music upbeat but not distracting

---

### [TASK-070] Implement Chat Functionality
**Agent:** Frontend
**Priority:** P2 (medium)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-007]
**Blocked By:** None

**Description:**
Add basic text chat panel for player communication.

**Acceptance Criteria:**
- [ ] Chat panel toggleable (button in bottom right)
- [ ] Text input for messages
- [ ] Message history display (last 20 messages)
- [ ] Messages sent via WebSocket
- [ ] Messages received and displayed
- [ ] Player name prefixed to messages
- [ ] Auto-scroll to latest message

**Notes:**
- Keep chat simple for MVP
- Add profanity filter (future)
- Consider emote system (Phase 2)

---

### [TASK-071] Optimize Animations for 60 FPS
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** All animation tasks
**Blocked By:** None

**Description:**
Profile and optimize game performance to maintain 60 FPS.

**Acceptance Criteria:**
- [ ] Profile game with Chrome DevTools
- [ ] Identify bottlenecks (particles, tweens, etc.)
- [ ] Reduce particle count if needed
- [ ] Optimize sprite textures (compress, reduce size)
- [ ] Use object pooling for particles
- [ ] Test on low-end device
- [ ] Maintain 60 FPS during heavy effects

**Notes:**
- Target devices: iPhone 11, mid-range Android
- Disable effects on low-performance mode (future)
- Use Phaser's built-in performance monitoring

---

### [TASK-072] Add Loading States and Error Handling
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** All frontend tasks
**Blocked By:** None

**Description:**
Improve UX with loading indicators and graceful error handling.

**Acceptance Criteria:**
- [ ] Loading spinner during asset loading
- [ ] Loading indicator during WebSocket connection
- [ ] Error messages for connection failures
- [ ] Retry button on errors
- [ ] Graceful degradation if backend unavailable
- [ ] User-friendly error messages (no stack traces)

**Notes:**
- Use Toast notifications for errors
- Add reconnection attempts (3 retries)
- Log errors to console for debugging

---

### [TASK-073] Implement Reconnection Logic
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-007]
**Blocked By:** None

**Description:**
Handle WebSocket reconnection after disconnection.

**Acceptance Criteria:**
- [ ] Detect disconnect event
- [ ] Show reconnecting indicator to user
- [ ] Attempt reconnection with exponential backoff
- [ ] Restore game state on successful reconnection
- [ ] Handle reconnection failure (timeout after 60s)
- [ ] Notify user if reconnection fails

**Notes:**
- Backend must support reconnection (player ID preserved)
- Use Socket.io's built-in reconnection (configure)
- Save game state locally during reconnection

---

## Backend Tasks

### [TASK-074] Implement Matchmaking Queue System
**Agent:** Backend
**Priority:** P1 (high)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-039]
**Blocked By:** None

**Description:**
Create matchmaking queue to pair players for Quick Match.

**Acceptance Criteria:**
- [ ] Join queue endpoint/event
- [ ] Leave queue endpoint/event
- [ ] Match players when 2-4 available
- [ ] Create game room automatically on match
- [ ] Notify matched players
- [ ] Queue timeout handling (60 seconds)
- [ ] Support skill-based matchmaking (future - use random for MVP)

**Notes:**
- Start with simple FIFO queue
- Match 2 players immediately for MVP
- 3-4 player matches can wait for enough players

---

### [TASK-075] Add Quick Match Functionality
**Agent:** Backend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-074]
**Blocked By:** None

**Description:**
Connect matchmaking queue to game room creation.

**Acceptance Criteria:**
- [ ] Quick Match event triggers join queue
- [ ] Matched players moved to new game room
- [ ] Game settings auto-configured (default values)
- [ ] Game starts automatically when all ready
- [ ] Handle player leaving before game starts
- [ ] Broadcast match found to all matched players

**Notes:**
- Default settings: 10 points to win, poker table theme
- No AI opponents in Quick Match (MVP)
- Future: Add skill-based matching

---

### [TASK-076] Implement Player Stats Tracking
**Agent:** Backend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-067], [TASK-015]
**Blocked By:** None

**Description:**
Track player statistics and save to database.

**Acceptance Criteria:**
- [ ] Update stats on game completion
- [ ] Track: total games, wins, losses, points earned
- [ ] Track win rate percentage
- [ ] GET /stats/:playerId endpoint
- [ ] Stats displayed on profile (future)
- [ ] Leaderboard data preparation

**Notes:**
- Update stats atomically (transactions)
- Add indexes for fast queries
- Track head-to-head stats (Phase 2)

---

### [TASK-077] Add Leaderboard Queries
**Agent:** Backend
**Priority:** P2 (medium)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-076]
**Blocked By:** None

**Description:**
Create leaderboard endpoints for top players.

**Acceptance Criteria:**
- [ ] GET /leaderboard endpoint
- [ ] Sort by total wins, win rate, or points
- [ ] Pagination support (top 100)
- [ ] Time period filters (all-time, monthly, weekly)
- [ ] Response cached (5 minutes)
- [ ] Fast query performance (indexed)

**Notes:**
- Use database views for complex queries
- Add caching with Redis (optional)
- Leaderboard UI in Phase 2

---

### [TASK-078] Performance Optimization (Backend)
**Agent:** Backend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** All backend tasks
**Blocked By:** None

**Description:**
Profile and optimize backend performance for scalability.

**Acceptance Criteria:**
- [ ] Profile with pprof (CPU, memory)
- [ ] Optimize hot paths (game loop, message routing)
- [ ] Add database query indexes
- [ ] Optimize WebSocket broadcast (avoid N+1 sends)
- [ ] Connection pooling configured
- [ ] Load test with 50 concurrent games
- [ ] Response times < 50ms for game actions

**Notes:**
- Use Go's built-in profiling tools
- Optimize critical path: play card validation
- Consider message batching if needed

---

### [TASK-079] Add Comprehensive Error Handling
**Agent:** Backend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** All backend tasks
**Blocked By:** None

**Description:**
Improve error handling with clear messages and logging.

**Acceptance Criteria:**
- [ ] All errors logged with context (player ID, game ID, action)
- [ ] Error responses include user-friendly messages
- [ ] Validation errors return specific field errors
- [ ] Panic recovery middleware added
- [ ] Sentry or error tracking integrated (optional)
- [ ] Error rate monitoring

**Notes:**
- Use structured logging (zerolog or zap)
- Don't expose internal errors to clients
- Log stack traces for server errors

---

### [TASK-080] Write Unit Tests (Backend)
**Agent:** Backend
**Priority:** P1 (high)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** All backend logic tasks
**Blocked By:** None

**Description:**
Achieve 80%+ code coverage with unit tests.

**Acceptance Criteria:**
- [ ] Tests for deck management (shuffle, deal)
- [ ] Tests for game rules validation
- [ ] Tests for suit following logic
- [ ] Tests for winner calculation
- [ ] Tests for scoring (basic + dry bonuses)
- [ ] Tests for challenge system
- [ ] All tests pass
- [ ] Coverage report generated

**Notes:**
- Use Go's testing package
- Focus on business logic tests
- Mock WebSocket connections for integration tests

---

---

## Testing & QA (Both Frontend and Backend)

### [TASK-081] Manual End-to-End Testing
**Agent:** All
**Priority:** P0 (critical)
**Size:** L (4-8 hrs)
**Status:** ⬜ TODO
**Dependencies:** All tasks
**Blocked By:** None

**Description:**
Thoroughly test complete game flow from start to finish.

**Acceptance Criteria:**
- [ ] Complete 2-player game works end-to-end
- [ ] Complete 4-player game works end-to-end
- [ ] Dry card declaration and win works
- [ ] Show Dry card declaration and win works
- [ ] Challenge system works (correct and incorrect challenges)
- [ ] Fire streak and freeze effects trigger correctly
- [ ] Matchmaking works
- [ ] Reconnection works after disconnect
- [ ] All critical bugs documented and fixed

**Notes:**
- Test all user flows from PRD
- Test edge cases (timeouts, disconnections)
- Document all issues in bug tracker

---

### [TASK-082] Cross-Browser Testing
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-081]
**Blocked By:** None

**Description:**
Test game on multiple browsers for compatibility.

**Acceptance Criteria:**
- [ ] Test on Chrome (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (latest)
- [ ] Test on Edge (latest)
- [ ] Identify and fix browser-specific issues
- [ ] WebSocket connections work on all browsers
- [ ] Phaser canvas renders correctly on all browsers

**Notes:**
- Focus on latest browser versions for MVP
- Test on Mac and Windows
- Safari often has quirks - test thoroughly

---

### [TASK-083] Mobile Device Testing
**Agent:** Frontend
**Priority:** P1 (high)
**Size:** M (2-4 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-081]
**Blocked By:** None

**Description:**
Test game on actual mobile devices (iOS and Android).

**Acceptance Criteria:**
- [ ] Test on iPhone (iOS 15+)
- [ ] Test on Android phone (Android 10+)
- [ ] Touch interactions work correctly
- [ ] Game scales properly to mobile screens
- [ ] Performance acceptable (30+ FPS minimum)
- [ ] WebSocket stays connected
- [ ] Identify and fix mobile-specific issues

**Notes:**
- Test both portrait and landscape orientations
- Test on different screen sizes
- Check battery drain (important for mobile)

---

### [TASK-084] Fix Critical Bugs
**Agent:** All
**Priority:** P0 (critical)
**Size:** L (varies - budget 8 hrs)
**Status:** ⬜ TODO
**Dependencies:** [TASK-081], [TASK-082], [TASK-083]
**Blocked By:** None

**Description:**
Address all P0 and P1 bugs found during testing.

**Acceptance Criteria:**
- [ ] All P0 bugs fixed (game-breaking issues)
- [ ] All P1 bugs fixed (major issues)
- [ ] P2 bugs documented for future sprints
- [ ] Regression testing completed after fixes
- [ ] No new bugs introduced by fixes

**Notes:**
- Prioritize ruthlessly - fix blockers first
- Some P2/P3 bugs can be deferred post-MVP
- Keep bug list updated

---

---

# Summary Statistics

**Total Tasks:** 84
**Week 1:** 11 tasks (8 Frontend, 3 Backend)
**Week 2:** 10 tasks (5 Frontend, 5 Design)
**Week 3:** 11 tasks (7 Frontend, 4 Backend)
**Week 4:** 13 tasks (7 Frontend, 6 Backend)
**Week 5:** 12 tasks (8 Frontend, 4 Backend)
**Week 6:** 16 tasks (6 Frontend, 6 Backend, 4 Testing/QA)

**By Agent:**
- **Frontend Engineer:** 41 tasks
- **Backend Engineer:** 23 tasks
- **Designer:** 7 tasks
- **All/QA:** 3 tasks

**By Priority:**
- **P0 (Critical):** 30 tasks
- **P1 (High):** 42 tasks
- **P2 (Medium):** 12 tasks
- **P3 (Low):** 0 tasks

---

# Next Steps

1. **Review this task breakdown** with all agents
2. **Start Week 1 tasks immediately** (setup is blocking)
3. **Designer begins asset planning** in parallel with setup
4. **Daily standups** to track progress and unblock issues
5. **Update PROJECT_STATE.md** after completing each task

**Ready to ship in 6 weeks!** 🚀
