# 04 — Backend: turn timers, expiry auto-play, and streaming

**What to build:** The server runs the turn timer that walks the clockwise sequence and pressures only the on-deck seat, streams the countdown to clients, and auto-plays a safe legal card on expiry so a game can never stall on an idle or dropped player.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] The timer applies to the on-deck seat only and walks the sequence as each play lands
- [ ] Durations: leader 15s, first follower 8s, subsequent followers 5s
- [ ] Server streams the timer countdown to all clients in the room
- [ ] On expiry: auto-play the player's lowest led-suit card if held, else their lowest card; the leader auto-plays their lowest to set the suit
- [ ] Table-driven tests for expiry behavior and the walking sequence
