package websocket

import "github.com/npeprah/sparui/backend/service/game-server/entity"

// ---------------------------------------------------------------------------
// WebSocket wire contract - SINGLE SOURCE OF TRUTH (Go side)
//
// This file is the authoritative Go definition of every WebSocket event
// exchanged between the game server and the client. It is mirrored, event for
// event and field for field, by the TypeScript file:
//
//	frontend/src/services/wireContract.ts
//
// RULE: any change here MUST be reflected there (and vice-versa). Every message
// on the wire is a JSON envelope { "event": string, "data": <payload> }; the
// payload structs below describe the `data` object for each event.
//
// Naming convention:
//   - room:*        room / lobby lifecycle (create, join, ready, leave, settings)
//   - game:*        in-game state (started, restarted, redirect)
//   - matchmaking:* quick-match queue
//   - bare names    (cardPlayed, roundWon, gameEnded, turnChanged, timerUpdate)
//     are legacy in-game events kept for compatibility with the Phaser scene.
//
// ---------------------------------------------------------------------------
//
// CLIENT -> SERVER events (inbound; see handleMessage dispatch in websocket.go)
//
//	auth                  AuthPayload            authenticate the connection
//	lobby:create          CreateLobbyPayload     create a private room
//	lobby:join            JoinLobbyPayload       join a room by code
//	lobby:leave           {}                     leave the current room
//	lobby:ready           ReadyPayload           toggle ready state
//	lobby:start_game      {}                     host starts the game
//	lobby:update_settings UpdateSettingsPayload  host changes room settings
//	game:play_card        PlayCardPayload        play a card
//	game:declare_dry      DeclareDryPayload      declare a dry / show-dry card
//	game:flag_player      FlagPlayerPayload      challenge a suspected dry
//	game:restart          {}                     host restarts the game
//	matchmaking:join      {}                     join the quick-match queue
//	matchmaking:leave     {}                     leave the quick-match queue
//	matchmaking:status    {}                     request current queue status
//
// SERVER -> CLIENT events (outbound)
//
//	auth:success            AuthSuccessPayload
//	auth:error              ErrorPayload
//	room:created            RoomCreatedPayload
//	room:player_joined      RoomPlayerJoinedPayload
//	room:player_left        RoomPlayerLeftPayload      (leave OR disconnect-timeout removal)
//	room:player_ready       RoomPlayerReadyPayload
//	room:player_disconnected RoomPlayerDisconnectedPayload (transient; reconnect window open)
//	room:settings_updated   RoomSettingsUpdatedPayload
//	lobby:left              MessagePayload             (confirmation to the leaver)
//	lobby:error             ErrorPayload
//	game:started            GameStartedPayload
//	game:restarted          GameStartedPayload
//	game:redirect           GameRedirectPayload        (matchmaking match -> game room)
//	cardPlayed              CardPlayedPayload
//	roundWon                RoundWonPayload
//	gameEnded               GameEndedPayload
//	turnChanged             TurnChangedPayload
//	timerUpdate             TimerUpdatePayload         (see ticket 04 - engine emits this)
//	matchmaking:joined      MatchmakingJoinedPayload
//	matchmaking:left        MatchmakingLeftPayload
//	matchmaking:timeout     MatchmakingTimeoutPayload
//	matchmaking:match_found MatchmakingMatchFoundPayload
//	matchmaking:status      QueueStatus
//	matchmaking:status_update QueueStatus
//	matchmaking:error       ErrorPayload               (queue join/leave/status failures)
//	error                   ErrorPayload
//
// ---------------------------------------------------------------------------

// AuthPayload is the data for the inbound `auth` event.
type AuthPayload struct {
	Token string `json:"token"`
}

// CreateLobbyPayload is the data for the inbound `lobby:create` event.
// The settings are nested so the whole RoomSettings object flows through
// untouched (the previous flat shape decoded to zero values).
type CreateLobbyPayload struct {
	Settings entity.RoomSettings `json:"settings"`
}

// JoinLobbyPayload is the data for the inbound `lobby:join` event.
type JoinLobbyPayload struct {
	RoomCode string `json:"roomCode"`
}

// ReadyPayload is the data for the inbound `lobby:ready` event.
type ReadyPayload struct {
	IsReady bool `json:"isReady"`
}

// UpdateSettingsPayload is the data for the inbound `lobby:update_settings`
// event. Fields are pointers so the host may send a partial update; unset
// fields are merged over the room's existing settings.
type UpdateSettingsPayload struct {
	Settings PartialSettingsPayload `json:"settings"`
}

// PartialSettingsPayload carries an optional subset of room settings.
type PartialSettingsPayload struct {
	PointsToWin  *int    `json:"pointsToWin,omitempty"`
	SurfaceTheme *string `json:"surfaceTheme,omitempty"`
	MaxPlayers   *int    `json:"maxPlayers,omitempty"`
}

// TimerUpdatePayload is the data for the outbound `timerUpdate` event.
//
// CONTRACT OWNED BY TICKET 02, EMITTED BY TICKET 04 (the turn-timer engine).
// The client reads SecondsRemaining as the authoritative countdown value and
// ticks down locally between server emissions. PlayerID identifies whose turn
// timer is running; TurnDurationSeconds is the full length of the turn (used
// for the progress ring). Ticket 04 MUST broadcast this exact shape.
type TimerUpdatePayload struct {
	PlayerID            string `json:"playerId"`
	SecondsRemaining    int    `json:"secondsRemaining"`
	TurnDurationSeconds int    `json:"turnDurationSeconds,omitempty"`
}
