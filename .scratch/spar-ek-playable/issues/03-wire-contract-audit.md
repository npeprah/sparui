# Where do the frontend and backend disagree on the wire contract?

Type: research
Status: resolved
Blocked by: none

## Question

Map the WebSocket contract both sides actually implement and list every mismatch.

- Backend side: `backend/service/game-server/controller/websocket/websocket.go`
  (message parse/dispatch of `{event, data}` JSON), `connection_manager.go`,
  `card_format.go`, plus the room/matchmaking controllers — enumerate every inbound
  event handled and every outbound event broadcast, with payload shapes.
- Frontend side: `frontend/src/services/socketService.ts` (native WebSocket client) —
  every event it sends and every event it handles, with the TypeScript types it assumes.
- Also check `frontend/src/hooks/useSocket.ts` and the `socket.io-client` dependency:
  is anything still wired through Socket.IO, and does any component import `useSocket`?
- Known mismatch to start from: `LobbyScreen.tsx:156-161` reads `.players` off
  `RoomPlayerReadyResponse`, which the type says doesn't exist. Find the backend's
  actual payload for that event.
- Check the auth handshake: what the frontend sends on connect vs what the backend
  expects (JWT? player id?), and what happens for an unauthenticated 2-player test.

Deliverable: a two-column event map (frontend expects ↔ backend sends) with mismatches
marked, file:line references, and a verdict on whether the contract is documented
anywhere. Do not fix anything.

## Resolution

Audited (fresh-eyes subagent, read-only). **~18 distinct mismatches.** A 2-player private
game IS technically possible - but only because the two most load-bearing paths work
*despite* lying type declarations; everything around the core loop is degraded or dead.
The contract is **not documented as a single authoritative source** - the de-facto spec is
the `ServerToClientEvents`/`ClientToServerEvents` interfaces in `socketService.ts:15-95`,
which are themselves wrong in several places. Root cause: no shared schema binding the Go
structs to the TS types.

Biggest breakages:

1. **`lobby:update_settings`** - frontend sends it (`LobbyScreen.tsx:424`), backend has
   **no case** → falls through to `default: Unknown event` (`websocket.go:309`). Host
   settings changes silently dropped.
2. **`lobby:create` payload shape wrong** - frontend sends flat
   `{maxPlayers,pointsToWin,surfaceTheme}` (`HomePage.tsx:112`); backend expects
   `{settings:{...}}` (`websocket.go:981`). All room settings decode to zero values;
   `maxPlayers` isn't even a `RoomSettings` field.
3. **`room:player_left`** - frontend listens for it and reads `.players`/`.newHostId`
   (`LobbyScreen.tsx:125`); backend only emits **`lobby:player_left`** `{playerId, room}`
   (`websocket.go:1157`), plus `lobby:player_disconnected`/`lobby:player_removed` from the
   connection manager - none of which any component registers. Mid-game leaves/disconnects
   never update the UI.
4. **Entire matchmaking subsystem** (7 outbound events from `queue_manager.go`) has **zero
   frontend handlers** and the frontend emits no `matchmaking:*`. Quick-match unreachable.
5. **`timerUpdate` never sent by backend** - there is no server-side turn-timer broadcast
   anywhere (`turnChanged` only fires at round reset with a hardcoded 15). The game timer
   never counts down from the server. (Cross-ref ticket 02: timers computed but not
   streamed.)

Known mismatch confirmed: `LobbyScreen.tsx:156-161` reads `data.players` off
`room:player_ready`; type `RoomPlayerReadyResponse` (`store/types.ts:78-82`) omits
`players`, but the backend payload (`websocket.go:1237-1245`) DOES include it - so runtime
works, the type is a lie. Correct shape adds `players: LobbyPlayer[]`.

Card wire format is fine: backend always converts to `{suit, rank, id}` via
`card_format.go:40-47`; ranks mapped J/Q/K/A ↔ jack/queen/king/ace both directions.

Dead code confirmed: `socket.io-client` is vestigial (only a type-only import at
`hooks/useSocket.ts:4`); `useSocket.ts` is imported by no component and is itself broken
(calls Socket.IO methods the native client never emits). Both removable.

Auth handshake: frontend sends `{event:"auth", data:{token}}` where token is a
client-generated random string (NOT a JWT); backend `handleAuth` (`websocket.go:315-360`)
has `// TODO: Validate JWT properly` and accepts any non-empty token, deriving
`playerID = "player-" + token[:8]`. Works for an unauthenticated 2-player test, but two
tokens sharing the first 8 chars collide to the same id - no server-side uniqueness.

**Implication for the spec:** developer story 44 ("FE↔BE contract agrees exactly") is a
real, sizeable slice - name mismatches, payload-shape fixes, dead-listener cleanup, and
ideally a single shared contract source. The lobby-settings and player-left paths are
broken today even though the happy path limps through.
