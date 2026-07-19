# 02 — Frontend↔backend wire-contract alignment

**What to build:** The frontend and backend agree exactly on the WebSocket contract, from a single source of truth, so no screen reads a field the server never sends and the currently-broken paths (host settings, player-left, turn timer) work end to end.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Every frontend-consumed event matches the backend payload shape (event name + fields); no reads of absent fields
- [ ] `lobby:create` payload shape fixed so room settings actually apply (not decoded to zero values)
- [ ] `lobby:update_settings` handled by the backend — host settings changes take effect
- [ ] Player-left / disconnect event name + shape aligned; leaves and disconnects update the UI
- [ ] Backend streams turn-timer updates; the client timer counts down from the server (not a hardcoded value)
- [ ] A single shared contract definition both sides follow (source of truth)
- [ ] Auth handshake consistent; an unauthenticated 2-player test connects with unique player ids
