# 11 — E2E harness infrastructure

**What to build:** A one-command harness that boots a test-mode backend + frontend and drives real browsers with Playwright, plus the hooks needed to run deterministic acceptance scenarios.

**Blocked by:** 01, 02, 03

**Status:** ready-for-agent

- [ ] Backend `SPAR_TEST_MODE` (never enabled in production) bundling: DB-optional boot (server runs without Postgres; auth/stats degrade) and a hand-injection hook (set exact hands + deck order for named scenarios)
- [ ] Frontend test-only `window.__sparTest` game API (`playCard`, `flag`, `declareDry`, …), gated to test-mode, driving real actions through the full client→WS→backend→clients loop
- [ ] Playwright installed; config + multi-context scaffold under `frontend/e2e/`
- [ ] One command boots test-mode backend + frontend + suite; a smoke test passes end-to-end
- [ ] Assertions wait on state, not fixed sleeps (anti-flake)
